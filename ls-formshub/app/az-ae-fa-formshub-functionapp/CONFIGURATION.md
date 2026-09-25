# Azure Functions Configuration Guide

## Required Azure Resources

### 1. Azure Blob Storage Account
**Purpose:** Store uploaded form attachments (PDFs, documents)

**Setup Steps:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** → Search for **"Storage account"**
3. Fill in details:
   - **Resource Group:** Create new or use existing (e.g., `LSJProject-Resources`)
   - **Storage account name:** Must be unique, lowercase, no spaces (e.g., `lsjformstorage`)
   - **Region:** Choose closest to your users (e.g., `Australia East`)
   - **Performance:** Standard
   - **Redundancy:** LRS (Locally Redundant Storage) for cost savings, or GRS for backup
4. Click **"Review + Create"** → **"Create"**
5. Wait for deployment (~2 minutes)

**Get Connection String:**
1. Go to your storage account
2. Left menu → **"Access keys"**
3. Click **"Show keys"**
4. Copy the **"Connection string"** from Key1
5. Paste into `local.settings.json` → `AzureWebJobsStorage`

### 2. Stripe Account
**Purpose:** Process payments for form submissions

**Setup Steps:**
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Complete account verification (business details, bank account)
3. Switch to **Test Mode** toggle (top right) for development

**Get API Keys:**
1. Left menu → **"Developers"** → **"API keys"**
2. Copy **"Secret key"** (starts with `sk_test_...` for test mode)
3. Paste into `local.settings.json` → `StripeSecretKey`

**Setup Webhook (After deploying functions):**
1. Left menu → **"Developers"** → **"Webhooks"**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-function-app.azurewebsites.net/api/ProcessStripePaymentWebhook`
4. Events to listen: Select `checkout.session.completed`
5. Copy **"Signing secret"** (starts with `whsec_...`)
6. Paste into `local.settings.json` → `StripeWebhookSecret`

---

## Configuration File: local.settings.json

**Location:** `apps/az-ae-fa-formshub-functionapp/local.settings.json`

**Format:**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=lsjformstorage;AccountKey=YOUR_KEY_HERE==;EndpointSuffix=core.windows.net",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "StripeSecretKey": "sk_test_51ABC123...",
    "StripeWebhookSecret": "whsec_abc123..."
  }
}
```

**Security:**
- ✅ This file is in `.gitignore` - will NOT be committed to GitHub
- ✅ Safe to store real credentials here for local development
- ✅ Each developer should have their own `local.settings.json`

---

## Production Deployment Configuration

When deploying to Azure, **DO NOT** deploy `local.settings.json`. Instead:

### Option 1: Azure Portal (Manual)
1. Go to your **Function App** in Azure Portal
2. Left menu → **"Configuration"**
3. Click **"+ New application setting"** for each setting:
   - Name: `AzureWebJobsStorage`, Value: (your connection string)
   - Name: `FUNCTIONS_WORKER_RUNTIME`, Value: `dotnet-isolated`
   - Name: `StripeSecretKey`, Value: (your stripe key)
   - Name: `StripeWebhookSecret`, Value: (your webhook secret)
4. Click **"Save"** → **"Continue"**

### Option 2: Azure CLI (Automated)
```powershell
az functionapp config appsettings set --name YOUR_FUNCTION_APP_NAME --resource-group YOUR_RESOURCE_GROUP --settings "AzureWebJobsStorage=YOUR_CONNECTION_STRING"
az functionapp config appsettings set --name YOUR_FUNCTION_APP_NAME --resource-group YOUR_RESOURCE_GROUP --settings "StripeSecretKey=YOUR_STRIPE_KEY"
az functionapp config appsettings set --name YOUR_FUNCTION_APP_NAME --resource-group YOUR_RESOURCE_GROUP --settings "StripeWebhookSecret=YOUR_WEBHOOK_SECRET"
```

---

## Forms Configuration Reference

### Payment Forms

| Form Name | Route | SKU | Price | Business Unit |
|-----------|-------|-----|-------|---------------|
| Family Law Settlement Service | `/family-law-settlement-service` | 85408 | $2,750 | 1640 |
| Law Society Mediation Program | `/law-society-mediation-program` | 85407 | $1,200 | 1640 |
| Presidential Appointment (Full Fee) | `/presidential-appt-nomination` | 85404 | $660 | 1640 |
| Presidential Appointment (Split Fee) | `/presidential-appt-nomination-split-fee` | 85404 | $330 | 1640 |
| Lawyer Mediator Accreditation Scheme | `/lawyer-mediator-accreditation-scheme` | 80131 | $100 | 1640 |

### Non-Payment Forms

| Form Name | Route |
|-----------|-------|
| Practising Certificate | `/practising-certificate-new` |
| Certificate of Fitness | `/certificate-of-fitness` |

### Stripe Metadata

Each payment form submission includes:
```json
{
  "formType": "form-route-name",
  "businessUnit": "1640",
  "sku": "form-specific-sku",
  "submissionId": "guid"
}
```

---

## Environment-Specific Recommendations

### Development Environment
- Use **Test Mode** in Stripe
- Use separate Azure Storage account for dev
- Keep connection strings in `local.settings.json`

### Production Environment
- Use **Live Mode** in Stripe
- Use production Azure Storage account
- Store settings in Azure Portal Configuration
- Enable **Key Vault** references for enhanced security (optional)

---

## Testing Your Configuration

### 1. Test Storage Connection
```powershell
cd apps/az-ae-fa-formshub-functionapp
func start
```

Look for:
- ✅ `Functions: InitiateFormAttachmentsUpload: [POST] http://localhost:7071/api/InitiateFormAttachmentsUpload`
- ✅ No connection errors in console

### 2. Test File Upload Function
```powershell
# Test API call
curl -X POST http://localhost:7071/api/InitiateFormAttachmentsUpload `
  -H "Content-Type: application/json" `
  -d '{\"formType\":\"practising-certificate\",\"files\":[{\"fieldName\":\"certificateAttachment\",\"fileName\":\"test.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":1024}]}'
```

Expected response:
```json
{
  "submissionId": "abc-123-guid",
  "uploadUrls": [
    {
      "fieldName": "certificateAttachment",
      "uploadUrl": "https://...blob.core.windows.net/...?sas_token",
      "blobUrl": "https://...blob.core.windows.net/...",
      "expiresAt": "2025-12-08T..."
    }
  ]
}
```

### 3. Verify in Azure Portal
1. Go to your Storage Account
2. Left menu → **"Containers"**
3. Should see **"form-attachments"** container (auto-created by function)

---

## Troubleshooting

**Error: "No connection string found"**
- Check `AzureWebJobsStorage` is set in `local.settings.json`
- Restart `func start` after changing settings

**Error: "The remote name could not be resolved"**
- Check your connection string format
- Verify storage account name is correct
- Check internet connection

**Error: "Authorization failed"**
- Check AccountKey in connection string is correct
- Regenerate access key in Azure Portal if needed

**Container not created:**
- Check storage account allows public/private access
- Verify function has permissions (connection string includes AccountKey)
