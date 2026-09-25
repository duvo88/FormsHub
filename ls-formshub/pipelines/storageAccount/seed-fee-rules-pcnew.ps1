<#
.SYNOPSIS
  Seeds FeeRulePCNew table in Azure Table Storage with practising certificate fee rules for PC New applications.

  The table stores NO year-specific dates. Instead each row stores an EffectivePeriod
  bucket (Dec | JanJun | DecJun | JulPlus). The C# code resolves which bucket applies
  at runtime using the dynamically computed certYear - so this script only ever needs
  to be re-run if fee AMOUNTS change, not every year.

    FIDELITY FEE RULES (Table 2):
    - Principal/Employee only: Full $90 (Jul-Dec) or Half $45 (Jan-Jun)
    - Principal-Supervisor  : $0 always
  - Volunteer              : $0 always
  - Gov/Corporate          : $0 always
  - Not Currently Practising: $0 always

.PARAMETER StorageAccountName
  Azure Storage Account name (required).

.PARAMETER TableName
  Table name. Defaults to "FeeRulePCNew".

.EXAMPLE
  .\seed-fee-rules-pcnew.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: Azure PowerShell Az modules (Get-AzStorageAccount, Add-AzTableRow).
  Runs in AzurePowerShell@5 task with authenticated service principal.
    Total rules: 20 (4 PE + 4 PS + 4 GC + 4 VOL + 4 NCP)
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRulePCNew"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - PC New (year-agnostic)" -ForegroundColor Yellow
Write-Host " StorageAccount : $StorageAccountName" -ForegroundColor Yellow
Write-Host " Table          : $TableName" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

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

