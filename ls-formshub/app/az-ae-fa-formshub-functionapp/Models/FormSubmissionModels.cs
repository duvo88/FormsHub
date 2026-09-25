namespace api.Models
{
    // Represents a single line item for the Stripe checkout receipt
    public class StripeLineItem
    {
        public string Name { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public bool HasGst { get; set; } = false;
    }

    // Business metadata
    public class FormMetadata
    {
        public string? BusinessUnit { get; set; }
        public string? Sku { get; set; }
        public string? ReceiptCategory { get; set; }
    }

    // Base class for all form submissions
    public class FormSubmissionRequest
    {
        public string FormType { get; set; } = string.Empty;
        public string FormName { get; set; } = string.Empty;
        public string FormTypeShort { get; set; } = string.Empty;
        public int price { get; set; } = 0;
        public double FeeSm { get; set; } = 0;
        public string? SmLogic { get; set; }
        public string SubmissionId { get; set; } = string.Empty;
        public Dictionary<string, string> AttachmentUrls { get; set; } = new();

        // User information from authentication
        public string LawSocietyId { get; set; } = "Unknown";
        public string UserEmail { get; set; } = "Unknown";
        public string? UserName { get; set; }
        
        // Business metadata
        public FormMetadata? Metadata { get; set; }
        
        // Field labels from frontend (fieldName → display label)
        public Dictionary<string, string>? FieldLabels { get; set; }

        // Section labels from frontend (sectionKey → display name)
        public Dictionary<string, string>? SectionLabels { get; set; }

        // Explicit line items for Stripe receipt (when provided, overrides computed line items)
        public List<StripeLineItem>? LineItems { get; set; }

        // Form-specific data as JSON (can be deserialized to specific models)
        public object FormData { get; set; } = new();
    }

    // Response from form submission (Stripe checkout session created)
    public class FormSubmissionResponse
    {
        public bool Success { get; set; }
        public string? SubmissionId { get; set; }
        public string? CheckoutUrl { get; set; }
        public string? SessionId { get; set; }
        public string? Message { get; set; }
    }

    // Practising Certificate specific model
    public class PractisingCertificateFormData
    {
        public ApplicantInfo Applicant { get; set; } = new();
        public AdmissionInfo Admission { get; set; } = new();
        public EligibilityInfo Eligibility { get; set; } = new();
        public PracticeInfo Practice { get; set; } = new();
        public AddressInfo Addresses { get; set; } = new();
        public OtherPlacesInfo OtherPlaces { get; set; } = new();
        public List<string> ForeignLanguages { get; set; } = new();
        public CertificateTypeInfo CertificateType { get; set; } = new();
        public FitAndProperInfo FitAndProper { get; set; } = new();
        public ShowCauseInfo ShowCause { get; set; } = new();
        public PreviousCertificatesInfo Certificates { get; set; } = new();
        public DeclarationInfo Declaration { get; set; } = new();
        public DateTime SubmittedAt { get; set; }
    }

    // Certificate of Fitness specific model
    public class CertificateOfFitnessFormData
    {
        public ApplicantInfo Applicant { get; set; } = new();
        public JurisdictionInfo Jurisdiction { get; set; } = new();
        public SignatureInfo Signature { get; set; } = new();
        public DateTime SubmittedAt { get; set; }
    }

    // Shared sub-models
    public class ApplicantInfo
    {
        public string FirstName { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string? OtherNames { get; set; }
        public string? Title { get; set; }
        public string? Gender { get; set; }
        public string DateOfBirth { get; set; } = string.Empty;
        public string LawID { get; set; } = string.Empty;
        public string StreetNumber { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public string DL { get; set; } = string.Empty;
        public string Telephone { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string partyName { get; set; }= string.Empty;
        public string referenceNumber { get; set; } = string.Empty;
        public string legalRep { get; set; } = string.Empty;
        
    }

    public class AdmissionInfo
    {
        public string AdmissionDate { get; set; } = string.Empty;
        public string AdmissionState { get; set; } = string.Empty;
        public string SupremeCourtNumber { get; set; } = string.Empty;
        public string? CertificateAttachment { get; set; }
    }

    public class EligibilityInfo
    {
        public string PrincipalPlace { get; set; } = string.Empty;
        public string? ForeignJurisdiction { get; set; }
    }

    public class PracticeInfo
    {
        public string EmploymentType { get; set; } = string.Empty;
        public string? EmployerName { get; set; }
        public string? Position { get; set; }
        public string? EmploymentStartDate { get; set; }
    }

    public class AddressInfo
    {
        public Address Residential { get; set; } = new();
        public Address Service { get; set; } = new();
    }

    public class Address
    {
        public string Street { get; set; } = string.Empty;
        public string Suburb { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
    }

    public class OtherPlacesInfo
    {
        public string MultipleEntities { get; set; } = string.Empty;
        public string? LawPracticeEmployer { get; set; }
        public string? Street { get; set; }
        public string? Suburb { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? Postcode { get; set; }
    }

    public class CertificateTypeInfo
    {
        public string Type { get; set; } = string.Empty;
        public string? Endorsement { get; set; }
    }

    public class FitAndProperInfo
    {
        public string HasConcerns { get; set; } = string.Empty;
        public string? Attachment { get; set; }
    }

    public class ShowCauseInfo
    {
        public string HasEvent { get; set; } = string.Empty;
        public string? Attachment { get; set; }
    }

    public class PreviousCertificatesInfo
    {
        public string HeldNSW { get; set; } = string.Empty;
        public string? NSWDetails { get; set; }
        public string CurrentAustralian { get; set; } = string.Empty;
        public string? CurrentAustralianDetails { get; set; }
        public string HeldOtherAustralian { get; set; } = string.Empty;
        public string? OtherAustralianDetails { get; set; }
        public string HeldForeign { get; set; } = string.Empty;
        public string? ForeignDetails { get; set; }
    }

    public class DeclarationInfo
    {
        public string Signature { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }

    public class JurisdictionInfo
    {
        public string Details { get; set; } = string.Empty;
        public string? Attachment { get; set; }
    }

    public class SignatureInfo
    {
        public string Signature { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }
}
