using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Nodes;
using Stripe;
using Stripe.Checkout;
using api.Models;
using api.services;
using api.Services;
using Azure.Storage.Blobs;
using Azure.Messaging.ServiceBus;
using Azure.Identity;

namespace api
{

    public class CreateStripeCheckoutSession
    {
        private readonly ILogger<CreateStripeCheckoutSession> _logger;
        private readonly PersistStoreService _persistStoreService;
        private static readonly JsonSerializerOptions UnsafeJsonOptions = new()
        {
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        private static readonly JsonSerializerOptions PrettyUnsafeJsonOptions = new()
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public CreateStripeCheckoutSession(
            ILogger<CreateStripeCheckoutSession> logger,
            PersistStoreService persistStoreService)
        {
            _logger = logger;
            _persistStoreService = persistStoreService;
        }

        [Function("CreateStripeCheckoutSession")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            _logger.LogInformation("CreateStripeCheckoutSession: Starting form submission process");

            try
            {
                // 0. Ensure the user is authenticated
                var auth = EasyAuthGuard.RequireAuthenticatedUser(req);
                if (auth != null) return auth;

                // 1. Deserialize submission from request body
                var submission = await DeserializeSubmissionAsync(req);
                if (submission == null || string.IsNullOrEmpty(submission.SubmissionId))
                {
                    return new BadRequestObjectResult(new { error = "Invalid submission data" });
                }

                _logger.LogInformation($"Processing submission: {submission.SubmissionId}");

                // 2. Validate and configure Stripe
                var stripeConfigError = ValidateAndConfigureStripe();
                if (stripeConfigError != null)
                {
                    return stripeConfigError;
                }

                // 3. Build form data and complete submission data
                var formDataElement = BuildFormDataWithoutSignature(submission);
                var completeSubmissionData = BuildCompleteSubmissionData(submission, formDataElement);
                var containerClient = CreateBlobContainerClient();
                var (submissionJson, formDataBlobClient) = await SaveSubmissionArtifactsAsync(
                    containerClient,
                    submission,
                    formDataElement,
                    completeSubmissionData);

                _logger.LogInformation($"Form data size (without signature): {submissionJson.Length} bytes");

                // 4. Resolve applicant names and build Stripe metadata
                var applicantNames = ResolveApplicantNames(formDataElement, submission.UserName);
                var metadata = BuildStripeMetadata(submission, applicantNames);

                _logger.LogInformation("FormType: {FormType}, price: {Price}, FeeSm: {FeeSm}, SmLogic: '{SmLogic}', " +
                    "Storing submission metadata for LawID: {LawSocietyId}", submission.FormType, submission.price, submission.FeeSm, 
                    submission.SmLogic, submission.LawSocietyId);

                // 5. If price is 0 (e.g. Law Society Member), skip Stripe and send Service Bus message directly
                if (submission.price == 0)
                {
                    return await HandleFreeSubmissionAsync(submission, containerClient, formDataBlobClient, formDataElement, applicantNames);
                }

                // 6. Build Stripe line items and create checkout session
                var lineItems = BuildStripeLineItems(submission);
                var options = BuildSessionCreateOptions(req, submission, lineItems, metadata);
                var service = new SessionService();
                Session session = await service.CreateAsync(options);

                _logger.LogInformation($"Stripe session created: {session.Id}");

                // 7. Return standardized response to React
                return new OkObjectResult(new FormSubmissionResponse
                {
                    Success = true,
                    SubmissionId = submission.SubmissionId,
                    CheckoutUrl = session.Url,
                    SessionId = session.Id,
                    Message = "Checkout session created successfully"
                });
            }
            catch (StripeException stripeEx)
            {
                _logger.LogError($"Stripe error: {stripeEx.Message}");
                return new ObjectResult(new { error = "Payment service error", details = stripeEx.Message })
                {
                    StatusCode = 500
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CreateStripeCheckoutSession: {ex.Message}");
                return new ObjectResult(new { error = "Failed to process submission", details = ex.Message })
                {
                    StatusCode = 500
                };
            }
        }

        private static async Task<FormSubmissionRequest?> DeserializeSubmissionAsync(HttpRequest req)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            return JsonSerializer.Deserialize<FormSubmissionRequest>(requestBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        private IActionResult? ValidateAndConfigureStripe()
        {
            var stripeSecretKey = Environment.GetEnvironmentVariable("StripeSecretKey");
            if (string.IsNullOrEmpty(stripeSecretKey))
            {
                _logger.LogError("StripeSecretKey not configured");
                return new ObjectResult(new { error = "Stripe configuration missing" }) { StatusCode = 500 };
            }

            StripeConfiguration.ApiKey = stripeSecretKey;
            return null;
        }

        private JsonElement BuildFormDataWithoutSignature(FormSubmissionRequest submission)
        {
            try
            {
                var formDataElement = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(submission.FormData, UnsafeJsonOptions));

                // Some forms nest a large base64 signature image under either "signature" or "declaration".
                // Strip only that leaf field to keep payload size manageable while preserving all other fields.
                foreach (var parentFieldName in new[] { "signature", "declaration" })
                {
                    if (!formDataElement.TryGetProperty(parentFieldName, out JsonElement parentElement))
                    {
                        continue;
                    }

                    var parentDict = new Dictionary<string, object>();
                    foreach (var prop in parentElement.EnumerateObject())
                    {
                        if (prop.Name != "signature")
                        {
                            parentDict[prop.Name] = prop.Value;
                        }
                    }

                    var formDataDict = new Dictionary<string, object>();
                    foreach (var prop in formDataElement.EnumerateObject())
                    {
                        if (prop.Name != parentFieldName)
                        {
                            formDataDict[prop.Name] = prop.Value;
                        }
                        else
                        {
                            formDataDict[parentFieldName] = parentDict;
                        }
                    }

                    return JsonSerializer.SerializeToElement(formDataDict, UnsafeJsonOptions);
                }

                return formDataElement;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Could not remove signature from form data: {ex.Message}");
                return JsonSerializer.SerializeToElement(submission.FormData, UnsafeJsonOptions);
            }
        }

        private static object BuildCompleteSubmissionData(FormSubmissionRequest submission, JsonElement formDataElement)
        {
            string dateFormat = Environment.GetEnvironmentVariable("DateFormat") ?? "yyyy-MM-ddTHH:mm:ss.fff+00:00";
            return new
            {
                SubmissionId = submission.SubmissionId,
                FormType = submission.FormType,
                SubmittedAt = DateTime.UtcNow.ToString(dateFormat),
                FormData = formDataElement
            };
        }

        private static BlobContainerClient CreateBlobContainerClient()
        {
            var credential = new DefaultAzureCredential();
            var storageAccountName = Environment.GetEnvironmentVariable("StorageAccountName");
            var blobServiceClient = new BlobServiceClient(
                new Uri($"https://{storageAccountName}.blob.core.windows.net"),
                credential
            );
            var blobContainerName = Environment.GetEnvironmentVariable("blobContainerName");
            return blobServiceClient.GetBlobContainerClient(blobContainerName);
        }

        private async Task<(string SubmissionJson, BlobClient FormDataBlobClient)> SaveSubmissionArtifactsAsync(
            BlobContainerClient containerClient,
            FormSubmissionRequest submission,
            JsonElement formDataElement,
            object completeSubmissionData)
        {
            string submissionJson = JsonSerializer.Serialize(completeSubmissionData, PrettyUnsafeJsonOptions);

            byte[] pdfBytes = api.Services.FormPdfGenerator.GenerateFormPdf(
                submission.FormName ?? submission.FormType ?? "Unknown Form",
                formDataElement,
                submission.FieldLabels,
                submission.SectionLabels
            );
            _logger.LogInformation($"Generated PDF size: {pdfBytes.Length} bytes");

            // Save PDF to blob storage
            string pdfBlobName = $"submissions/{submission.SubmissionId}/eForm.pdf";
            var pdfBlobClient = containerClient.GetBlobClient(pdfBlobName);
            using (var ms = new MemoryStream(pdfBytes))
            {
                await pdfBlobClient.UploadAsync(ms, overwrite: true);
            }
            _logger.LogInformation($"Saved form data PDF to blob: {pdfBlobName}");

            // Save form data JSON to blob storage for later database persistence
            string formDataBlobName = $"submissions/{submission.SubmissionId}/formData.json";
            var formDataBlobClient = containerClient.GetBlobClient(formDataBlobName);
            using (var formDataStream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(submissionJson)))
            {
                await formDataBlobClient.UploadAsync(formDataStream, overwrite: true);
            }
            _logger.LogInformation($"Saved form source data JSON to blob: {formDataBlobName}");

            return (submissionJson, formDataBlobClient);
        }

        private static string? TryReadStringFromObject(JsonElement obj, params string[] keys)
        {
            if (obj.ValueKind != JsonValueKind.Object)
                return null;

            foreach (var key in keys)
            {
                if (obj.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
                {
                    var text = value.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                        return text.Trim();
                }
            }

            return null;
        }

        private static string? ExtractApplicantField(JsonElement root, params string[] keys)
        {
            if (root.ValueKind != JsonValueKind.Object)
                return null;

            foreach (var containerName in new[] { "applicantDetails", "applicant", "personalDetails", "yourDetails" })
            {
                if (root.TryGetProperty(containerName, out var container))
                {
                    var fromContainer = TryReadStringFromObject(container, keys);
                    if (!string.IsNullOrWhiteSpace(fromContainer))
                        return fromContainer;
                }
            }

            // fall back to reading directly from the root object
            return TryReadStringFromObject(root, keys);
        }

        private static string? ExtractApplicantFullName(JsonElement root)
        {
            if (root.ValueKind != JsonValueKind.Object)
                return null;

            foreach (var containerName in new[] { "applicantDetails", "applicant", "personalDetails", "yourDetails" })
            {
                if (root.TryGetProperty(containerName, out var container))
                {
                    var fromContainer = TryReadStringFromObject(container, "fullName", "FullName", "name", "Name");
                    if (!string.IsNullOrWhiteSpace(fromContainer))
                        return fromContainer;
                }
            }

            return TryReadStringFromObject(root, "fullName", "FullName", "name", "Name");
        }

        private static (string? First, string? Middle, string? Last) SplitFullName(string? fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return (null, null, null);

            var parts = fullName
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToArray();

            if (parts.Length == 0)
                return (null, null, null);

            if (parts.Length == 1)
                return (parts[0], null, null);

            if (parts.Length == 2)
                return (parts[0], null, parts[1]);

            var middle = string.Join(' ', parts.Skip(1).Take(parts.Length - 2));
            return (parts[0], middle, parts[^1]);
        }

        private static (string? First, string? Middle, string? Last) ResolveApplicantNames(JsonElement formDataElement, string? userNameFallback)
        {
            var applicantFirstName = ExtractApplicantField(formDataElement, "firstName", "FirstName");
            var applicantMiddleOrOtherName = ExtractApplicantField(formDataElement, "middleNames", "otherNames", "middleName", "MiddleNames", 
                "OtherNames", "otherName", "OtherName");
            var applicantSurname = ExtractApplicantField(formDataElement, "surname", "lastName", "Surname", "LastName");

            // If structured names are incomplete, infer from a full-name field (or authenticated username fallback).
            if (string.IsNullOrWhiteSpace(applicantFirstName) || string.IsNullOrWhiteSpace(applicantSurname))
            {
                var fullNameSource = ExtractApplicantFullName(formDataElement);
                if (string.IsNullOrWhiteSpace(fullNameSource))
                {
                    fullNameSource = userNameFallback;
                }

                var parsedName = SplitFullName(fullNameSource);
                applicantFirstName ??= parsedName.First;
                applicantMiddleOrOtherName ??= parsedName.Middle;
                applicantSurname ??= parsedName.Last;
            }

            return (applicantFirstName, applicantMiddleOrOtherName, applicantSurname);
        }

        private static Dictionary<string, string> BuildStripeMetadata(
            FormSubmissionRequest submission,
            (string? First, string? Middle, string? Last) applicantNames)
        {
            return new Dictionary<string, string>
            {
                { "submission_id", submission.SubmissionId },
                { "form_type", submission.FormType ?? "unknown" },
                { "law_society_id", submission.LawSocietyId ?? "unknown" },
                { "user_email", submission.UserEmail ?? "unknown" },
                { "user_name", submission.UserName ?? "unknown" },
                { "first_name", applicantNames.First ?? "" },
                { "middle_name", applicantNames.Middle ?? "" },
                { "surname", applicantNames.Last ?? "" },
                { "business_unit", submission.Metadata?.BusinessUnit ?? "unknown" },
                { "sku", submission.Metadata?.Sku ?? "unknown" },
                { "receipt_category", submission.Metadata?.ReceiptCategory ?? "unknown" }
            };
        }

        private async Task<IActionResult> HandleFreeSubmissionAsync(
            FormSubmissionRequest submission,
            BlobContainerClient containerClient,
            BlobClient formDataBlobClient,
            JsonElement formDataElement,
            (string? First, string? Middle, string? Last) applicantNames)
        {
            _logger.LogInformation("Price is 0 - skipping Stripe, sending directly to Service Bus");

            // Free submissions still follow the same downstream processing path via Service Bus.
            var (attachmentUrls, formDataUrl) = await GetSubmissionAttachmentUrlsAsync(containerClient, submission.SubmissionId);

            var freeMessageData = new PaymentCompletedMessage
            {
                SubmissionId = submission.SubmissionId,
                FormType = submission.FormType ?? string.Empty,
                ReceiptCategory = submission.Metadata?.ReceiptCategory,
                LawSocietyId = submission.LawSocietyId,
                UserEmail = submission.UserEmail,
                UserName = submission.UserName,
                FirstName = applicantNames.First,
                MiddleOrOtherName = applicantNames.Middle,
                Surname = applicantNames.Last,
                BusinessUnit = submission.Metadata?.BusinessUnit,
                Sku = submission.Metadata?.Sku,
                PaymentStatus = "no_payment_required",
                StripeSessionId = string.Empty,
                PaymentIntentId = null,
                TotalAmount = 0,
                AttachmentUrls = attachmentUrls,
                FormDataUrl = formDataUrl,
                ProcessedAt = DateTime.UtcNow.ToString(Environment.GetEnvironmentVariable("DateFormat"))
            };

            string freeMessageJson = JsonSerializer.Serialize(freeMessageData);
            _logger.LogInformation($"Free submission Service Bus message: {freeMessageJson.Substring(0, Math.Min(200, freeMessageJson.Length))}...");

            await SendServiceBusMessageForFreeSubmissionAsync(submission, freeMessageJson);
            await PersistFreeSubmissionAsync(submission, formDataElement);
            await DeleteFormDataBlobIfExistsAsync(formDataBlobClient, submission.SubmissionId);

            return new OkObjectResult(new FormSubmissionResponse
            {
                Success = true,
                SubmissionId = submission.SubmissionId,
                CheckoutUrl = null,
                SessionId = null,
                Message = "Form submitted successfully (no payment required)"
            });
        }

        private static async Task<(List<string> AttachmentUrls, string? FormDataUrl)> GetSubmissionAttachmentUrlsAsync(
            BlobContainerClient containerClient,
            string submissionId)
        {
            var attachmentUrls = new List<string>();
            string? formDataUrl = null;
            string blobPrefix = $"submissions/{submissionId}/";

            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: blobPrefix))
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                // Historical contract: FormDataUrl points to the generated eForm PDF location.
                if (blobItem.Name.EndsWith("/eForm.pdf"))
                {
                    formDataUrl = blobClient.Uri.ToString();
                }
                else if (blobItem.Name.EndsWith("/formData.json"))
                {
                    // Internal staging payload is not part of message attachments.
                    continue;
                }
                else
                {
                    attachmentUrls.Add(blobClient.Uri.ToString());
                }
            }

