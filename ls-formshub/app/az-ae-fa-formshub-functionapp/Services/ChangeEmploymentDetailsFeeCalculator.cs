using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Fee calculator for PC Variation (Change in Practice/Employment) applications.
    ///
    /// Inputs: EffectiveDate, PrevCategory, NewCategory.
    /// Valid category values: volunteer | principal | employee | government | corporate
    ///
    /// Table FeeRulePCVariation contains one row per billable (prevCategory, newCategory, period) combo.
    /// Any combination not in the table → No Fee ($0).
    /// Same-category variations (e.g. principal→principal) are handled as $0 in code.
    /// </summary>
    public class ChangeEmploymentDetailsFeeCalculator : IFeeCalculator
    {
        private readonly FeeRuleServiceChangeEmploymentDetails _service;

        public ChangeEmploymentDetailsFeeCalculator(FeeRuleServiceChangeEmploymentDetails service)
        {
            _service = service;
        }

        public string? Validate(UnifiedFeeRequest r)
        {
            if (string.IsNullOrWhiteSpace(r.EffectiveDate))   return "effectiveDate is required.";
            if (string.IsNullOrWhiteSpace(r.PrevCategory))    return "prevCategory is required for formType 'change-in-employment-details'.";
            if (string.IsNullOrWhiteSpace(r.NewCategory))     return "newCategory is required for formType 'change-in-employment-details'.";
            if (!DateTime.TryParse(r.EffectiveDate, out _))   return "Invalid effectiveDate format. Use ISO 8601.";
            return null;
        }

        public async Task<FeeResult?> CalculateAsync(UnifiedFeeRequest r, ILogger logger)
        {
            DateTime.TryParse(r.EffectiveDate, out var effective);

            string prev = r.PrevCategory!.ToLower();
            string next = r.NewCategory!.ToLower();

            logger.LogInformation(
                "PCVariationFeeCalculator: prev={Prev}, new={New}, effective={Effective}",
                prev, next, effective);

            // Same-category → always no fee
            if (prev == next)
            {
                logger.LogInformation("PCVariationFeeCalculator: same category → No Fee.");
                return new FeeResult { FeeAmount = 0, FeePc = 0, FeeFidelity = 0, FeeSm = 0, Logic = "No Fees" };
            }

            var rule = await _service.GetFeeRuleChangeEmploymentDetailsAsync(effective, prev, next, logger);

            if (rule is null)
            {
                logger.LogInformation(
                    "PCVariationFeeCalculator: no table row for {Prev}→{New} — No Fee.", prev, next);
                return new FeeResult { FeeAmount = 0, FeePc = 0, FeeFidelity = 0, FeeSm = 0, Logic = "No Fees" };
            }

            return new FeeResult
            {
                FeeAmount   = rule.FeePc + rule.FeeFidelity,
                FeePc       = rule.FeePc,
                FeeFidelity = rule.FeeFidelity,
                FeeSm       = 0,
                Logic       = rule.Logic ?? $"{prev}→{next}",
            };
        }
    }
}

