<#
.SYNOPSIS
  Seeds FeeRulePCOriginal table in Azure Table Storage with fee rules for PC Original (Foreign Lawyer) applications.

  Rules are period-based only (no Date of Admission logic):
    Jul-Dec → full fees   (EffectivePeriodStartMMDD = "07-01", EndMMDD = "99-99")
    Jan-Jun → half fees   (EffectivePeriodStartMMDD = "01-01", EndMMDD = "06-30")

  Registry types (mapped by PCOriginalFeeCalculator from formOfPractice):
    "Foreign Lawyer Principal/Employee"  ← partnership, incorporated, employee
    "Volunteer"                          ← volunteer_probono
    "Other"                              ← sole, employeeARFL, other

  FeeSm in the table is the BASE amount when AM = yes.
  The calculator returns FeeSm = 0 when the applicant selects AM = no.

.PARAMETER StorageAccountName
  Azure Storage Account name (required).

.PARAMETER TableName
  Table name. Defaults to "FeeRulePCOriginal".

.EXAMPLE
  .\seed-fee-rules-pcoriginal.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: az cli, authenticated via 'az login'.
  Total rules: 12 (3 registry types × 2 periods × 2 countries)
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRulePCOriginal"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - PC Original (Foreign Lawyer)" -ForegroundColor Yellow
Write-Host " StorageAccount : $StorageAccountName" -ForegroundColor Yellow
Write-Host " Table          : $TableName" -ForegroundColor Yellow
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
# Fidelity: Full $90 (Jul-Dec) | Half $45 (Jan-Jun)
# =============================================================================
Write-Host "`nForeign Lawyer Principal/Employee" -ForegroundColor Green
Insert-Rule -RowKey "FLPE_Jul_AU" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 330 `
    -Logic "Full PC + Full Fidelity + Full AM (incl. GST)"

Insert-Rule -RowKey "FLPE_Jan_AU" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 275 -FeeFidelity 45 -FeeSm 165 `
    -Logic "Half PC + Half Fidelity + Half AM (incl. GST)"

Insert-Rule -RowKey "FLPE_Jul_OA" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 300 `
    -Logic "Full PC + Full Fidelity + Full AM (No GST)"

Insert-Rule -RowKey "FLPE_Jan_OA" `
    -RegistryType "Foreign Lawyer Principal/Employee" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 275 -FeeFidelity 45 -FeeSm 150 `
    -Logic "Half PC + Half Fidelity + Half AM (No GST)"

# =============================================================================
# VOLUNTEER
# Mapped from formOfPractice: volunteer_probono
# Fidelity: $0 always
# PC fee:   $0 always
# =============================================================================
Write-Host "`nVolunteer" -ForegroundColor Green
Insert-Rule -RowKey "FLVOL_Jul_AU" `
    -RegistryType "Volunteer" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 330 `
    -Logic "Volunteer AU - Full AM only (incl. GST)"

Insert-Rule -RowKey "FLVOL_Jan_AU" `
    -RegistryType "Volunteer" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 165 `
    -Logic "Volunteer AU - Half AM only (incl. GST)"

Insert-Rule -RowKey "FLVOL_Jul_OA" `
    -RegistryType "Volunteer" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 300 `
    -Logic "Volunteer OA - Full AM only (No GST)"

Insert-Rule -RowKey "FLVOL_Jan_OA" `
    -RegistryType "Volunteer" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 150 `
    -Logic "Volunteer OA - Half AM only (No GST)"

# =============================================================================
# OTHER
# Mapped from formOfPractice: sole, employeeARFL, other
# Fidelity: $0 always
# =============================================================================
Write-Host "`nOther" -ForegroundColor Green
Insert-Rule -RowKey "FLOTHER_Jul_AU" `
    -RegistryType "Other" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 330 `
    -Logic "Full PC + Full AM (incl. GST)"

Insert-Rule -RowKey "FLOTHER_Jan_AU" `
    -RegistryType "Other" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 165 `
    -Logic "Half PC + Half AM (incl. GST)"

Insert-Rule -RowKey "FLOTHER_Jul_OA" `
    -RegistryType "Other" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 300 `
    -Logic "Full PC + Full AM (No GST)"

Insert-Rule -RowKey "FLOTHER_Jan_OA" `
    -RegistryType "Other" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 150 `
    -Logic "Half PC + Half AM (No GST)"

Write-Host "`n✅ Done. 12 rules seeded into '$TableName'." -ForegroundColor Green