            return (attachmentUrls, formDataUrl);
        }

        private async Task SendServiceBusMessageForFreeSubmissionAsync(FormSubmissionRequest submission, string freeMessageJson)
        {
            var sbConnection = Environment.GetEnvironmentVariable("ServiceBusConnection__fullyQualifiedNamespace");
            var sbTopicName = Environment.GetEnvironmentVariable("ServiceBusTopicName") ?? "form-submissions";

            if (!string.IsNullOrEmpty(sbConnection))
            {
                await using var sbClient = new ServiceBusClient(sbConnection, new DefaultAzureCredential());
                await using ServiceBusSender sbSender = sbClient.CreateSender(sbTopicName);

                var sbMessageId = $"{submission.SubmissionId}-{DateTime.UtcNow.Ticks}";
                var sbMessage = new ServiceBusMessage(freeMessageJson)
                {
                    ContentType = "application/json",
                    Subject = submission.FormType,
                    MessageId = sbMessageId
                };
                sbMessage.ApplicationProperties.Add("SubmissionId", submission.SubmissionId);
                sbMessage.ApplicationProperties.Add("FormType", submission.FormType ?? "unknown");
                sbMessage.ApplicationProperties.Add("BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown");

                await sbSender.SendMessageAsync(sbMessage);
                _logger.LogInformation($"Service Bus message sent for free submission: {sbMessageId}");
            }
            else
            {
                _logger.LogWarning("ServiceBusConnection not configured - skipping Service Bus send for free submission");
            }
        }

