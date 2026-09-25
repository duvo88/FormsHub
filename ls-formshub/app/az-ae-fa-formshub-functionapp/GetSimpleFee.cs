using FormsHub.FeeLogic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api
{
    public class GetSimpleFee
    {
        private readonly ILogger<GetSimpleFee> _logger;
        private readonly SimpleFormFeeService _service;

        public GetSimpleFee(ILogger<GetSimpleFee> logger, SimpleFormFeeService service)
        {
            _logger = logger;
            _service = service;
        }

        /// <summary>
        /// GET /api/GetSimpleFee?formKey=flss
        /// Returns { amount, description } for the given form key.
        /// Returns 404 if no rule exists for the key.
        /// </summary>
        [Function("GetSimpleFee")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req)
        {
            var formKey = req.Query["formKey"].FirstOrDefault()?.Trim().ToLowerInvariant();

            if (string.IsNullOrEmpty(formKey))
                return new BadRequestObjectResult(new { error = "formKey query parameter is required." });

            var entity = await _service.GetFeeAsync(formKey, _logger);

            if (entity == null)
                return new NotFoundObjectResult(new { error = $"No fee rule found for formKey '{formKey}'." });

            return new OkObjectResult(new
            {
                amount      = entity.Amount,
                description = entity.Description ?? string.Empty,
            });
        }
    }
}
