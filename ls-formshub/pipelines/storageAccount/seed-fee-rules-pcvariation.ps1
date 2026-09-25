<#
.SYNOPSIS
    Seeds the FeeRulePCVariation table with 26 rows - one per billable (prevCategory, newCategory, period) combo.

  Columns:
    PrevCategory              - exact category: volunteer|principal|principal-supervisor|employee|government|corporate
    NewCategory               - exact category: volunteer|principal|principal-supervisor|employee|government|corporate
    EffectivePeriodStartMMDD  - MM-DD start of period (01-01 or 07-01)
    EffectivePeriodEndMMDD    - MM-DD end of period (06-30 or 99-99 = open)

  Billable combinations (from fee schedule):
    Volunteer      -> Principal/Employee  : Jan-Jun $275+$45 | Jul-Dec $550+$90
    Volunteer      -> Government/Corporate: Jan-Jun $275     | Jul-Dec $550
    Government     -> Principal/Employee  : Jan-Jun $45      | Jul-Dec $90
    Corporate      -> Principal/Employee  : Jan-Jun $45      | Jul-Dec $90
    Principal-Sup  -> Principal/Employee  : Jan-Jun $45      | Jul-Dec $90

  All other combinations -> No Fees (handled in code, no table row needed).
  Same-category variations -> No Fees (handled in code).

.PARAMETER StorageAccountName  Azure Storage Account name (required).
.PARAMETER TableName            Table name. Defaults to "FeeRulePCVariation".

.EXAMPLE
  .\seed-fee-rules-pcvariation.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: Azure PowerShell Az modules (Get-AzStorageAccount, Add-AzTableRow).
    Total rows: 26
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRulePCVariation"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - PC Variation"              -ForegroundColor Yellow
Write-Host " StorageAccount : $StorageAccountName"         -ForegroundColor Yellow
Write-Host " Table          : $TableName"                  -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow

Write-Host "`nEnsuring table '$TableName' exists..." -ForegroundColor Gray
# Get storage account context using managed identity
$storageAccount = Get-AzStorageAccount | Where-Object { $_.StorageAccountName -eq $StorageAccountName }
if (-not $storageAccount) {
    Write-Error "Storage account '$StorageAccountName' not found"
    exit 1
}
$ctx = $storageAccount.Context

# Create table if it doesn't exist
$table = Get-AzStorageTable -Name $TableName -Context $ctx -ErrorAction SilentlyContinue
if (-not $table) {
    New-AzStorageTable -Name $TableName -Context $ctx | Out-Null
    Write-Host "Table '$TableName' created." -ForegroundColor Green
} else {
    Write-Host "Table '$TableName' already exists." -ForegroundColor Green
}

# Get CloudTable reference for entity operations
$cloudTable = (Get-AzStorageTable -Name $TableName -Context $ctx).CloudTable

function Insert-Rule {
    param(
        [string]$RowKey,
        [string]$PrevCategory,
        [string]$NewCategory,
        [string]$EffectivePeriodStartMMDD,
        [string]$EffectivePeriodEndMMDD,
        [double]$FeePc,
        [double]$FeeFidelity,
        [string]$Logic
    )

    Write-Host "  -> $RowKey  [$PrevCategory -> $NewCategory | $Logic | PC=`$$FeePc Fidelity=`$$FeeFidelity]" -ForegroundColor Cyan

    $entity = @{
        PartitionKey = "Registry"
        RowKey = $RowKey
        PrevCategory = $PrevCategory
        NewCategory = $NewCategory
        EffectivePeriodStartMMDD = $EffectivePeriodStartMMDD
        EffectivePeriodEndMMDD = $EffectivePeriodEndMMDD
        FeePc = [double]$FeePc
        FeeFidelity = [double]$FeeFidelity
        FeeSm = [double]0
        Logic = $Logic
    }

    try {
        Add-AzTableRow -Table $cloudTable -PartitionKey $entity.PartitionKey -RowKey $entity.RowKey -Property $entity -UpdateExisting | Out-Null
    }
    catch {
        Write-Error "Failed to insert entity: $RowKey - $_"
        exit 1
    }
}

# Volunteer -> Principal
Write-Host "`nVolunteer to Principal" -ForegroundColor Green
Insert-Rule -RowKey "VolToPrincipal_Jan" -PrevCategory "volunteer" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 275 -FeeFidelity 45 -Logic "Half PC + Half Fidelity"
Insert-Rule -RowKey "VolToPrincipal_Jul" -PrevCategory "volunteer" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 550 -FeeFidelity 90 -Logic "Full PC + Full Fidelity"
Insert-Rule -RowKey "VolToPrincipalSupervisor_Jan" -PrevCategory "volunteer" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 275 -FeeFidelity 0 -Logic "Half PC Fees (Free Fidelity)"
Insert-Rule -RowKey "VolToPrincipalSupervisor_Jul" -PrevCategory "volunteer" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 550 -FeeFidelity 0 -Logic "Full PC Fees (Free Fidelity)"