        private async Task PersistFreeSubmissionAsync(FormSubmissionRequest submission, JsonElement formDataElement)
        {
            var orderedFormData = BuildPersistedFormData(formDataElement, submission.SubmissionId);

            var freePersistPayload = JsonSerializer.Serialize(new
            {
                formData = orderedFormData,
                paymentData = (object?)null
            });

            var inserted = await _persistStoreService.SaveAsync(
                submission.LawSocietyId,
                submission.FormType,
                submission.SubmissionId,
                freePersistPayload);

            if (inserted)
            {
                _logger.LogInformation("PersistStore row created for free submission {SubmissionId}", submission.SubmissionId);
            }
            else
            {
                _logger.LogWarning("Duplicate submission detected, skipping PersistStore insert for free submission {SubmissionId}", submission.SubmissionId);
            }
        }

        private async Task DeleteFormDataBlobIfExistsAsync(BlobClient formDataBlobClient, string submissionId)
        {
            try
            {
                await formDataBlobClient.DeleteIfExistsAsync();
                _logger.LogInformation("Deleted staging formData.json for free submission {SubmissionId}", submissionId);
            }
            catch (Exception cleanupEx)
            {
                _logger.LogWarning("Could not delete formData.json for free submission {SubmissionId}: {Error}", submissionId, cleanupEx.Message);
            }
        }

