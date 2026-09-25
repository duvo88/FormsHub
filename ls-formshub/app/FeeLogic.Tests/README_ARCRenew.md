# ARC Renew (Foreign Lawyer) â€” Fee Logic

## Overview

The fee for a **ARC Renew â€“ Foreign Lawyer** application is calculated dynamically at form-fill time via the unified `/api/GetFee` endpoint with `formType = "australian-registration-certificate-renew"`. The result is displayed to the applicant in **Section 12 â€“ Schedule of Fees and Payment** before they submit and then passed to the Stripe checkout session.

The rules are stored in Azure Table Storage (table: `FeeRuleARCRenew`). The effective date is always hardcoded to **1 July** in the frontend, so a single row per registry type/country is all that is needed â€” no period ranges.

> **Note:** The effective date for ARCRenew is always **01/07/\<currentYear\>** (locked in the UI).

---

## Fee Structure

| Form of Practice | Registry Type (table lookup key) | Fidelity Fund? |
|---|---|---|
| `partnership`, `incorporated`, `employee` | Foreign Lawyer Principal/Employee | âœ… Yes ($90) |
| `volunteer_probono` | Volunteer | âŒ No ($0 PC fee, $0 Fidelity) |
| `sole`, `volunteer` (ARFL), `employeeARFL`, `other` | Other | âŒ No Fidelity |

### Amounts (effective date always 1 July)

| Registry Type | Country | PC Fee | Fidelity | Associate Membership | Total (AM=Yes) |
|---|---|---|---|---|---|
| FL Principal/Employee | Australia | $550 | $90 | $330 (incl. $30 GST) | $970 |
| FL Principal/Employee | Outside AU | $550 | $90 | $300 (No GST) | $940 |
| Volunteer | Australia | $0 | $0 | $330 (incl. $30 GST) | $330 |
| Volunteer | Outside AU | $0 | $0 | $300 (No GST) | $300 |
| Other | Australia | $550 | $0 | $330 (incl. $30 GST) | $880 |
| Other | Outside AU | $550 | $0 | $300 (No GST) | $850 |

> **Associate Membership (AM):** The table always stores the full AM fee in `FeeSm`.  
> If `AM = "No"`, `ARCRenewFeeCalculator` zeroes `FeeSm` before returning.  
> GST (10%) applies only when the applicant's residential country is Australia.

---

## Components

### Azure Table Storage â€” `FeeRuleARCRenew`

Seeded by:

```powershell
.\cicd\storageAccount\seed-fee-rules-pcrenew.ps1 -StorageAccountName "<storage-account-name>"
```

**Row keys** (6 rows total):

| Row Key | Registry Type | Country |
|---|---|---|
| `FLPE_Jul_AU` | Foreign Lawyer Principal/Employee | Australia |
| `FLPE_Jul_OA` | Foreign Lawyer Principal/Employee | Outside Australia |
| `FLVOL_Jul_AU` | Volunteer | Australia |
| `FLVOL_Jul_OA` | Volunteer | Outside Australia |
| `FLOTHER_Jul_AU` | Other | Australia |
| `FLOTHER_Jul_OA` | Other | Outside Australia |

**Partition key**: `Registry` (all rows)

---

### API Endpoint â€” `POST /api/GetFee`

ARC Renew shares the **unified** fee endpoint. The `formType` field routes the request to `ARCRenewFeeCalculator`.

#### Request body

```json
{
  "formType": "australian-registration-certificate-renew",
  "effectiveDate": "2026-07-01",
  "formOfPractice": "partnership",
  "practiceCountry": "Australia",
  "AM": "yes"
}
```

| Field | Required | Notes |
|---|---|---|
| `formType` | âœ… | Must be `"australian-registration-certificate-renew"` |
| `effectiveDate` | âœ… | ISO 8601. Always `YYYY-07-01` in practice (locked in UI). |
| `formOfPractice` | âœ… | Radio button value from the form (see mapping below). |
| `practiceCountry` | âœ… | `"Australia"` â†’ AU rules (GST); anything else â†’ Outside Australia. |
| `AM` | âœ… | `"yes"` â†’ include AM fee; anything else â†’ AM fee = $0. |

#### Response body

```json
{
  "feeAmount": 970,
  "feePc": 550,
  "feeFidelity": 90,
  "feeSm": 330,
  "logic": "Full PC + Full Fidelity + Full AM (incl. GST)"
}
```

#### Form of Practice â†’ Registry Type mapping (`ARCRenewFeeCalculator`)

| `formOfPractice` value | Registry Type |
|---|---|
| `partnership` | Foreign Lawyer Principal/Employee |
| `incorporated` | Foreign Lawyer Principal/Employee |
| `employee` | Foreign Lawyer Principal/Employee |
| `volunteer_probono` | Volunteer |
| `sole` | Other |
| `volunteer` | Other |
| `employeeARFL` | Other |
| `other` | Other |

