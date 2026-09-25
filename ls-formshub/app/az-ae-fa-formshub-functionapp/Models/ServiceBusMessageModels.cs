namespace api.Models
{
    /// <summary>
    /// Message sent to Service Bus when a payment is completed successfully.
    /// This message will be consumed by downstream services (e.g., Logic Apps) to process the form submission.
    /// </summary>
    public class PaymentCompletedMessage
    {
        /// <summary>
        /// Unique identifier for the form submission (e.g., certificateoffitness_L1234567_20251217-015728)
        /// </summary>
        public string SubmissionId { get; set; } = string.Empty;

        /// <summary>
        /// Type of form submitted (route-based value, e.g., certificate-of-fitness, practising-certificate-new, australian-registration-certificate-new, australian-registration-certificate-renew, change-in-employment-details)
        /// </summary>
        public string FormType { get; set; } = string.Empty;

        /// <summary>
        /// Receipt category for routing Stripe receipt emails ("registry" or "a2j")
        /// </summary>
        public string? ReceiptCategory { get; set; }

        /// <summary>
        /// User's LawID from authentication
        /// </summary>
        public string? LawSocietyId { get; set; }

        /// <summary>
        /// User's email address from authentication
        /// </summary>
        public string? UserEmail { get; set; }

        /// <summary>
        /// User's full name from authentication
        /// </summary>
        public string? UserName { get; set; }

        /// <summary>
        /// Applicant first name from form data
        /// </summary>
        public string? FirstName { get; set; }

        /// <summary>
        /// Applicant middle/other names from form data
        /// </summary>
        public string? MiddleOrOtherName { get; set; }

        /// <summary>
        /// Applicant surname from form data
        /// </summary>
        public string? Surname { get; set; }

        /// <summary>
        /// Business unit code (e.g., "1910")
        /// </summary>
        public string? BusinessUnit { get; set; }

        /// <summary>
        /// SKU/product code (e.g., "85905")
        /// </summary>
        public string? Sku { get; set; }

        /// <summary>
        /// Payment status (typically "completed")
        /// </summary>
        public string PaymentStatus { get; set; } = "completed";

        /// <summary>
        /// Stripe checkout session ID (starts with cs_test_ or cs_)
        /// </summary>
        public string StripeSessionId { get; set; } = string.Empty;

        /// <summary>
        /// Stripe payment intent ID (starts with pi_)
        /// </summary>
        public string? PaymentIntentId { get; set; }

        /// <summary>
        /// Total amount paid in cents (e.g., 10000 = $100.00)
        /// </summary>
        public decimal TotalAmount { get; set; }

        /// <summary>
        /// Total amount paid excluding GST
        /// </summary>
        public decimal NetAmount { get; set; }

        /// <summary>
        /// Total amount paid excluding GST
        /// </summary>
        public decimal TotalGST { get; set; }

        /// <summary>
        /// List of blob storage URLs for uploaded attachments
        /// </summary>
        public List<string> AttachmentUrls { get; set; } = new();

        /// <summary>
        /// Blob storage URL for the complete form data JSON file
        /// </summary>
        public string? FormDataUrl { get; set; }

        /// <summary>
        /// Timestamp when the payment was processed (Australian Eastern Time)
        /// </summary>
        public string StripeInvoiceNumber { get; set; } = string.Empty;
        public string ProcessedAt { get; set; } = string.Empty;
        public string TransactionDateAndTime { get; set; } = string.Empty;
        public string CardholderName { get; set; } = string.Empty;
        public string AllocationYear { get; set; } = string.Empty;
        public List<PaymentAllocation> PaymentAllocations { get; set; } = new();
    }

    public class PaymentAllocation
    {
        public string Description { get; set; } = string.Empty;
        public decimal NetAmount { get; set; }
        public decimal Gst { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
