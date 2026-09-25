using Azure;
using Azure.Data.Tables;
using Azure.Identity;
using Microsoft.Extensions.Logging;

namespace FormsHub.FeeLogic
{
    /// <summary>
    /// Reads flat per-form fees from the FeeRuleSimpleForms Azure Table.
    /// PartitionKey = "FormFee", RowKey = form key (e.g. "flss", "pcrenew").
    /// </summary>
    public class SimpleFormFeeEntity : ITableEntity
    {
        public string PartitionKey { get; set; } = "FormFee";
        public string RowKey { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string? Description { get; set; }
        public ETag ETag { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
    }

    public class SimpleFormFeeService
    {
        private readonly TableClient _tableClient;

        public SimpleFormFeeService(string tableServiceUri, string tableName)
        {
            var credential = new DefaultAzureCredential();
            _tableClient = new TableClient(new Uri(tableServiceUri), tableName, credential);
        }

        public async Task<SimpleFormFeeEntity?> GetFeeAsync(string formKey, ILogger logger)
        {
            logger.LogInformation("GetSimpleFee: formKey={FormKey}", formKey);
            try
            {
                var response = await _tableClient.GetEntityAsync<SimpleFormFeeEntity>("FormFee", formKey);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                logger.LogWarning("No fee rule found for formKey={FormKey}", formKey);
                return null;
            }
        }
    }
}
