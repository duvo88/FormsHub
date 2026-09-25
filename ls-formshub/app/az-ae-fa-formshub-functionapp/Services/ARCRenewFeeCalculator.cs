using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Fee calculator for PC Renew (Foreign Lawyer) applications.
    /// Requires: EffectiveDate, FormOfPractice, PracticeCountry, AM.
    /// Uses FeeRuleServicePCRenew.GetFeeRuleSimpleAsync (no DOA branching).
    ///
    /// Registry type mapping:
    ///   partnership, incorporated, employee  → "Foreign Lawyer Principal/Employee"  (Fidelity applies)
    ///   volunteer_probono                    → "Volunteer"                          ($0 PC, $0 Fidelity)
    ///   sole, volunteer, employeeARFL, other → "Other"                              ($0 Fidelity)
    /// </summary>
    public class ARCRenewFeeCalculator : IFeeCalculator
    {
        private readonly FeeRuleServiceARCRenew _service;

        public ARCRenewFeeCalculator(FeeRuleServiceARCRenew service)
        {
            _service = service;
        }

        /// <summary>Maps form-of-practice radio value → RegistryType used in table lookup.</summary>
        private static string MapRegistryType(string formOfPractice) => formOfPractice switch
        {
            "partnership"       => "Foreign Lawyer Principal/Employee",
            "incorporated"      => "Foreign Lawyer Principal/Employee",
            "employee"          => "Foreign Lawyer Principal/Employee",
            "volunteer_probono" => "Volunteer",
            _                   => "Other"  // sole, volunteer (ARFL), employeeARFL, other
        };

        public string? Validate(UnifiedFeeRequest r)
        {
            if (string.IsNullOrWhiteSpace(r.EffectiveDate))   return "effectiveDate is required.";
            if (string.IsNullOrWhiteSpace(r.FormOfPractice))  return "formOfPractice is required for formType 'australian-registration-certificate-renew'.";
            if (string.IsNullOrWhiteSpace(r.PracticeCountry)) return "practiceCountry is required.";
            if (string.IsNullOrWhiteSpace(r.AM))              return "AM is required for formType 'australian-registration-certificate-renew'.";
            if (!DateTime.TryParse(r.EffectiveDate, out _))   return "Invalid effectiveDate format. Use ISO 8601.";
            return null;
        }

        public async Task<FeeResult?> CalculateAsync(UnifiedFeeRequest r, ILogger logger)
        {
            DateTime.TryParse(r.EffectiveDate, out var effective);
            var registryType = MapRegistryType(r.FormOfPractice!);

            logger.LogInformation(
                "PCRenewFeeCalculator: formOfPractice={FOP} → registry={Registry}, country={Country}, effective={Effective}, AM={AM}",
                r.FormOfPractice, registryType, r.PracticeCountry, effective, r.AM);

            var rule = await _service.GetFeeRuleSimpleAsync(effective, r.PracticeCountry!, registryType, r.AM!, logger);
            if (rule is null) return null;

            return new FeeResult
            {
                FeeAmount   = rule.FeePc + rule.FeeFidelity + rule.FeeSm,
                FeePc       = rule.FeePc,
                FeeFidelity = rule.FeeFidelity,
                FeeSm       = rule.FeeSm,
                Logic       = rule.Logic
            };
        }
    }
}
