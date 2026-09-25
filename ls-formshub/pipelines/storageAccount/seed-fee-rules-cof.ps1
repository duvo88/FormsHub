<#
.SYNOPSIS
  Seeds Certificate of Fitness (CoF) fee rows into the FeeRuleSimpleForms table.

  The frontend always calls GET /api/GetSimpleFee?formKey=cof-<paymentType> regardless
  of membership, so all three rows must exist.

  Rows:
    cof-member            $0    (member — no Stripe checkout, but row kept for consistency)
    cof-au-non-member     $110  (Australian non-member, incl. GST)
    cof-overseas-non-member $100 (Overseas non-member, GST-exempt)

  PartitionKey = "FormFee" for all rows (same table as FeeRuleSimpleForms).

.PARAMETER StorageAccountName
  Azure Storage Account name (required).

.PARAMETER TableName
  Table name. Defaults to "FeeRuleSimpleForms".

.EXAMPLE
  .\seed-fee-rules-cof.ps1 -StorageAccountName "azaestformshubdev"

.NOTES
  Requires: az cli, authenticated via 'az login'.
  Total rules: 3
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,

    [string]$TableName = "FeeRuleCof"
)

# Import AzTable module for Add-AzTableRow cmdlet
if (-not (Get-Module -ListAvailable -Name AzTable)) {
    Install-Module -Name AzTable -Force -AllowClobber -Scope CurrentUser
}
Import-Module AzTable

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host " Seeding Fee Rules - Certificate of Fitness"   -ForegroundColor Yellow
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
# Certificate of Fitness (CoF) — 3 rows, one per payment tier
# Frontend computes key as: cof-<paymentAmount>
#   paymentAmount = 'member'            -> cof-member            ($0, skip Stripe)
#   paymentAmount = 'au-non-member'     -> cof-au-non-member     ($110 incl. GST)
#   paymentAmount = 'overseas-non-member' -> cof-overseas-non-member ($100)
# =============================================================================
Write-Host "`nCertificate of Fitness" -ForegroundColor Green
Insert-Rule -RowKey "cof-member"              -Amount   0 -Description "Certificate of Fitness - Member (no fee)"
Insert-Rule -RowKey "cof-au-non-member"       -Amount 110 -Description "Certificate of Fitness - AU Non-Member (incl. GST)"
Insert-Rule -RowKey "cof-overseas-non-member" -Amount 100 -Description "Certificate of Fitness - Overseas Non-Member"

Write-Host "`n✅ Done. 3 CoF rules seeded into '$TableName'." -ForegroundColor Green