        private List<SessionLineItemOptions> BuildStripeLineItems(FormSubmissionRequest submission)
        {
            var lineItems = new List<SessionLineItemOptions>();
            var currency = Environment.GetEnvironmentVariable("currency");
            var taxRateId = Environment.GetEnvironmentVariable("StripeTaxRateId") ?? "txr_1T73SS2KBD4hUfAbbybh5vEw";

            if (submission.LineItems != null && submission.LineItems.Count > 0)
            {
                foreach (var item in submission.LineItems)
                {
                    var li = new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = currency,
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = item.Name,
                                Description = $"LawID: {submission.LawSocietyId} | {submission.SubmissionId}",
                                Metadata = new Dictionary<string, string>
                                {
                                    { "BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown" },
                                    { "SKU", submission.Metadata?.Sku ?? "unknown" }
                                }
                            },
                            UnitAmount = item.AmountCents,
                        },
                        Quantity = 1,
                    };
                    if (item.HasGst)
                        li.TaxRates = new List<string> { taxRateId };
                    lineItems.Add(li);
                }

                return lineItems;
            }

            bool smHasGst = submission.FeeSm > 0 &&
                            !string.IsNullOrEmpty(submission.SmLogic) &&
                            !submission.SmLogic.Contains("No GST", StringComparison.OrdinalIgnoreCase) &&
                            !submission.SmLogic.Contains("OA (code-computed)", StringComparison.OrdinalIgnoreCase);

            _logger.LogInformation($"smHasGst: {smHasGst} (FeeSm={submission.FeeSm}, SmLogic='{submission.SmLogic}')");

            if (smHasGst)
            {
                // Split checkout into non-membership + membership line so GST is applied only to the membership component.
                long nonSmAmount = (long)Math.Round((submission.price - submission.FeeSm) * 100);
                if (nonSmAmount > 0)
                {
                    lineItems.Add(new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = currency,
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = submission.FormName,
                                Description = $"LawID: {submission.LawSocietyId} | {submission.SubmissionId}",
                                Metadata = new Dictionary<string, string>
                                {
                                    { "BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown" },
                                    { "SKU", submission.Metadata?.Sku ?? "unknown" }
                                }
                            },
                            UnitAmount = nonSmAmount,
                        },
                        Quantity = 1,
                    });
                }

                string gstLineName = submission.SmLogic?.Contains("Associate Membership") == true
                    ? "Associate Membership"
                    : (nonSmAmount == 0 ? (submission.FormName ?? submission.FormType ?? "Form Submission") : "Law Society Membership");
                lineItems.Add(new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = gstLineName,
                            Description = $"LawID: {submission.LawSocietyId} | {submission.SubmissionId} (incl. GST)",
                            Metadata = new Dictionary<string, string>
                            {
                                { "BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown" },
                                { "SKU", submission.Metadata?.Sku ?? "unknown" }
                            }
                        },
                        UnitAmount = (long)Math.Round(submission.FeeSm * 100),
                    },
                    Quantity = 1,
                    TaxRates = new List<string> { taxRateId }
                });
            }
            else
            {
                lineItems.Add(new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = submission.FormName,
                            Description = $"LawID: {submission.LawSocietyId} | {submission.SubmissionId}",
                            Metadata = new Dictionary<string, string>
                            {
                                { "BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown" },
                                { "SKU", submission.Metadata?.Sku ?? "unknown" }
                            }
                        },
                        UnitAmount = (long)submission.price * 100,
                    },
                    Quantity = 1,
                });
            }

            return lineItems;
        }

        private static SessionCreateOptions BuildSessionCreateOptions(
            HttpRequest req,
            FormSubmissionRequest submission,
            List<SessionLineItemOptions> lineItems,
            Dictionary<string, string> metadata)
        {
            return new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = lineItems,
                Mode = "payment",
                SuccessUrl = $"{req.Headers["Origin"]}/submission-success?session_id={{CHECKOUT_SESSION_ID}}" +
                    $"&formType={Uri.EscapeDataString(submission.FormType ?? string.Empty)}",
                CancelUrl = $"{req.Headers["Origin"]}",
                Metadata = metadata,
                PaymentIntentData = new SessionPaymentIntentDataOptions
                {
                    Description = $"SKU-{submission.Metadata?.Sku ?? "unknown"}"
                },
                InvoiceCreation = new SessionInvoiceCreationOptions
                {
                    Enabled = true,
                    InvoiceData = new SessionInvoiceCreationInvoiceDataOptions
                    {
                        CustomFields = new List<SessionInvoiceCreationInvoiceDataCustomFieldOptions>
                        {
                            new SessionInvoiceCreationInvoiceDataCustomFieldOptions
                            {
                                Name = "Business Unit",
                                Value = submission.Metadata?.BusinessUnit ?? "unknown"
                            },
                            new SessionInvoiceCreationInvoiceDataCustomFieldOptions
                            {
                                Name = "SKU",
                                Value = submission.Metadata?.Sku ?? "unknown"
                            }
                        },
                        Metadata = new Dictionary<string, string>
                        {
                            { "BusinessUnit", submission.Metadata?.BusinessUnit ?? "unknown" },
                            { "SKU", submission.Metadata?.Sku ?? "unknown" },
                            { "SubmissionId", submission.SubmissionId }
                        }
                    }
                }
            };
        }

        private static JsonObject BuildPersistedFormData(JsonElement sourceFormData, string submissionId)
        {
            var orderedFormData = new JsonObject
            {
                ["submissionId"] = submissionId
            };

            if (sourceFormData.ValueKind != JsonValueKind.Object)
            {
                return orderedFormData;
            }

            foreach (var property in sourceFormData.EnumerateObject())
            {
                if (!string.Equals(property.Name, "submissionId", StringComparison.OrdinalIgnoreCase))
                {
                    orderedFormData[property.Name] = JsonNode.Parse(property.Value.GetRawText());
                }
            }

            return orderedFormData;
        }
    }
}
