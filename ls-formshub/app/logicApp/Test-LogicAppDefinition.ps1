# Logic App Validation Tests
# Validates Logic App ARM template and parameter files before deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
$testsPassed = 0
$testsFailed = 0

function Test-Result {
    param($TestName, $Condition, $ErrorMessage)
    
    if ($Condition) {
        Write-Host "PASS: $TestName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "FAIL: $TestName" -ForegroundColor Red
        Write-Host "  $ErrorMessage" -ForegroundColor Yellow
        $script:testsFailed++
    }
}

Write-Host ""
Write-Host "=== Logic App Validation Tests ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

# Determine base path - handle both pipeline and local execution
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$scriptDir/integration-formhub.definition.json") {
    $basePath = $scriptDir
} elseif (Test-Path "ls-formshub/app/logicApp/integration-formhub.definition.json") {
    $basePath = "ls-formshub/app/logicApp"
} elseif (Test-Path "$PSScriptRoot/integration-formhub.definition.json") {
    $basePath = $PSScriptRoot
} else {
    Write-Host "ERROR: Cannot find Logic App definition files" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Script directory: $scriptDir" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using base path: $basePath" -ForegroundColor Gray
Write-Host ""

$definitionFile = "$basePath/integration-formhub.definition.json"
$paramFile = "$basePath/integration-formhub-$Environment.parameters.json"

# Test 1: Definition file exists
Test-Result `
    -TestName "Definition file exists" `
    -Condition (Test-Path $definitionFile) `
    -ErrorMessage "File not found: $definitionFile"

# Test 2: Parameter file exists
Test-Result `
    -TestName "Parameter file exists for $Environment" `
    -Condition (Test-Path $paramFile) `
    -ErrorMessage "File not found: $paramFile"

if (Test-Path $definitionFile) {
    # Test 3: Definition is valid JSON
    $definition = $null
    try {
        $definition = Get-Content $definitionFile -Raw | ConvertFrom-Json
        Test-Result `
            -TestName "Definition is valid JSON" `
            -Condition $true `
            -ErrorMessage ""
    } catch {
        Test-Result `
            -TestName "Definition is valid JSON" `
            -Condition $false `
            -ErrorMessage $_.Exception.Message
    }

    if ($definition) {
        # Test 4: Has required ARM template properties
        Test-Result `
            -TestName "Has schema property" `
            -Condition ($null -ne $definition.'$schema') `
            -ErrorMessage "Missing schema in template"

        Test-Result `
            -TestName "Has contentVersion property" `
            -Condition ($null -ne $definition.contentVersion) `
            -ErrorMessage "Missing contentVersion in template"

        Test-Result `
            -TestName "Has parameters section" `
            -Condition ($null -ne $definition.parameters) `
            -ErrorMessage "Missing parameters section"

        Test-Result `
            -TestName "Has resources section" `
            -Condition ($null -ne $definition.resources) `
            -ErrorMessage "Missing resources section"

        # Test 5: Required parameters are defined
        $requiredParams = @(
            'workflows_integration_formhub_name',
            'workflows_integration_formhub_emailto_registry',
            'workflows_integration_formhub_emailto_a2j',
            'workflows_integration_formhub_storageaccountname',
            'workflows_integration_formhub_SBSubscription',
            'workflows_integration_formhub_SBTopic',
            'workflows_integration_formhub_$connections'
        )

        foreach ($param in $requiredParams) {
            $hasParam = $definition.parameters.PSObject.Properties.Name -contains $param
            Test-Result `
                -TestName "Has parameter: $param" `
                -Condition $hasParam `
                -ErrorMessage "Missing required parameter: $param"
        }

        # Test 6: Logic App resource is defined
        $logicAppResource = $definition.resources | Where-Object { $_.type -eq "Microsoft.Logic/workflows" }
        Test-Result `
            -TestName "Has Logic App workflow resource" `
            -Condition ($null -ne $logicAppResource) `
            -ErrorMessage "No Microsoft.Logic/workflows resource found"

        if ($logicAppResource) {
            # Test 7: Workflow has identity
            Test-Result `
                -TestName "Workflow has managed identity" `
                -Condition ($null -ne $logicAppResource.identity) `
                -ErrorMessage "Workflow should have system-assigned identity"

            # Test 8: Workflow definition exists
            Test-Result `
                -TestName "Workflow has definition" `
                -Condition ($null -ne $logicAppResource.properties.definition) `
                -ErrorMessage "Workflow properties.definition is missing"

            # Test 9: Workflow is enabled
            Test-Result `
                -TestName "Workflow state is Enabled" `
                -Condition ($logicAppResource.properties.state -eq "Enabled") `
                -ErrorMessage "Workflow state should be 'Enabled'"
        }
    }
}

if (Test-Path $paramFile) {
    # Test 10: Parameter file is valid JSON
    $params = $null
    try {
        $params = Get-Content $paramFile -Raw | ConvertFrom-Json
        Test-Result `
            -TestName "Parameter file is valid JSON" `
            -Condition $true `
            -ErrorMessage ""
    } catch {
        Test-Result `
            -TestName "Parameter file is valid JSON" `
            -Condition $false `
            -ErrorMessage $_.Exception.Message
    }

    if ($params) {
        # Test 11: Parameter file has correct structure
        Test-Result `
            -TestName "Parameter file has schema" `
            -Condition ($null -ne $params.'$schema') `
            -ErrorMessage "Missing schema in parameter file"

        Test-Result `
            -TestName "Parameter file has contentVersion" `
            -Condition ($null -ne $params.contentVersion) `
            -ErrorMessage "Missing contentVersion in parameter file"

        Test-Result `
            -TestName "Parameter file has parameters section" `
            -Condition ($null -ne $params.parameters) `
            -ErrorMessage "Missing parameters section in parameter file"

        # Test 12: All required parameters have values
        if ($params.parameters) {
            foreach ($param in $requiredParams) {
                $hasValue = $null -ne $params.parameters.$param
                Test-Result `
                    -TestName "Parameter '$param' has value in $Environment" `
                    -Condition $hasValue `
                    -ErrorMessage "Missing value for parameter: $param"
            }

            # Test 13: Email arrays are not empty
            if ($params.parameters.workflows_integration_formhub_emailto_registry) {
                $emailRegistry = $params.parameters.workflows_integration_formhub_emailto_registry.value
                Test-Result `
                    -TestName "Registry email array is not empty" `
                    -Condition ($emailRegistry.Count -gt 0) `
                    -ErrorMessage "workflows_integration_formhub_emailto_registry should not be empty"
            }

            if ($params.parameters.workflows_integration_formhub_emailto_a2j) {
                $emailA2J = $params.parameters.workflows_integration_formhub_emailto_a2j.value
                Test-Result `
                    -TestName "A2J email array is not empty" `
                    -Condition ($emailA2J.Count -gt 0) `
                    -ErrorMessage "workflows_integration_formhub_emailto_a2j should not be empty"
            }
        }
    }
}

# Test 14: All environment parameter files exist
$environments = @('dev', 'sit', 'uat', 'prd')
foreach ($env in $environments) {
    $envParamFile = "$basePath/integration-formhub-$env.parameters.json"
    Test-Result `
        -TestName "Parameter file exists for $env environment" `
        -Condition (Test-Path $envParamFile) `
        -ErrorMessage "Missing parameter file: $envParamFile"
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })

if ($testsFailed -gt 0) {
    Write-Host ""
    Write-Host "Validation FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "Validation PASSED" -ForegroundColor Green
    exit 0
}
