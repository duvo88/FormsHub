<#
.SYNOPSIS
  Seeds FeeRulePCRenew table in Azure Table Storage with fee rules for PC Renew (Foreign Lawyer) applications.

  The effective date for PCRenew is always hardcoded to 1 July (01/07) in the frontend,
  so only a single date row per registry type/country is needed — no period ranges.

  EffectivePeriodStartMMDD = "07-01", EndMMDD = "99-99" for all rows.

  Registry types (mapped by PCRenewFeeCalculator from formOfPractice):
    "Foreign Lawyer Principal/Employee"  <- partnership, incorporated, employee
                                            Fidelity: $90
    "Volunteer"                          <- volunteer_probono
                                            PC fee: $0, Fidelity: $0
    "Other"                              <- sole, volunteer (ARFL), employeeARFL, other
                                            Fidelity: $0

  FeeSm in the table is the BASE amount when AM = yes (Australia incl. GST, Outside AU no GST).
  The calculator returns FeeSm = 0 when the applicant selects AM = no.

  Associate Membership fee:
    Australia     (incl. 10% GST): $330
    Outside Australia (no GST):    $300

.PARAMETER StorageAccountName
  Azure Storage Account name (required).

.PARAMETER TableName
  Table name. Defaults to "FeeRulePCRenew".

.EXAMPLE
  .\seed-fee-rules-pcrenew.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: az cli, authenticated via 'az login'.
  Total rules: 6 (3 registry types x 2 countries)
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRulePCRenew"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - PC Renew (Foreign Lawyer)" -ForegroundColor Yellow
Write-Host " StorageAccount : $StorageAccountName"          -ForegroundColor Yellow
Write-Host " Table          : $TableName"                   -ForegroundColor Yellow
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
        [string]$RegistryType,
        [string]$Country,
        [string]$PeriodStart,
        [string]$PeriodEnd,
        [double]$FeePc,
        [double]$FeeFidelity,
        [double]$FeeSm,
        [string]$Logic
    )

    Write-Host "  -> $RowKey  [$RegistryType | $Country | $PeriodStart-$PeriodEnd]" -ForegroundColor Cyan

    $entity = @{
        PartitionKey = "Registry"
        RowKey = $RowKey
        RegistryType = $RegistryType
        PracticeCountry = $Country
        EffectivePeriodStartMMDD = $PeriodStart
        EffectivePeriodEndMMDD = $PeriodEnd
        FeePc = [double]$FeePc
        FeeFidelity = [double]$FeeFidelity
        FeeSm = [double]$FeeSm
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

# =============================================================================
# FOREIGN LAWYER PRINCIPAL / EMPLOYEE
# Mapped from formOfPractice: partnership, incorporated, employee
# Fidelity: $90
# =============================================================================
Write-Host "`nForeign Lawyer Principal/Employee" -ForegroundColor Green
Insert-Rule -RowKey "FLPE_Jul_AU" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 330 `
    -Logic "Full PC + Full Fidelity + Full AM (incl. GST)"

Insert-Rule -RowKey "FLPE_Jul_OA" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 300 `
    -Logic "Full PC + Full Fidelity + Full AM (No GST)"

# =============================================================================
# VOLUNTEER
# Mapped from formOfPractice: volunteer_probono
# PC fee: $0, Fidelity: $0
# =============================================================================
Write-Host "`nVolunteer" -ForegroundColor Green
Insert-Rule -RowKey "FLVOL_Jul_AU" `
    -RegistryType "Volunteer" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 330 `
    -Logic "No PC Fees + Full AM (incl. GST)"

Insert-Rule -RowKey "FLVOL_Jul_OA" `
    -RegistryType "Volunteer" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 300 `
    -Logic "No PC Fees + Full AM (No GST)"

# =============================================================================
# OTHER
# Mapped from formOfPractice: sole, volunteer (ARFL), employeeARFL, other
# Fidelity: $0
# =============================================================================
Write-Host "`nOther" -ForegroundColor Green
Insert-Rule -RowKey "FLOTHER_Jul_AU" `
    -RegistryType "Other" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 330 `
    -Logic "Full PC + Full AM (incl. GST)"

Insert-Rule -RowKey "FLOTHER_Jul_OA" `
    -RegistryType "Other" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 300 `
    -Logic "Full PC + Full AM (No GST)"

Write-Host "`n✅ Done. 6 PC Renew fee rules seeded into '$TableName'." -ForegroundColor Green
