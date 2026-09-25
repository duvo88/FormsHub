using FormsHub.FeeLogic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace api
{
    /// <summary>
    /// Single fee endpoint — dispatches to the appropriate per-form-type calculator
    /// based on the <c>formType</c> field in the request body.
    ///
    /// Supported formType values:
    ///   "practising-certificate-new"              — PC New (requires dateOfAdmission, effectiveDate, practiceCountry, registryType, SM)
    ///   "australian-registration-certificate-new" — ARC New / Foreign Lawyer (requires effectiveDate, formOfPractice, practiceCountry, AM)
    ///   "australian-registration-certificate-renew" — ARC Renewal / Foreign Lawyer (requires effectiveDate, formOfPractice, practiceCountry, AM)
    ///   "change-in-employment-details"            — PC Variation (requires effectiveDate, prevCategory, newCategory)
    /// </summary>
    public class GetFeeResponse
    {
        public double FeeAmount { get; set; }
        public double FeePc { get; set; }
        public double FeeFidelity { get; set; }
        public double FeeSm { get; set; }
        public string? Logic { get; set; }
    }

    public class GetFee
    {
        private readonly ILogger<GetFee> _logger;
        private readonly Dictionary<string, IFeeCalculator> _calculators;

        public GetFee(ILogger<GetFee> logger, PCNewFeeCalculator pcNew, ARCNewFeeCalculator arcNew, ARCRenewFeeCalculator arcRenew, ChangeEmploymentDetailsFeeCalculator changeEmploymentDetails)
        {
            _logger = logger;
            _calculators = new Dictionary<string, IFeeCalculator>(StringComparer.OrdinalIgnoreCase)
            {
                ["practising-certificate-new"] = pcNew,
                ["australian-registration-certificate-new"] = arcNew,
                ["australian-registration-certificate-renew"] = arcRenew,
                ["change-in-employment-details"] = changeEmploymentDetails,
            };
        }

        [Function("GetFee")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            var auth = api.services.EasyAuthGuard.RequireAuthenticatedUser(req);
            if (auth != null) return auth;

            UnifiedFeeRequest? body;
            try
            {
                body = await JsonSerializer.DeserializeAsync<UnifiedFeeRequest>(
                    req.Body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch
            {
                return new BadRequestObjectResult(new { error = "Invalid JSON body." });
            }

            if (body is null || string.IsNullOrWhiteSpace(body.FormType))
                return new BadRequestObjectResult(new { error = "formType is required (e.g. 'practising-certificate-new' or 'australian-registration-certificate-new')." });

            body.FormType = body.FormType.Trim();

            if (!_calculators.TryGetValue(body.FormType, out var calculator))
                return new BadRequestObjectResult(new { error = $"Unknown formType '{body.FormType}'. Supported: {string.Join(", ", _calculators.Keys)}." });

            var validationError = calculator.Validate(body);
            if (validationError is not null)
                return new BadRequestObjectResult(new { error = validationError });

            FeeResult? result;
            try
            {
                result = await calculator.CalculateAsync(body, _logger);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating fee for formType={FormType}.", body.FormType);
                return new ObjectResult(new { Message = "Something went wrong when querying table storage.", Detail = ex.Message })
                    { StatusCode = 500 };
            }

            if (result is null)
                return new NotFoundObjectResult(new { error = $"No fee rule found for the provided inputs (formType='{body.FormType}')." });

            return new OkObjectResult(new GetFeeResponse
            {
                FeeAmount   = result.FeeAmount,
                FeePc       = result.FeePc,
                FeeFidelity = result.FeeFidelity,
                FeeSm       = result.FeeSm,
                Logic       = result.Logic
            });
        }
    }
}

