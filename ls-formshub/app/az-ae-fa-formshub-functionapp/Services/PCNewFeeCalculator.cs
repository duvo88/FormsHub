using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Fee calculator for PC New applications.
    /// Requires: DateOfAdmission, EffectiveDate, PracticeCountry, RegistryType, SM.
    /// Uses FeeRuleService.GetFeeRuleAsync (Date-of-Admission branching + SM halving).
    /// </summary>
    public class PCNewFeeCalculator : IFeeCalculator
    {
        private readonly FeeRuleService _service;

        public PCNewFeeCalculator(FeeRuleService service)
        {
            _service = service;
        }

        public string? Validate(UnifiedFeeRequest r)
        {
            if (string.IsNullOrWhiteSpace(r.DateOfAdmission))  return "dateOfAdmission is required for formType 'practising-certificate-new'.";
            if (string.IsNullOrWhiteSpace(r.EffectiveDate))    return "effectiveDate is required.";
            if (string.IsNullOrWhiteSpace(r.PracticeCountry))  return "practiceCountry is required.";
            if (string.IsNullOrWhiteSpace(r.RegistryType))     return "registryType is required for formType 'practising-certificate-new'.";
            if (string.IsNullOrWhiteSpace(r.SM))               return "SM is required for formType 'practising-certificate-new'.";
            if (!DateTime.TryParse(r.DateOfAdmission, out _))  return "Invalid dateOfAdmission format. Use ISO 8601.";
            if (!DateTime.TryParse(r.EffectiveDate, out _))    return "Invalid effectiveDate format. Use ISO 8601.";
            return null;
        }

        public async Task<FeeResult?> CalculateAsync(UnifiedFeeRequest r, ILogger logger)
        {
            DateTime.TryParse(r.DateOfAdmission, out var doa);
            DateTime.TryParse(r.EffectiveDate, out var effective);

            logger.LogInformation(
                "PCNewFeeCalculator: SM={SM}, admission={Admission}, effective={Effective}, country={Country}, registry={Registry}",
                r.SM, doa, effective, r.PracticeCountry, r.RegistryType);

            var rule = await _service.GetFeeRuleAsync(doa, effective, r.PracticeCountry!, r.RegistryType!, r.SM!, logger);
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
