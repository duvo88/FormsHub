# Logic App Testing

Logic Apps are **declarative workflows** (JSON-based ARM templates), not code, so testing focuses on **validation** rather than unit tests.

## Test Strategy

### ✅ What We Test

1. **JSON Schema Validation** - Ensure valid JSON and ARM template structure
2. **Parameter Validation** - All required parameters exist in all environment files
3. **Resource Structure** - Workflow definition, identity, connections exist
4. **Configuration** - Email arrays not empty, workflow enabled
5. **ARM Template Validation** - Azure validates template before deployment (in pipeline)

### ❌ What We DON'T Test (Not Applicable)

- Business logic (Logic Apps are declarative, no code to unit test)
- Runtime workflow execution (requires deployed infrastructure)
- Integration testing (use Azure Monitor/Application Insights in production)

## Running Validation Tests

### Local Testing
```powershell
# Test specific environment
.\ls-formshub\app\logicApp\Test-LogicAppDefinition.ps1 -Environment dev

# Test all environments
@('dev','sit','uat','prd') | ForEach-Object {
    .\ls-formshub\app\logicApp\Test-LogicAppDefinition.ps1 -Environment $_
}
```

### CI/CD Pipeline
Tests run automatically before deployment in Azure DevOps pipeline:
```yaml
- task: PowerShell@2
  displayName: 'Validate Logic App Definition'
  inputs:
    filePath: 'ls-formshub/app/logicApp/Test-LogicAppDefinition.ps1'
    arguments: '-Environment $(environment)'
```

## Test Coverage

The validation script tests:

### ARM Template Structure (7 tests)
- ✅ Definition file exists
- ✅ Valid JSON syntax
- ✅ Has `$schema` property
- ✅ Has `contentVersion` property
- ✅ Has `parameters` section
- ✅ Has `resources` section
- ✅ Logic App workflow resource exists

### Required Parameters (7 tests)
- ✅ `workflows_integration_formhub_name`
- ✅ `workflows_integration_formhub_emailto_registry`
- ✅ `workflows_integration_formhub_emailto_a2j`
- ✅ `workflows_integration_formhub_storageaccountname`
- ✅ `workflows_integration_formhub_SBSubscription`
- ✅ `workflows_integration_formhub_SBTopic`
- ✅ `workflows_integration_formhub_$connections`

### Workflow Configuration (3 tests)
- ✅ Workflow has system-assigned managed identity
- ✅ Workflow definition exists
- ✅ Workflow state is "Enabled"

### Parameter Files (8+ tests)
- ✅ Parameter file exists for target environment
- ✅ Valid JSON syntax
- ✅ Has correct ARM parameter file structure
- ✅ All required parameters have values
- ✅ Email arrays are not empty
- ✅ All environment files exist (dev/sit/uat/prd)

### Azure ARM Validation (in pipeline)
- ✅ ARM template syntax validation
- ✅ Resource provider validation
- ✅ API version validation
- ✅ Parameter compatibility validation

## Monitoring & Production Testing

Since Logic Apps are workflows, **runtime testing** happens in production:

### Azure Monitor
- Track workflow runs (success/failure)
- Monitor trigger execution
- View action execution history

### Application Insights
- Custom telemetry from Function App
- Correlation IDs across services
- Performance tracking

### Logic App Run History
```bash
# View recent runs
az logic workflow show-runs \
  --name integration-formhub-dev \
  --resource-group <resource-group> \
  --top 10
```

## Best Practices

1. **Validate before deploy** - Always run validation script locally before committing
2. **Test parameter files** - Ensure all environments have correct configuration
3. **Use ARM validation** - Let Azure validate template before actual deployment
4. **Monitor in production** - Use Logic App run history and Application Insights
5. **Version control** - Track changes to workflow definition in git

## Adding More Validation

### Validate Connections
```powershell
# Check connection references
$connections = $definition.parameters.'$connections'.defaultValue
foreach ($conn in $connections.PSObject.Properties) {
    # Validate connection exists
}
```

### Validate Actions
```powershell
# Check specific actions exist
$actions = $logicAppResource.properties.definition.actions
Test-Result "Has Send Email action" ($null -ne $actions.'Send_Email')
```

### Validate Triggers
```powershell
# Check Service Bus trigger
$trigger = $logicAppResource.properties.definition.triggers
Test-Result "Has Service Bus trigger" ($trigger.PSObject.Properties.Name -contains 'When_messages_are_available')
```

## Sample Test Output

```
=== Logic App Validation Tests ===
Environment: dev

✓ PASS: Definition file exists
✓ PASS: Parameter file exists for dev
✓ PASS: Definition is valid JSON
✓ PASS: Has $schema property
✓ PASS: Has contentVersion property
✓ PASS: Has parameters section
✓ PASS: Has resources section
✓ PASS: Has parameter: workflows_integration_formhub_name
✓ PASS: Workflow has managed identity
✓ PASS: Registry email array is not empty
...

=== Test Summary ===
Passed: 25
Failed: 0

Validation PASSED
```

## Integration with Function App

Logic App receives messages from Service Bus after Function App publishes them:

1. Function App → Service Bus Topic
2. Service Bus Subscription → Logic App Trigger
3. Logic App → Send Email via Office 365

Test the full flow in each environment after deployment.
