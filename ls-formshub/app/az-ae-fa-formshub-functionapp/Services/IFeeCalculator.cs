using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Unified fee request. Fields are a superset of all form types.
    /// Each calculator only reads the fields it needs.
    /// </summary>
    public class UnifiedFeeRequest
    {
        public string? FormType { get; set; }          // australian-registration-certificate-new | australian-registration-certificate-renew
                                                       // | practising-certificate-new | change-in-employment-details | ....

        // PC New
        public string? DateOfAdmission { get; set; }   // ISO 8601
        public string? RegistryType { get; set; }      // "Principal/Employee" | "Gov/Corporate" | …
        public string? SM { get; set; }                // "yes" | "No"

        // PC Original (Foreign Lawyer)
        public string? FormOfPractice { get; set; }    // "partnership" | "sole" | "volunteer_probono" | …
        public string? AM { get; set; }                // "yes" | "No"

        // PC Variation
        public string? PrevCategory { get; set; }      // "volunteer" | "principal" | "employee" | "government" | "corporate"
        public string? NewCategory { get; set; }       // "volunteer" | "principal" | "employee" | "government" | "corporate"

        // Shared
        public string? EffectiveDate { get; set; }     // ISO 8601
        public string? PracticeCountry { get; set; }   // "Australia" | "Outside Australia"
    }

    /// <summary>Common fee response shape returned by all calculators.</summary>
    public class FeeResult
    {
        public double FeeAmount { get; set; }
        public double FeePc { get; set; }
        public double FeeFidelity { get; set; }
        public double FeeSm { get; set; }
        public string? Logic { get; set; }
    }

    /// <summary>Implemented by each per-form-type fee calculator.</summary>
    public interface IFeeCalculator
    {
        /// <summary>
        /// Validates the fields needed by this calculator.
        /// Returns an error message string, or null if valid.
        /// </summary>
        string? Validate(UnifiedFeeRequest request);

        /// <summary>Queries storage and returns the fee breakdown, or null if no rule matched.</summary>
        Task<FeeResult?> CalculateAsync(UnifiedFeeRequest request, ILogger logger);
    }
}
