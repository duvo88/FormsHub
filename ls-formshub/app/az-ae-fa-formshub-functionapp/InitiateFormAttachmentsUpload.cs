using api.services;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Azure.Identity;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace api
{
    // Request models - what React sends
    public class BatchUploadRequest
    {
        public string? FormType { get; set; }
        public string? ReferenceNumber { get; set; } // LawID or other reference
        public List<FileUploadRequest>? Files { get; set; }
    }

    public class FileUploadRequest
    {
        public string? FieldName { get; set; }      // e.g., "certificateAttachment"
        public string? FileName { get; set; }        // e.g., "certificate.pdf"
        public string? FileType { get; set; }        // e.g., "application/pdf"
        public long FileSize { get; set; }          // in bytes
    }

    // Response models - what we send back to React
    public class FileUploadInfo
    {
        public string? FieldName { get; set; }
        public string? UploadUrl { get; set; }       // SAS URL for uploading
        public string? BlobUrl { get; set; }         // Permanent URL (without SAS)
        public string? BlobName { get; set; }        // Path in storage
        public DateTimeOffset ExpiresAt { get; set; }
    }

    public class InitiateFormAttachmentsUpload
    {
        private readonly ILogger<InitiateFormAttachmentsUpload> _logger;

        public InitiateFormAttachmentsUpload(ILogger<InitiateFormAttachmentsUpload> logger)
        {
            _logger = logger;
        }

        [Function("InitiateFormAttachmentsUpload")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            _logger.LogInformation("=== Initiating batch file upload ===");

            try
            {
                var auth = EasyAuthGuard.RequireAuthenticatedUser(req);
                if (auth != null) return auth;
                // 1. Parse request body
                var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                
                if (string.IsNullOrWhiteSpace(requestBody))
                {
                    return new BadRequestObjectResult(new { error = "Request body is required" });
                }

                var uploadRequest = JsonSerializer.Deserialize<BatchUploadRequest>(requestBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (uploadRequest?.Files == null || !uploadRequest.Files.Any())
                {
                    return new BadRequestObjectResult(new { error = "No files provided" });
                }

                _logger.LogInformation($"Received upload request for {uploadRequest.Files.Count} file(s)");

                // 2. Generate submission ID: formType_lawId_timestamp
                // Example: practisingcertificate_1234567_20251208-123456
                string submissionId;
                string formType = (uploadRequest.FormType ?? "form").Trim();
                if (string.IsNullOrWhiteSpace(formType))
                {
                    formType = "form";
                }

                string lawId = string.IsNullOrWhiteSpace(uploadRequest.ReferenceNumber)
                    ? "0000000"
                    : uploadRequest.ReferenceNumber.Trim();
                string folderDateFormat = Environment.GetEnvironmentVariable("folderDateFormat") ?? "yyyyMMdd-HHmmss";
                string timestamp = DateTime.UtcNow.ToString(folderDateFormat);
                submissionId = $"{formType}_{lawId}_{timestamp}";
                _logger.LogInformation($"Generated submission ID: {submissionId}");

                // 3. Get Azure Storage connection string from environment
                var credential = new DefaultAzureCredential();
                var storageAccountName = Environment.GetEnvironmentVariable("StorageAccountName");
                var blobServiceClient = new BlobServiceClient(
                    new Uri($"https://{storageAccountName}.blob.core.windows.net"),
                    credential
                );

                // 5. Get or create container named "forms-hub-blob"
                var blobContainerName = Environment.GetEnvironmentVariable("blobContainerName");
                var containerClient = blobServiceClient.GetBlobContainerClient(blobContainerName);
                await containerClient.CreateIfNotExistsAsync(Azure.Storage.Blobs.Models.PublicAccessType.None);
                
                _logger.LogInformation($"Container {blobContainerName} ready");

                // 6. Get User Delegation Key for SAS token generation (requires Managed Identity)
                var userDelegationKey = await blobServiceClient.GetUserDelegationKeyAsync(
                    startsOn: DateTimeOffset.UtcNow.AddMinutes(-5),
                    expiresOn: DateTimeOffset.UtcNow.AddHours(1)
                );

                // 7. Generate SAS tokens for ALL files
                var uploadUrls = new List<FileUploadInfo>();
                var expiryTime = DateTimeOffset.UtcNow.AddHours(1);

                foreach (var fileRequest in uploadRequest.Files)
                {
                    // Sanitize filename (remove invalid characters, spaces)
                    var sanitizedFileName = SanitizeFileName(fileRequest.FileName ?? "file");
                    
                    // Create blob path: submissions/{submissionId}/{fieldName}/{fileName}
                    // This organizes files by submission and field type
                    var blobName = $"submissions/{submissionId}/{fileRequest.FieldName}/{sanitizedFileName}";
                    var blobClient = containerClient.GetBlobClient(blobName);

                    // Generate User Delegation SAS token for this specific blob
                    var sasBuilder = new BlobSasBuilder
                    {
                        BlobContainerName = containerClient.Name,
                        BlobName = blobName,
                        Resource = "b", // b = blob (not container)
                        StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Start 5 min ago to handle clock skew
                        ExpiresOn = expiryTime
                    };
                    
                    // Set permissions: Write + Create (not Read or Delete)
                    sasBuilder.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

                    // Generate User Delegation SAS using the delegation key
                    var blobUriBuilder = new BlobUriBuilder(blobClient.Uri)
                    {
                        Sas = sasBuilder.ToSasQueryParameters(userDelegationKey.Value, storageAccountName)
                    };

                    uploadUrls.Add(new FileUploadInfo
                    {
                        FieldName = fileRequest.FieldName,
                        UploadUrl = blobUriBuilder.ToUri().ToString(),  // URL with User Delegation SAS token
                        BlobUrl = blobClient.Uri.ToString(),             // Permanent URL without token
                        BlobName = blobName,
                        ExpiresAt = expiryTime
                    });

                    _logger.LogInformation($"Generated upload URL for {fileRequest.FieldName}: {blobName}");
                }

                // 8. Return all upload URLs to React
                var response = new
                {
                    success = true,
                    submissionId,
                    uploadUrls,
                    expiresAt = expiryTime,
                    message = $"Ready to upload {uploadUrls.Count} file(s)"
                };

                _logger.LogInformation($"Returning {uploadUrls.Count} upload URL(s)");
                
                return new OkObjectResult(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error initiating file upload: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                
                return new ObjectResult(new 
                { 
                    error = "Internal server error",
                    message = "Failed to initiate file upload",
                    details = ex.Message
                })
                {
                    StatusCode = 500
                };
            }
        }

        // Helper method to clean up filenames
        private string SanitizeFileName(string fileName)
        {
            // Remove path separators
            fileName = Path.GetFileName(fileName);
            
            // Remove invalid filename characters
            var invalid = Path.GetInvalidFileNameChars();
            var sanitized = string.Join("_", fileName.Split(invalid, StringSplitOptions.RemoveEmptyEntries));
            
            // Replace spaces and special characters with underscores
            sanitized = sanitized.Replace(" ", "_");
            sanitized = sanitized.Replace("(", "_");
            sanitized = sanitized.Replace(")", "_");
            
            return sanitized;
        }
    }
}
