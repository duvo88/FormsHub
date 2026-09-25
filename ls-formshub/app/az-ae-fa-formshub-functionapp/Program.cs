using api.Services;
using FormsHub.FeeLogic;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services => {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        var tableServiceUri = Environment.GetEnvironmentVariable("FeeRulesTableServiceUri")
            ?? throw new InvalidOperationException("FeeRulesTableServiceUri is not configured.");

        // Per-form-type table-backed services
        var tableNamePCNew = Environment.GetEnvironmentVariable("FeeRulesPCNewTableName") ?? "FeeRulePCNew";
        services.AddSingleton(new FeeRuleService(tableServiceUri, tableNamePCNew));

        var tableNamePCOriginal = Environment.GetEnvironmentVariable("FeeRulesPCOriginalTableName") ?? "FeeRulePCOriginal";
        services.AddSingleton(new FeeRuleServiceARCNew(tableServiceUri, tableNamePCOriginal));

        var tableNamePCRenew = Environment.GetEnvironmentVariable("FeeRulesPCRenewTableName") ?? "FeeRulePCRenew";
        services.AddSingleton(new FeeRuleServiceARCRenew(tableServiceUri, tableNamePCRenew));

        var tableNamePCVariation = Environment.GetEnvironmentVariable("FeeRulesPCVariationTableName") ?? "FeeRulePCVariation";
        services.AddSingleton(new FeeRuleServiceChangeEmploymentDetails(tableServiceUri, tableNamePCVariation));

        var tableNameSimpleForms = Environment.GetEnvironmentVariable("FeeRulesSimpleFormsTableName") ?? "FeeRuleSimpleForms";
        services.AddSingleton(new SimpleFormFeeService(tableServiceUri, tableNameSimpleForms));

        var tableNameCof = Environment.GetEnvironmentVariable("FeeRulesCofTableName") ?? "FeeRuleCof";
        services.AddKeyedSingleton("cof", new SimpleFormFeeService(tableServiceUri, tableNameCof));

        // Fee calculators — one per form type, injected into the unified GetFee function
        services.AddSingleton<PCNewFeeCalculator>();
        services.AddSingleton<ARCNewFeeCalculator>();
        services.AddSingleton<ARCRenewFeeCalculator>();
        services.AddSingleton<ChangeEmploymentDetailsFeeCalculator>();
        services.AddSingleton<PersistStoreService>();
    })
    .Build();

host.Run();