# -- Helper function ----------------------------------------------------------
function Insert-Rule {
    param(
        [string]$RowKey,
        [string]$AdmStartMMDD,
        [string]$AdmEndMMDD,
        [string]$PCYearStartMMDD,
        [string]$PCYearEndMMDD,
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
        AdmissionStartMMDD = $AdmStartMMDD
        AdmissionEndMMDD = $AdmEndMMDD
        RegistryType = $RegistryType
        PracticeCountry = $Country
        EffectivePeriodStartMMDD = $PeriodStart
        EffectivePeriodEndMMDD = $PeriodEnd
        PCYearStartMMDD = $PCYearStartMMDD
        PCYearEndMMDD = $PCYearEndMMDD
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
# PRINCIPAL / EMPLOYEE
# Fidelity: Full $90 (Jul-Dec) | Half $45 (Jan-Jun)
# SM      : $0 if DOA in PC year (Dec-Jun) | Full $440 AU / $400 OA otherwise
# =============================================================================
Write-Host "`nPrincipal/Employee" -ForegroundColor Green
Insert-Rule -RowKey "PE_Jan_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal/Employee" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 45 -FeeSm 440 `
    -Logic "Half PC + Half Fidelity + SM base AU (code-computed, incl. GST)"

Insert-Rule -RowKey "PE_Jan_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal/Employee" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 45 -FeeSm 400 `
    -Logic "Half PC + Half Fidelity + SM base OA (code-computed)"

Insert-Rule -RowKey "PE_Jul_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal/Employee" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 440 `
    -Logic "Full PC + Full Fidelity + Full SM (incl. GST)"

Insert-Rule -RowKey "PE_Jul_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal/Employee" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 90 -FeeSm 400 `
    -Logic "Full PC + Full Fidelity + Full SM (No GST)"

# =============================================================================
# PRINCIPAL - SUPERVISOR
# Fidelity: $0 always
# SM      : $0 if DOA in PC year (Dec-Jun) | Full $440 AU / $400 OA otherwise
# =============================================================================
Write-Host "`nPrincipal-Supervisor" -ForegroundColor Green
Insert-Rule -RowKey "PS_Jan_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal-Supervisor" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Half PC + Free Fidelity + SM base AU (code-computed, incl. GST)"

Insert-Rule -RowKey "PS_Jan_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal-Supervisor" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Half PC + Free Fidelity + SM base OA (code-computed)"

Insert-Rule -RowKey "PS_Jul_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal-Supervisor" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Full PC + Free Fidelity + Full SM (incl. GST)"

Insert-Rule -RowKey "PS_Jul_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Principal-Supervisor" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Full PC + Free Fidelity + Full SM (No GST)"

# =============================================================================
# GOV / CORPORATE
# Fidelity: $0 always (exempt)
# SM      : $0 if DOA in PC year (Dec-Jun) | Full $440 AU / $400 OA otherwise
# =============================================================================
Write-Host "`nGov/Corporate" -ForegroundColor Green
Insert-Rule -RowKey "GC_Jan_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Gov/Corporate" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Half PC + Free Fidelity + SM base AU (code-computed, incl. GST)"

Insert-Rule -RowKey "GC_Jan_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Gov/Corporate" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Half PC + Free Fidelity + SM base OA (code-computed)"

Insert-Rule -RowKey "GC_Jul_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Gov/Corporate" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Full PC + Free Fidelity + Full SM (incl. GST)"

Insert-Rule -RowKey "GC_Jul_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Gov/Corporate" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Full PC + Free Fidelity + Full SM (No GST)"

# =============================================================================
# VOLUNTEER
# Fidelity: $0 always (exempt)
# PC Fee  : $0 always
# SM      : $0 if DOA in PC year (Dec-Jun) | Full $440 AU / $400 OA otherwise
# Note    : Dec-Jun rows share one bucket (DecJun) as PC=0 regardless of half/full
# =============================================================================
Write-Host "`nVolunteer" -ForegroundColor Green
Insert-Rule -RowKey "VOL_DecJun_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Volunteer" -Country "Australia" `
    -PeriodStart "12-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 440 `
    -Logic "No PC Fees + Free Fidelity + SM base AU (code-computed, incl. GST)"

Insert-Rule -RowKey "VOL_DecJun_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Volunteer" -Country "Outside Australia" `
    -PeriodStart "12-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 400 `
    -Logic "No PC Fees + Free Fidelity + SM base OA (code-computed)"

Insert-Rule -RowKey "VOL_Jul_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Volunteer" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 440 `
    -Logic "No PC Fees + Free Fidelity + Full SM (incl. GST)"

Insert-Rule -RowKey "VOL_Jul_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Volunteer" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 0 -FeeFidelity 0 -FeeSm 400 `
    -Logic "No PC Fees + Free Fidelity + Full SM (No GST)"

# =============================================================================
# NOT CURRENTLY PRACTISING (NCP)
# Fidelity: $0 always (exempt - same as Gov/Corporate)
# PC Fee  : Half if Jan-Jun | Full if Jul-Dec or Dec
# SM      : $0 if DOA in PC year (Dec-Jun) | Full $440 AU / $400 OA otherwise
# =============================================================================
Write-Host "`nNot Currently Practising" -ForegroundColor Green
Insert-Rule -RowKey "NCP_Jan_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Not Currently Practising" -Country "Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Half PC + Free Fidelity + SM base AU (code-computed, incl. GST)"

Insert-Rule -RowKey "NCP_Jan_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Not Currently Practising" -Country "Outside Australia" `
    -PeriodStart "01-01" -PeriodEnd "06-30" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 275 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Half PC + Free Fidelity + SM base OA (code-computed)"

Insert-Rule -RowKey "NCP_Jul_AU" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Not Currently Practising" -Country "Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 440 `
    -Logic "Full PC + Free Fidelity + Full SM (incl. GST)"

Insert-Rule -RowKey "NCP_Jul_OA" `
    -PCYearStartMMDD "07-01" -PCYearEndMMDD "06-30" `
    -RegistryType "Not Currently Practising" -Country "Outside Australia" `
    -PeriodStart "07-01" -PeriodEnd "99-99" `
    -AdmStartMMDD "12-01" -AdmEndMMDD "06-30" `
    -FeePc 550 -FeeFidelity 0 -FeeSm 400 `
    -Logic "Full PC + Free Fidelity + Full SM (No GST)"

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host " All 20 fee rules seeded successfully." -ForegroundColor Green
Write-Host "                                            " -ForegroundColor Green
Write-Host "  PE  : 4 rows (Full/Half Fidelity)        " -ForegroundColor Green
Write-Host "  PS  : 4 rows (Free Fidelity)             " -ForegroundColor Green
Write-Host "  GC  : 4 rows (Free Fidelity)             " -ForegroundColor Green
Write-Host "  VOL : 4 rows (Free Fidelity, Free PC)    " -ForegroundColor Green
Write-Host "  NCP : 4 rows (Free Fidelity)             " -ForegroundColor Green
Write-Host "                                            " -ForegroundColor Green
Write-Host " Re-run only if fee AMOUNTS change.        " -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Yellow