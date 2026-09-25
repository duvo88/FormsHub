using FormsHub.FeeLogic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace api
{
    public class GetCofFee
    {
        private readonly ILogger<GetCofFee> _logger;
        private readonly SimpleFormFeeService _service;

        public GetCofFee(ILogger<GetCofFee> logger, [FromKeyedServices("cof")] SimpleFormFeeService service)
        {
            _logger = logger;
            _service = service;
        }

        /// <summary>
        /// GET /api/GetCofFee?formKey=cof-member|cof-au-non-member|cof-overseas-non-member
        /// Returns { amount, description } for the given CoF fee key from FeeRuleCof table.
        /// Returns 404 if no rule exists for the key.
        /// </summary>
        [Function("GetCofFee")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req)
        {
            var formKey = req.Query["formKey"].FirstOrDefault()?.Trim().ToLowerInvariant();

            if (string.IsNullOrEmpty(formKey))
                return new BadRequestObjectResult(new { error = "formKey query parameter is required." });

            var entity = await _service.GetFeeAsync(formKey, _logger);

            if (entity == null)
                return new NotFoundObjectResult(new { error = $"No CoF fee rule found for formKey '{formKey}'." });

            return new OkObjectResult(new
            {
                amount      = entity.Amount,
                description = entity.Description ?? string.Empty,
            });
        }
    }
}
