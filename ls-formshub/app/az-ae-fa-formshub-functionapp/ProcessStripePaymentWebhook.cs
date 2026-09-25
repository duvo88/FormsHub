using api.Models;
using api.Services;
using Azure.Identity;
using Azure.Messaging.ServiceBus;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Stripe;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace api
{
    public class ProcessStripePaymentWebhook
    {
        private readonly ILogger<ProcessStripePaymentWebhook> _logger;
        private readonly PersistStoreService _persistStoreService;
        private static readonly JsonSerializerOptions CamelCaseJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        // PoV-only idempotency. In production use persistent storage (Cosmos/SQL/Redis).
        private static readonly ConcurrentDictionary<string, DateTime> ProcessedSessions = new();

        public ProcessStripePaymentWebhook(ILogger<ProcessStripePaymentWebhook> logger,
            PersistStoreService persistStoreService)
        {
            _logger = logger;
            _persistStoreService = persistStoreService;
        }

        private string GetUtcTime()
        {
            string dateFormat = Environment.GetEnvironmentVariable("DateFormat") ?? "yyyy-MM-ddTHH:mm:ss.fff+00:00";
            return DateTime.UtcNow.ToString(dateFormat);
        }

        [Function("ProcessStripePaymentWebhook")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post", "get")] HttpRequest req)
        {
            // Handle GET requests for payment verification
            if (req.Method.Equals("GET", StringComparison.OrdinalIgnoreCase))
            {
                return await HandleVerificationRequest(req);
            }

            return await HandleWebhookRequest(req);
        }

        private async Task<IActionResult> HandleWebhookRequest(HttpRequest req)
        {
            _logger.LogInformation("=== Stripe Webhook Received ===");

            LogRequestMetadata(req);

            try
            {
                // 1. Read and log the request body
                var requestBody = await ReadAndLogRequestBodyAsync(req);

                // 2. Extract the Stripe-Signature header for verification
                var signatureHeader = req.Headers["Stripe-Signature"].ToString();
                _logger.LogInformation($"Stripe-Signature header present: {!string.IsNullOrWhiteSpace(signatureHeader)}");
                _logger.LogInformation($"Full Stripe-Signature: {signatureHeader}");
                LogSignatureTimestamp(signatureHeader, requestBody);

                if (string.IsNullOrWhiteSpace(signatureHeader))
                {
                    _logger.LogWarning("Missing Stripe-Signature header");
                    return new BadRequestObjectResult(new { error = "Missing Stripe-Signature header" });
                }

                // 3. Retrieve the webhook secret from environment variables for signature verification
                var webhookSecret = Environment.GetEnvironmentVariable("StripeWebhookSecret");
                _logger.LogInformation($"Webhook secret configured: {!string.IsNullOrWhiteSpace(webhookSecret)}");
                if (!string.IsNullOrWhiteSpace(webhookSecret))
                {
                    _logger.LogInformation($"Webhook secret starts with: {webhookSecret.Substring(0, Math.Min(10, webhookSecret.Length))}...");
                }

                // 4. Verify the Stripe event using the signature and webhook secret
                Event stripeEvent;
                try
                {
                    stripeEvent = VerifyAndParseStripeEvent(requestBody, signatureHeader, webhookSecret);
                }
                catch (StripeException ex)
                {
                    _logger.LogError($"Webhook signature verification failed: {ex.Message}; Exception type: {ex.GetType().Name}; StripeError Code: {ex.StripeError?.Code}");
                    return new BadRequestObjectResult(new { error = "Invalid signature" });
                }

                _logger.LogInformation($"Processing event type: {stripeEvent.Type}");
                // 5. Handle only checkout completion; acknowledge all other events so Stripe stops retrying them.
                if (stripeEvent.Type != "checkout.session.completed")
                {
                    _logger.LogInformation($"Unhandled event type: {stripeEvent.Type}");
                    return new OkObjectResult(new { received = true });
                }

                return await HandleCheckoutSessionCompletedAsync(stripeEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Webhook processing error: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return new StatusCodeResult(500); // Stripe will retry
            }
        }

        private void LogRequestMetadata(HttpRequest req)
        {
            // Best-effort metadata logging (won't break webhook)
            try
            {
                _logger.LogInformation($"Request Method: {req.Method}; Request ContentType: {req.ContentType}; Request ContentLength: {req.ContentLength}");

                _logger.LogInformation("=== Request Headers ===");
                foreach (var header in req.Headers)
                {
                    _logger.LogInformation($"Header: {header.Key} = {header.Value}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Error logging request metadata: {ex.Message}");
            }
        }

        private async Task<string> ReadAndLogRequestBodyAsync(HttpRequest req)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();

            _logger.LogInformation($"Raw request body length: {requestBody?.Length ?? 0} bytes");

            var bodyBytes = System.Text.Encoding.UTF8.GetBytes(requestBody ?? string.Empty);
            _logger.LogInformation($"Body byte count: {bodyBytes.Length}");
            _logger.LogInformation($"Body first 200 chars: {(requestBody?.Length > 0 ? requestBody.Substring(0, Math.Min(200, requestBody.Length)) : "empty")}");

            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hash = sha256.ComputeHash(bodyBytes);
                var hashString = BitConverter.ToString(hash).Replace("-", string.Empty).ToLower();
                _logger.LogInformation($"Body SHA-256 hash: {hashString}");
            }

            return requestBody ?? string.Empty;
        }

        private void LogSignatureTimestamp(string signatureHeader, string requestBody)
        {
            if (string.IsNullOrEmpty(signatureHeader) || !signatureHeader.Contains("t="))
            {
                return;
            }

            var parts = signatureHeader.Split(',');
            foreach (var part in parts)
            {
                if (part.StartsWith("t="))
                {
                    var timestamp = part.Substring(2);
                    _logger.LogInformation($"Signature timestamp: {timestamp}");
                    _logger.LogInformation($"Expected signed payload: {timestamp}.{requestBody?.Substring(0, Math.Min(50, requestBody?.Length ?? 0))}...");
                }
            }
        }

        private Event VerifyAndParseStripeEvent(string requestBody, string signatureHeader, string? webhookSecret)
        {
            if (string.IsNullOrWhiteSpace(webhookSecret))
            {
                _logger.LogInformation("StripeWebhookSecret not configured - SKIPPING signature verification (local dev only!)");
                return EventUtility.ParseEvent(requestBody);
            }

            const long toleranceSeconds = 300;

            var stripeEvent = EventUtility.ConstructEvent(
                requestBody,
                signatureHeader,
                webhookSecret,
                toleranceSeconds,
                false // throwOnApiVersionMismatch
            );

            _logger.LogInformation("Webhook signature verified successfully");
            return stripeEvent;
        }

        private bool TryConfigureStripeApiKey(out string errorMessage)
        {
            var stripeSecretKey = Environment.GetEnvironmentVariable("StripeSecretKey");
            var isConfigured = !string.IsNullOrWhiteSpace(stripeSecretKey);
            _logger.LogInformation($"StripeSecretKey configured: {isConfigured}");

            if (!isConfigured)
            {
                errorMessage = "StripeSecretKey is missing or empty in application settings.";
                return false;
            }

            StripeConfiguration.ApiKey = stripeSecretKey;
            errorMessage = string.Empty;
            return true;
        }

        private async Task<IActionResult> HandleCheckoutSessionCompletedAsync(Event stripeEvent)
        {
            if (!TryConfigureStripeApiKey(out var stripeConfigError))
            {
                _logger.LogError(stripeConfigError);
                return new ObjectResult(new { error = "Stripe secret configuration error" }) { StatusCode = 500 };
            }

            // 6. Deserialize the checkout session object from the Stripe event
            var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
            if (session == null)
            {
                _logger.LogError("Failed to deserialize checkout session");
                return new BadRequestObjectResult(new { error = "Invalid session data" });
            }

            // 7. Check if the session has already been processed
            if (!string.IsNullOrEmpty(session.Id) && ProcessedSessions.ContainsKey(session.Id))
            {
                _logger.LogInformation($"Session {session.Id} already processed - acknowledging.");
                return new OkObjectResult(new { received = true, duplicate = true });
            }

            _logger.LogInformation($"Payment successful for session: {session.Id}");

            // 8. Extract submission metadata from the session
            var metadata = ExtractSubmissionMetadata(session);
            if (string.IsNullOrEmpty(metadata.SubmissionId))
            {
                _logger.LogError("Missing submission_id in session metadata");
                return new BadRequestObjectResult(new { error = "Missing submission ID" });
            }

            _logger.LogInformation($"Processing submission: {metadata.SubmissionId}, Form type: {metadata.FormType}");

            // 9. Load submission artifacts (eForm URL, attachments, and staged formData.json payload).
            var containerClient = CreateBlobContainerClient();
            var blobData = await LoadSubmissionBlobDataAsync(containerClient, metadata.SubmissionId);

            _logger.LogInformation($"Found form data URL and {blobData.AttachmentUrls.Count} attachment(s) for submission {metadata.SubmissionId}");
            // Backward compatibility: older submissions may not have formData.json available.
            var effectiveFormData = blobData.FormData ?? BuildFallbackFormData(metadata.SubmissionId, metadata.FormType, blobData.FormDataUrl);

            // 10. Retrieve the invoice, build payment allocations and calculate amounts
            var invoice = await GetInvoiceAsync(session.InvoiceId);
            var paymentAllocations = BuildPaymentAllocations(invoice);

            var totalAmount = (invoice?.Total ?? 0L) / 100m;
            var netAmount = (invoice?.TotalExcludingTax ?? 0L) / 100m;
            var totalGst = (invoice?.TotalTaxes?.Sum(tax => tax.Amount) ?? 0L) / 100m;
            var transactionDateAndTime = BuildTransactionDateAndTime(invoice, session);

            var messageData = BuildPaymentCompletedMessage(
                metadata,
                session,
                blobData.AttachmentUrls,
                blobData.FormDataUrl,
                totalAmount,
                netAmount,
                totalGst,
                invoice?.Number,
                transactionDateAndTime,
                paymentAllocations);
            // 11. Update the receipt email if configured
            await UpdateReceiptEmailIfConfiguredAsync(session, metadata.ReceiptCategory, metadata.FormType);

            string messageJson = JsonSerializer.Serialize(messageData);
            _logger.LogInformation($"=== Service Bus Message Preparation ===");
            _logger.LogInformation($"Message JSON length: {messageJson.Length} bytes");
            _logger.LogInformation($"Message summary: SubmissionId={metadata.SubmissionId}, FormType={metadata.FormType}, Attachments={blobData.AttachmentUrls.Count}");
            _logger.LogInformation($"Message preview: {messageJson.Substring(0, Math.Min(200, messageJson.Length))}...");

            // 12. Publish to Service Bus first, then persist to SQL; failures are logged but do not fail webhook ack.
            await SendMessageToServiceBusAsync(messageJson, metadata);
            await PersistPaidSubmissionAsync(metadata, effectiveFormData, messageData, blobData.FormDataBlobClient);

            if (!string.IsNullOrEmpty(session.Id))
            {
                ProcessedSessions[session.Id] = DateTime.UtcNow;
                _logger.LogInformation($"Marked session {session.Id} as processed");
            }

            return new OkObjectResult(new
            {
                received = true,
                submissionId = metadata.SubmissionId,
                attachmentCount = blobData.AttachmentUrls.Count
            });
        }

        private static SubmissionMetadata ExtractSubmissionMetadata(Stripe.Checkout.Session session)
        {
            return new SubmissionMetadata(
                session.Metadata?.GetValueOrDefault("submission_id"),
                session.Metadata?.GetValueOrDefault("form_type"),
                session.Metadata?.GetValueOrDefault("receipt_category"),
                session.Metadata?.GetValueOrDefault("law_society_id"),
                session.Metadata?.GetValueOrDefault("user_email"),
                session.Metadata?.GetValueOrDefault("user_name"),
                session.Metadata?.GetValueOrDefault("first_name"),
                session.Metadata?.GetValueOrDefault("middle_name"),
                session.Metadata?.GetValueOrDefault("surname"),
                session.Metadata?.GetValueOrDefault("business_unit"),
                session.Metadata?.GetValueOrDefault("sku")
            );
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

        private async Task<SubmissionBlobData> LoadSubmissionBlobDataAsync(BlobContainerClient containerClient, string submissionId)
        {
            var attachmentUrls = new List<string>();
            string? formDataUrl = null;
            JsonElement? formData = null;
            string blobPrefix = $"submissions/{submissionId}/";
            var formDataBlobClient = containerClient.GetBlobClient($"submissions/{submissionId}/formData.json");

            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: blobPrefix))
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);

                if (blobItem.Name.EndsWith("/eForm.pdf"))
                {
                    // Historical contract: FormDataUrl points to the generated eForm PDF location.
                    formDataUrl = blobClient.Uri.ToString();
                }
                else if (blobItem.Name.EndsWith("/formData.json"))
                {
                    try
                    {
                        var formDataContent = await blobClient.DownloadContentAsync();
                        formData = formDataContent.Value.Content.ToObjectFromJson<JsonElement>();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Could not load formData.json for {submissionId}: {ex.Message}");
                    }
                }
                else
                {
                    // Everything else in the submission folder is treated as a user attachment.
                    attachmentUrls.Add(blobClient.Uri.ToString());
                }
            }

            return new SubmissionBlobData(attachmentUrls, formDataUrl, formData, formDataBlobClient);
        }

        private static JsonElement BuildFallbackFormData(string submissionId, string? formType, string? formDataUrl)
        {
            return JsonSerializer.SerializeToElement(new
            {
                SubmissionId = submissionId,
                FormType = formType,
                FormDataUrl = formDataUrl
            });
        }

        private static async Task<Invoice?> GetInvoiceAsync(string? invoiceId)
        {
            if (string.IsNullOrWhiteSpace(invoiceId))
            {
                return null;
            }

            var invoiceService = new InvoiceService();
            return await invoiceService.GetAsync(invoiceId);
        }

        private static List<PaymentAllocation> BuildPaymentAllocations(Invoice? invoice)
        {
            var invoiceLineItems = invoice?.Lines?.Data ?? new List<InvoiceLineItem>();

            return invoiceLineItems
                .Select(lineItem =>
                {
                    var description = string.IsNullOrWhiteSpace(lineItem.Description)
                        ? "Unknown"
                        : lineItem.Description;

                    var gstInCents = lineItem.Taxes?.Sum(tax => tax.Amount) ?? 0;
                    // Stripe line amount is gross when tax exists; use taxable amount sum to derive net.
                    var netAmountInCents = lineItem.Taxes == null || lineItem.Taxes.Count == 0
                        ? lineItem.Amount
                        : lineItem.Taxes.Sum(tax => tax.TaxableAmount ?? 0);
                    var totalAmountInCents = lineItem.Amount;

                    return new PaymentAllocation
                    {
                        Description = description,
                        NetAmount = netAmountInCents / 100m,
                        Gst = gstInCents / 100m,
                        TotalAmount = totalAmountInCents / 100m
                    };
                })
                .Where(allocation => allocation != null)
                .Cast<PaymentAllocation>()
                .ToList();
        }

        private string BuildTransactionDateAndTime(Invoice? invoice, Stripe.Checkout.Session session)
        {
            var dateTimeFormat = Environment.GetEnvironmentVariable("DateTimeFormat") ?? "yyyy-MM-ddTHH:mm:ss.fffK";
            var configuredTimeZone = Environment.GetEnvironmentVariable("timeZone");
            var transactionDateAndTime = string.Empty;
            var createdSource = invoice?.Created ?? session.Created;

            if (createdSource == default)
            {
                return transactionDateAndTime;
            }

            var createdUtc = DateTime.SpecifyKind(createdSource, DateTimeKind.Utc);
            transactionDateAndTime = createdUtc.ToString(dateTimeFormat);

            if (!string.IsNullOrWhiteSpace(configuredTimeZone))
            {
                try
                {
                    var targetTimeZone = TimeZoneInfo.FindSystemTimeZoneById(configuredTimeZone);
                    transactionDateAndTime = TimeZoneInfo.ConvertTimeFromUtc(createdUtc, targetTimeZone).ToString(dateTimeFormat);
                }
                catch (TimeZoneNotFoundException)
                {
                    _logger.LogWarning($"Invalid timeZone app setting '{configuredTimeZone}'. Falling back to UTC.");
                }
                catch (InvalidTimeZoneException)
                {
                    _logger.LogWarning($"Corrupt timeZone app setting '{configuredTimeZone}'. Falling back to UTC.");
                }
            }

            return transactionDateAndTime;
        }

        private PaymentCompletedMessage BuildPaymentCompletedMessage(
            SubmissionMetadata metadata,
            Stripe.Checkout.Session session,
            List<string> attachmentUrls,
            string? formDataUrl,
            decimal totalAmount,
            decimal netAmount,
            decimal totalGst,
            string? stripeInvoiceNumber,
            string transactionDateAndTime,
            List<PaymentAllocation> paymentAllocations)
        {
            return new PaymentCompletedMessage
            {
                SubmissionId = metadata.SubmissionId ?? string.Empty,
                FormType = metadata.FormType ?? string.Empty,
                ReceiptCategory = metadata.ReceiptCategory,
                LawSocietyId = metadata.LawSocietyId,
                UserEmail = metadata.UserEmail,
                UserName = metadata.UserName,
                FirstName = metadata.FirstName,
                MiddleOrOtherName = metadata.MiddleOrOtherName,
                Surname = metadata.Surname,
                BusinessUnit = metadata.BusinessUnit,
                Sku = metadata.Sku,
                PaymentStatus = "completed",
                StripeSessionId = session.Id ?? string.Empty,
                PaymentIntentId = session.PaymentIntentId,
                TotalAmount = totalAmount,
                NetAmount = netAmount,
                TotalGST = totalGst,
                AttachmentUrls = attachmentUrls,
                FormDataUrl = formDataUrl,
                ProcessedAt = GetUtcTime(),
                StripeInvoiceNumber = stripeInvoiceNumber ?? string.Empty,
                TransactionDateAndTime = transactionDateAndTime,
                CardholderName = session.CustomerDetails?.Name ?? string.Empty,
                AllocationYear = DateTime.UtcNow.Month <= 6
                    ? $"{DateTime.UtcNow.Year - 1}/{DateTime.UtcNow.Year % 100:D2}"
                    : $"{DateTime.UtcNow.Year}/{(DateTime.UtcNow.Year + 1) % 100:D2}",
                PaymentAllocations = paymentAllocations
            };
        }

        private async Task UpdateReceiptEmailIfConfiguredAsync(Stripe.Checkout.Session session, string? receiptCategory, string? formType)
        {
            if (string.IsNullOrEmpty(session.PaymentIntentId))
            {
                return;
            }

            var receiptEmail = receiptCategory?.ToLower() switch
            {
                "registry" => Environment.GetEnvironmentVariable("ReceiptEmail_Registry"),
                "a2j" => Environment.GetEnvironmentVariable("ReceiptEmail_A2J"),
                _ => null
            };

            if (!string.IsNullOrEmpty(receiptEmail))
            {
                var piService = new PaymentIntentService();
                await piService.UpdateAsync(session.PaymentIntentId, new PaymentIntentUpdateOptions
                {
                    ReceiptEmail = receiptEmail
                });
                _logger.LogInformation($"Receipt email '{receiptEmail}' set on PaymentIntent {session.PaymentIntentId} for ReceiptCategory '{receiptCategory}', FormType '{formType}'");
            }
            else
            {
                _logger.LogWarning($"No receipt email configured for ReceiptCategory '{receiptCategory}', FormType '{formType}' - skipping receipt email update");
            }
        }

        private async Task SendMessageToServiceBusAsync(string messageJson, SubmissionMetadata metadata)
        {
            var serviceBusConnectionString = Environment.GetEnvironmentVariable("ServiceBusConnection__fullyQualifiedNamespace");
            var topicName = Environment.GetEnvironmentVariable("ServiceBusTopicName") ?? "form-submissions";

            _logger.LogInformation($"Service Bus config check:");
            _logger.LogInformation($"  - Connection string configured: {!string.IsNullOrEmpty(serviceBusConnectionString)}");
            _logger.LogInformation($"  - Topic name: {topicName}");

            if (string.IsNullOrEmpty(serviceBusConnectionString))
            {
                _logger.LogWarning("ServiceBusConnectionString not configured - skipping Service Bus send");
                return;
            }

            try
            {
                _logger.LogInformation($"Creating Service Bus client for topic '{topicName}'...");
                await using var client = new ServiceBusClient(serviceBusConnectionString, new DefaultAzureCredential());
                await using ServiceBusSender sender = client.CreateSender(topicName);

                var messageId = $"{metadata.SubmissionId}-{DateTime.UtcNow.Ticks}";
                var message = new ServiceBusMessage(messageJson)
                {
                    ContentType = "application/json",
                    Subject = metadata.FormType,
                    MessageId = messageId
                };

                _logger.LogInformation($"Service Bus message created:");
                _logger.LogInformation($"  - MessageId: {messageId}");
                _logger.LogInformation($"  - ContentType: application/json");
                _logger.LogInformation($"  - Subject: {metadata.FormType}");

                message.ApplicationProperties.Add("SubmissionId", metadata.SubmissionId);
                message.ApplicationProperties.Add("FormType", metadata.FormType ?? "unknown");
                message.ApplicationProperties.Add("BusinessUnit", metadata.BusinessUnit ?? "unknown");

                _logger.LogInformation($"Application properties added: SubmissionId, FormType, BusinessUnit");
                _logger.LogInformation($"Sending message to Service Bus topic '{topicName}'...");

                await sender.SendMessageAsync(message);

                _logger.LogInformation($"✓ Successfully sent message to Service Bus topic '{topicName}'");
                _logger.LogInformation($"✓ MessageId: {messageId}");
            }
            catch (Exception sbEx)
            {
                _logger.LogError($"✗ Failed to send message to Service Bus");
                _logger.LogError($"  Error: {sbEx.Message}");
                _logger.LogError($"  Exception type: {sbEx.GetType().Name}");
                if (sbEx.InnerException != null)
                {
                    _logger.LogError($"  Inner exception: {sbEx.InnerException.Message}");
                }
                _logger.LogError($"  Stack trace: {sbEx.StackTrace}");
            }
        }

        private async Task PersistPaidSubmissionAsync(
            SubmissionMetadata metadata,
            JsonElement formData,
            PaymentCompletedMessage messageData,
            BlobClient formDataBlobClient)
        {
            try
            {
                var persistPayload = JsonSerializer.Serialize(new
                {
                    formData = BuildPersistedFormData(formData, metadata.SubmissionId!),
                    paymentData = JsonSerializer.SerializeToElement(messageData, CamelCaseJsonOptions)
                });

                var inserted = await _persistStoreService.SaveAsync(
                    metadata.LawSocietyId,
                    metadata.FormType,
                    metadata.SubmissionId ?? string.Empty,
                    persistPayload);

                if (inserted)
                {
                    _logger.LogInformation("PersistStore row created for paid submission {SubmissionId}", metadata.SubmissionId);
                }
                else
                {
                    _logger.LogWarning("Duplicate submission detected, skipping PersistStore insert for paid submission {SubmissionId}", metadata.SubmissionId);
                }

                try
                {
                    await formDataBlobClient.DeleteIfExistsAsync();
                    _logger.LogInformation("Deleted staging formData.json for paid submission {SubmissionId}", metadata.SubmissionId);
                }
                catch (Exception cleanupEx)
                {
                    _logger.LogWarning("Could not delete formData.json for paid submission {SubmissionId}: {Error}", metadata.SubmissionId, cleanupEx.Message);
                }
            }
            catch (Exception persistEx)
            {
                // Persistence failure is logged for manual recovery; webhook still succeeds to avoid duplicate charge handling.
                _logger.LogError($"Failed to write PersistStore row for {metadata.SubmissionId}: {persistEx.Message}");
            }
        }

        private sealed record SubmissionMetadata(
            string? SubmissionId,
            string? FormType,
            string? ReceiptCategory,
            string? LawSocietyId,
            string? UserEmail,
            string? UserName,
            string? FirstName,
            string? MiddleOrOtherName,
            string? Surname,
            string? BusinessUnit,
            string? Sku);

        private sealed record SubmissionBlobData(
            List<string> AttachmentUrls,
            string? FormDataUrl,
            JsonElement? FormData,
            BlobClient FormDataBlobClient);

        private async Task<IActionResult> HandleVerificationRequest(HttpRequest req)
        {
            try
            {
                var sessionId = req.Query["session_id"].ToString();
                
                if (string.IsNullOrEmpty(sessionId))
                {
                    return new BadRequestObjectResult(new { success = false, message = "session_id is required" });
                }

                _logger.LogInformation($"Verifying payment session: {sessionId}");

                // Initialize Stripe
                if (!TryConfigureStripeApiKey(out var stripeConfigError))
                {
                    _logger.LogError(stripeConfigError);
                    return new ObjectResult(new { success = false, message = "Stripe secret configuration error" }) { StatusCode = 500 };
                }

                // Retrieve session from Stripe
                var sessionService = new Stripe.Checkout.SessionService();
                var session = await sessionService.GetAsync(sessionId);

                if (session == null)
                {
                    return new NotFoundObjectResult(new { success = false, message = "Session not found" });
                }

                var submissionId = session.Metadata?.GetValueOrDefault("submission_id");
                
                // Check if webhook has processed this session
                var webhookProcessed = ProcessedSessions.ContainsKey(sessionId);

                return new OkObjectResult(new
                {
                    success = true,
                    paymentStatus = session.PaymentStatus,
                    webhookProcessed = webhookProcessed,
                    submissionId = submissionId,
                    formType = session.Metadata?.GetValueOrDefault("form_type"),
                    amountTotal = session.AmountTotal,
                    currency = session.Currency,
                    customerEmail = session.CustomerEmail
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Payment verification error: {ex.Message}");
                return new ObjectResult(new { success = false, message = "Verification failed", error = ex.Message }) { StatusCode = 500 };
            }
        }

        private static JsonObject BuildPersistedFormData(JsonElement? sourceFormData, string submissionId)
        {
            var orderedFormData = new JsonObject
            {
                ["submissionId"] = submissionId
            };

            if (sourceFormData is not JsonElement rootElement || rootElement.ValueKind != JsonValueKind.Object)
            {
                return orderedFormData;
            }

            var workingElement = rootElement;
            if (rootElement.TryGetProperty("FormData", out var innerFormData) && innerFormData.ValueKind == JsonValueKind.Object)
            {
                // Staged blobs wrap the business payload under FormData; flatten before persisting.
                workingElement = innerFormData;
            }

            foreach (var property in workingElement.EnumerateObject())
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