---

### Backend Architecture

```
POST /api/GetFee
  â””â”€ GetFee.cs (dispatcher)
       â””â”€ ARCRenewFeeCalculator  (Services/ARCRenewFeeCalculator.cs)
            â””â”€ FeeRuleServiceARCRenew  (Services/FeeRuleService.cs)
                 â””â”€ Azure Table: FeeRuleARCRenew
```

- **`ARCRenewFeeCalculator`** â€” validates required fields, maps `formOfPractice` â†’ registry type, calls `GetFeeRuleSimpleAsync`
- **`FeeRuleServiceARCRenew`** â€” typed DI subclass of `FeeRuleService`; uses `GetFeeRuleSimpleAsync` (no DOA logic)

---

### Frontend â€” `ARCRenewForm.tsx`

A `useEffect` calls `apiService.getFee({ formType: 'australian-registration-certificate-renew', ... })` whenever any of the following change:

- `commencePracticeDate` (effective date â€” locked to `01/07/<currentYear>`)
- `formOfPractice`
- `residentialCountry`
- `associateMember`

Section **12. Schedule of Fees and Payment** displays the fee table above the submit button.

On submit, `feeData.feeAmount` and `feeData.logic` are passed to Stripe.

---

## Configuration

### Azure Function App settings

| Setting | Default | Description |
|---|---|---|
| `FeeRulesARCRenewTableName` | `FeeRuleARCRenew` | Table name in Azure Table Storage |
| `FeeRulesTableServiceUri` | â€” | Table storage endpoint URI |

### Local development (`local.settings.json`)

```json
{
  "Values": {
    "FeeRulesARCRenewTableName": "FeeRuleARCRenew"
  }
}
```

---

## Test Cases (`GetFeeARCRenewIntegrationTests.cs`)

| Test Method | formOfPractice | Country | AM | effectiveDate | FeePc | FeeFidelity | FeeSm | Total |
|---|---|---|---|---|---|---|---|---|
| `FLPE_AU_AMYes_JulEffective_FullFees` | partnership | Australia | yes | 2026-07-01 | **$550** | **$90** | **$330** | **$970** |
| `FLPE_AU_AMNo_JulEffective_SmZero` | partnership | Australia | No | 2026-07-01 | **$550** | **$90** | **$0** | **$640** |
| `FLPE_Incorporated_AU_AMYes_JulEffective` | incorporated | Australia | yes | 2026-07-01 | **$550** | **$90** | **$330** | **$970** |
| `FLPE_Employee_AU_AMYes_JulEffective` | employee | Australia | yes | 2026-07-01 | **$550** | **$90** | **$330** | **$970** |
| `FLPE_OA_AMYes_JulEffective_FullFees` | partnership | Outside Australia | yes | 2026-07-01 | **$550** | **$90** | **$300** | **$940** |
| `FLPE_OA_AMNo_JulEffective_SmZero` | partnership | Outside Australia | No | 2026-07-01 | **$550** | **$90** | **$0** | **$640** |
| `FLVOL_AU_AMYes_JulEffective_NoPcFee` | volunteer_probono | Australia | yes | 2026-07-01 | **$0** | **$0** | **$330** | **$330** |
| `FLVOL_AU_AMNo_JulEffective_ZeroTotal` | volunteer_probono | Australia | No | 2026-07-01 | **$0** | **$0** | **$0** | **$0** |
| `FLVOL_OA_AMYes_JulEffective` | volunteer_probono | Outside Australia | yes | 2026-07-01 | **$0** | **$0** | **$300** | **$300** |
| `MissingFormOfPractice_Returns400` | *(omitted)* | â€” | â€” | â€” | â€” | â€” | â€” | **400** |
| `InvalidDate_Returns400` | partnership | Australia | yes | not-a-date | â€” | â€” | â€” | **400** |

> **GST:** applies when `practiceCountry = "Australia"` (`Logic` contains `"incl. GST"`).  
> **No GST:** `practiceCountry` other than Australia (`Logic` contains `"No GST"`).

---

## Running Integration Tests

```powershell
# From the repo root:
dotnet test ls-formshub/app/FeeLogic.Tests --filter Category=ARCRenew
```

**Prerequisites:**
1. Table `FeeRuleARCRenew` seeded (see above)
2. Function app running locally (`func host start` in `bin/Debug/net8.0`)

Override base URL if running on a different port:

```powershell
$env:GETFEE_BASE_URL = "http://localhost:7072"
dotnet test ls-formshub/app/FeeLogic.Tests --filter Category=ARCRenew
```

---

## Re-seeding / Updating Fees

Edit `pipelines/storageAccount/seed-fee-rules-pcrenew.ps1` and re-run - no code changes required.