# Volunteer -> Employee
Write-Host "`nVolunteer to Employee" -ForegroundColor Green
Insert-Rule -RowKey "VolToEmployee_Jan" -PrevCategory "volunteer" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 275 -FeeFidelity 45 -Logic "Half PC + Half Fidelity"
Insert-Rule -RowKey "VolToEmployee_Jul" -PrevCategory "volunteer" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 550 -FeeFidelity 90 -Logic "Full PC + Full Fidelity"

# Volunteer -> Government
Write-Host "`nVolunteer to Government" -ForegroundColor Green
Insert-Rule -RowKey "VolToGovernment_Jan" -PrevCategory "volunteer" -NewCategory "government" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 275 -FeeFidelity 0 -Logic "Half PC Fees"
Insert-Rule -RowKey "VolToGovernment_Jul" -PrevCategory "volunteer" -NewCategory "government" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 550 -FeeFidelity 0 -Logic "Full PC Fees"

# Volunteer -> Corporate
Write-Host "`nVolunteer to Corporate" -ForegroundColor Green
Insert-Rule -RowKey "VolToCorporate_Jan" -PrevCategory "volunteer" -NewCategory "corporate" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 275 -FeeFidelity 0 -Logic "Half PC Fees"
Insert-Rule -RowKey "VolToCorporate_Jul" -PrevCategory "volunteer" -NewCategory "corporate" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 550 -FeeFidelity 0 -Logic "Full PC Fees"

# Government -> Principal
Write-Host "`nGovernment to Principal" -ForegroundColor Green
Insert-Rule -RowKey "GovToPrincipal_Jan" -PrevCategory "government" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "GovToPrincipal_Jul" -PrevCategory "government" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"
Insert-Rule -RowKey "GovToPrincipalSupervisor_Jan" -PrevCategory "government" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 0 -Logic "Free Fidelity"
Insert-Rule -RowKey "GovToPrincipalSupervisor_Jul" -PrevCategory "government" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 0 -Logic "Free Fidelity"

# Government -> Employee
Write-Host "`nGovernment to Employee" -ForegroundColor Green
Insert-Rule -RowKey "GovToEmployee_Jan" -PrevCategory "government" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "GovToEmployee_Jul" -PrevCategory "government" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"

# Corporate -> Principal
Write-Host "`nCorporate to Principal" -ForegroundColor Green
Insert-Rule -RowKey "CorpToPrincipal_Jan" -PrevCategory "corporate" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "CorpToPrincipal_Jul" -PrevCategory "corporate" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"
Insert-Rule -RowKey "CorpToPrincipalSupervisor_Jan" -PrevCategory "corporate" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 0 -Logic "Free Fidelity"
Insert-Rule -RowKey "CorpToPrincipalSupervisor_Jul" -PrevCategory "corporate" -NewCategory "principal-supervisor" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 0 -Logic "Free Fidelity"

# Corporate -> Employee
Write-Host "`nCorporate to Employee" -ForegroundColor Green
Insert-Rule -RowKey "CorpToEmployee_Jan" -PrevCategory "corporate" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "CorpToEmployee_Jul" -PrevCategory "corporate" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"

# Principal-Supervisor -> Principal
Write-Host "`nPrincipal-Supervisor to Principal" -ForegroundColor Green
Insert-Rule -RowKey "PrincipalSupervisorToPrincipal_Jan" -PrevCategory "principal-supervisor" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "PrincipalSupervisorToPrincipal_Jul" -PrevCategory "principal-supervisor" -NewCategory "principal" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"

# Principal-Supervisor -> Employee
Write-Host "`nPrincipal-Supervisor to Employee" -ForegroundColor Green
Insert-Rule -RowKey "PrincipalSupervisorToEmployee_Jan" -PrevCategory "principal-supervisor" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "01-01" -EffectivePeriodEndMMDD "06-30" -FeePc 0 -FeeFidelity 45 -Logic "Half Fidelity"
Insert-Rule -RowKey "PrincipalSupervisorToEmployee_Jul" -PrevCategory "principal-supervisor" -NewCategory "employee" `
    -EffectivePeriodStartMMDD "07-01" -EffectivePeriodEndMMDD "99-99" -FeePc 0 -FeeFidelity 90 -Logic "Full Fidelity"

Write-Host "`nDone. 26 PC Variation fee rules seeded into '$TableName'." -ForegroundColor Green
Write-Host "   All other combinations (including same-category) -> No Fees handled in code." -ForegroundColor Gray
