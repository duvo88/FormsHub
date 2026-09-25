using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Fee calculator for PC Original (Foreign Lawyer) applications.
    /// Requires: EffectiveDate, FormOfPractice, PracticeCountry, AM.
    /// Uses FeeRuleServicePCOriginal.GetFeeRuleSimpleAsync (no DOA branching).
    /// </summary>
    public class ARCNewFeeCalculator : IFeeCalculator
    {
        private readonly FeeRuleServiceARCNew _service;

        public ARCNewFeeCalculator(FeeRuleServiceARCNew service)
        {
            _service = service;
        }

        /// <summary>Maps form-of-practice radio value → RegistryType used in table lookup.</summary>
        private static string MapRegistryType(string formOfPractice) => formOfPractice switch
        {
            "partnership"   => "Foreign Lawyer Principal/Employee",
            "incorporated"  => "Foreign Lawyer Principal/Employee",
            "employee"      => "Foreign Lawyer Principal/Employee",
            "volunteer_probono" => "Volunteer",
            _               => "Other"  // sole, volunteer (ARFL), employeeARFL, other
        };

        public string? Validate(UnifiedFeeRequest r)
        {
            if (string.IsNullOrWhiteSpace(r.EffectiveDate))   return "effectiveDate is required.";
            if (string.IsNullOrWhiteSpace(r.FormOfPractice))  return "formOfPractice is required for formType 'australian-registration-certificate-new'.";
            if (string.IsNullOrWhiteSpace(r.PracticeCountry)) return "practiceCountry is required.";
            if (string.IsNullOrWhiteSpace(r.AM))              return "AM is required for formType 'australian-registration-certificate-new'.";
            if (!DateTime.TryParse(r.EffectiveDate, out _))   return "Invalid effectiveDate format. Use ISO 8601.";
            return null;
        }

        public async Task<FeeResult?> CalculateAsync(UnifiedFeeRequest r, ILogger logger)
        {
            DateTime.TryParse(r.EffectiveDate, out var effective);
            var registryType = MapRegistryType(r.FormOfPractice!);

            logger.LogInformation(
                "PCOriginalFeeCalculator: formOfPractice={FOP} → registry={Registry}, country={Country}, effective={Effective}, AM={AM}",
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
