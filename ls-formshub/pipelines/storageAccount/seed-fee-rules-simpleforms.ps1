<#
.SYNOPSIS
  Seeds FeeRuleSimpleForms table in Azure Table Storage with flat per-form fees for all
  forms that do not use dynamic fee calculation (i.e. not PC New/Renew/Original/Variation).

  One row per fee key. The frontend passes the key to GET /api/GetSimpleFee?formKey=<key>
  and receives back the Amount to use for the Stripe checkout.

  Table structure:
    PartitionKey : "FormFee"
    RowKey       : form key (see rows below)
    Amount       : fee in AUD (double)
    Description  : human-readable label

.PARAMETER StorageAccountName
  Azure Storage Account name (required).

.PARAMETER TableName
  Table name. Defaults to "FeeRuleSimpleForms".

.EXAMPLE
  .\seed-fee-rules-simpleforms.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: az cli, authenticated via 'az login'.
  Total rules: 5

  Note: PC Renew and PC Variation fees are seeded separately via their own seed scripts.
        Certificate of Fitness fees are seeded separately via seed-fee-rules-cof.ps1.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRuleSimpleForms"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - Simple Forms (flat fees)" -ForegroundColor Yellow
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
        [double]$Amount,
        [string]$Description
    )

    Write-Host "  -> $RowKey  [$Description | `$$Amount]" -ForegroundColor Cyan

    $entity = @{
        PartitionKey = "FormFee"
        RowKey = $RowKey
        Amount = [double]$Amount
        Description = $Description
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
# Family Law Settlement Service (FLSS)
# =============================================================================
Write-Host "`nFamily Law Settlement Service" -ForegroundColor Green
Insert-Rule -RowKey "flss" -Amount 1200 -Description "Family Law Settlement Service (FLSS)"

# =============================================================================
# Law Society Mediation Program
# =============================================================================
Write-Host "`nLaw Society Mediation Program" -ForegroundColor Green
Insert-Rule -RowKey "mediation-program" -Amount 1200 -Description "Law Society Mediation Program"

# =============================================================================
# Presidential Appointment or Nomination
# Two variants: full fee (one party pays all) and split fee (per party)
# =============================================================================
Write-Host "`nPresidential Appointment or Nomination" -ForegroundColor Green
Insert-Rule -RowKey "presidential-full-fee"  -Amount 660 -Description "Presidential Appointment or Nomination - Full Fee (incl. GST)"
Insert-Rule -RowKey "presidential-split-fee" -Amount 330 -Description "Presidential Appointment or Nomination - Split Fee per party (incl. GST)"

# =============================================================================
# Lawyer Mediator Accreditation Scheme
# =============================================================================
Write-Host "`nLawyer Mediator Accreditation Scheme" -ForegroundColor Green
Insert-Rule -RowKey "lawyer-mediator" -Amount 100 -Description "Lawyer Mediator Accreditation Scheme"

Write-Host "`n✅ Done. 5 rules seeded into '$TableName'." -ForegroundColor Green
