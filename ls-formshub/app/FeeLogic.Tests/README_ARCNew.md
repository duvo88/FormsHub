# ARC New (Foreign Lawyer) â€” Fee Logic

## Overview

The fee for a **ARC New â€“ Foreign Lawyer** application is calculated dynamically at form-fill time via the unified `/api/GetFee` endpoint with `formType = "australian-registration-certificate-new"`. The result is displayed to the applicant before they submit and then passed to the Stripe checkout session.

The rules are stored in Azure Table Storage (table: `FeeRuleARCNew`). Lookup is simpler than PC New â€” no Date of Admission branching. Period (Janâ€“Jun vs Julâ€“Dec) and country (Australia vs Outside Australia) determine the amounts; the table already stores the correct half/full values per bucket.

---

## Fee Structure

| Form of Practice | Registry Type (table lookup key) | Fidelity Fund? |
|---|---|---|
| `partnership`, `incorporated`, `employee` | Foreign Lawyer Principal/Employee | âœ… Yes |
| `volunteer_probono` | Volunteer | âŒ No |
| `sole`, `volunteer` (ARFL), `employeeARFL`, `other` | Other | âŒ No |

### Amounts by effective date period

| Registry Type | Period | Country | PC Fee | Fidelity | Associate Membership | Total (AM=Yes) |
|---|---|---|---|---|---|---|
| FL Principal/Employee | Janâ€“Jun | Australia | $275 | $45 | $165 (incl. GST $15) | $485 |
| FL Principal/Employee | Janâ€“Jun | Outside AU | $275 | $45 | $150 (No GST) | $470 |
| FL Principal/Employee | Julâ€“Dec | Australia | $550 | $90 | $330 (incl. GST $30) | $970 |
| FL Principal/Employee | Julâ€“Dec | Outside AU | $550 | $90 | $300 (No GST) | $940 |
| Volunteer | Janâ€“Jun | Australia | $0 | $0 | $165 (incl. GST $15) | $165 |
| Volunteer | Janâ€“Jun | Outside AU | $0 | $0 | $150 (No GST) | $150 |
| Volunteer | Julâ€“Dec | Australia | $0 | $0 | $330 (incl. GST $30) | $330 |
| Volunteer | Julâ€“Dec | Outside AU | $0 | $0 | $300 (No GST) | $300 |
| Other | Janâ€“Jun | Australia | $275 | $0 | $165 (incl. GST $15) | $440 |
| Other | Janâ€“Jun | Outside AU | $275 | $0 | $150 (No GST) | $425 |
| Other | Julâ€“Dec | Australia | $550 | $0 | $330 (incl. GST $30) | $880 |
| Other | Julâ€“Dec | Outside AU | $550 | $0 | $300 (No GST) | $850 |

> **Associate Membership (AM):** The table always stores the full AM fee in `FeeSm`.  
> If `AM = "No"`, `ARCNewFeeCalculator` zeroes `FeeSm` before returning.  
> GST applies only when the applicant's residential country is Australia.

---

## Components

### Azure Table Storage â€” `FeeRuleARCNew`

Seeded by:

```powershell
.\cicd\storageAccount\seed-fee-rules-pcoriginal.ps1 -StorageAccountName "<storage-account-name>"
```

**Row keys** (12 rows total):

| Row Key | Registry Type | Country |
|---|---|---|
| `FLPE_Jan_AU` | Foreign Lawyer Principal/Employee | Australia |
| `FLPE_Jan_OA` | Foreign Lawyer Principal/Employee | Outside Australia |
| `FLPE_Jul_AU` | Foreign Lawyer Principal/Employee | Australia |
| `FLPE_Jul_OA` | Foreign Lawyer Principal/Employee | Outside Australia |
| `FLVOL_Jan_AU` | Volunteer | Australia |
| `FLVOL_Jan_OA` | Volunteer | Outside Australia |
| `FLVOL_Jul_AU` | Volunteer | Australia |
| `FLVOL_Jul_OA` | Volunteer | Outside Australia |
| `FLOTHER_Jan_AU` | Other | Australia |
| `FLOTHER_Jan_OA` | Other | Outside Australia |
| `FLOTHER_Jul_AU` | Other | Australia |
| `FLOTHER_Jul_OA` | Other | Outside Australia |

**Partition key**: `Registry` (all rows)

---

### API Endpoint â€” `POST /api/GetFee`

ARC New shares the **unified** fee endpoint with all other form types. The `formType` field routes the request to `ARCNewFeeCalculator`.

#### Request body

```json
{
  "formType": "australian-registration-certificate-new",
  "effectiveDate": "2026-07-01",
  "formOfPractice": "partnership",
  "practiceCountry": "Australia",
  "AM": "yes"
}
```

| Field | Required | Notes |
|---|---|---|
| `formType` | âœ… | Must be `"australian-registration-certificate-new"` |
| `effectiveDate` | âœ… | ISO 8601. Determines Janâ€“Jun vs Julâ€“Dec period. |
| `formOfPractice` | âœ… | Radio button value from the form (see mapping below). |
| `practiceCountry` | âœ… | `"Australia"` â†’ AU rules; anything else â†’ Outside Australia. |
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

#### Form of Practice â†’ Registry Type mapping (`ARCNewFeeCalculator`)

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
       â””â”€ ARCNewFeeCalculator  (Services/ARCNewFeeCalculator.cs)
            â””â”€ FeeRuleServiceARCNew  (Services/FeeRuleService.cs)
                 â””â”€ Azure Table: FeeRuleARCNew
```

- **`IFeeCalculator`** â€” interface with `Validate()` + `CalculateAsync()`
- **`ARCNewFeeCalculator`** â€” validates required fields, maps `formOfPractice` â†’ registry type, calls `GetFeeRuleSimpleAsync`
- **`FeeRuleServiceARCNew`** â€” typed DI subclass of `FeeRuleService`; uses `GetFeeRuleSimpleAsync` (no DOA logic)

---

### Frontend â€” `ARCNewForm.tsx`

A `useEffect` calls `apiService.getFee({ formType: 'australian-registration-certificate-new', ... })` whenever any of the following change:

- `commencePracticeDate` (effective date)
- `formOfPractice`
- `residentialCountry`
- `associateMember`

The fee schedule table is displayed above the Declaration section showing PC fee, Fidelity, Associate Membership, and Total.

On submit, `feeData.feeAmount` and `feeData.logic` are passed to Stripe.

---

### Stripe â€” `CreateStripeCheckoutSession.cs`

- `smHasGst`: true when `Logic` contains `"incl. GST"`
- `gstLineName`: `"Associate Membership"` when `SmLogic` contains `"Associate Membership"`

---

## Configuration

### Azure Function App settings

| Setting | Default | Description |
|---|---|---|
| `FeeRulesARCNewTableName` | `FeeRuleARCNew` | Table name in Azure Table Storage |
| `FeeRulesTableServiceUri` | â€” | Table storage endpoint URI |

### Local development (`local.settings.json`)

```json
{
  "Values": {
    "FeeRulesARCNewTableName": "FeeRuleARCNew"
  }
}
```

---

## Test Cases (`GetFeeARCNewIntegrationTests.cs`)

| Test Method | formOfPractice | Country | AM | effectiveDate | FeePc | FeeFidelity | FeeSm | Total |
|---|---|---|---|---|---|---|---|---|
| `FLPE_AU_AMYes_JulEffective_FullFees` | partnership | Australia | yes | 2025-07-01 | **$550** | **$90** | **$330** | **$970** |
| `FLPE_AU_AMYes_JanEffective_HalfFees` | partnership | Australia | yes | 2026-01-15 | **$275** | **$45** | **$165** | **$485** |
| `FLPE_AU_AMNo_JulEffective_SmZero` | partnership | Australia | No | 2025-09-01 | $550 â€  | $90 â€  | **$0** | **$640** |
| `FLPE_Incorporated_AU_AMYes_JulEffective` | incorporated | Australia | yes | 2025-07-15 | **$550** | **$90** | **$330** | **$970** |
| `FLPE_Employee_AU_AMYes_JanEffective` | employee | Australia | yes | 2026-03-01 | **$275** | **$45** | **$165** | **$485** |
| `FLPE_OA_AMYes_JulEffective_FullFees` | partnership | Outside Australia | yes | 2025-08-01 | **$550** | **$90** | **$300** | **$940** |
| `FLPE_OA_AMYes_JanEffective_HalfFees` | partnership | Outside Australia | yes | 2026-02-01 | **$275** | **$45** | **$150** | **$470** |
| `FLVOL_AU_AMYes_JulEffective_NoPcFee` | volunteer_probono | Australia | yes | 2025-10-01 | **$0** | **$0** | **$330** | **$330** |
| `FLVOL_AU_AMYes_JanEffective_HalfAm` | volunteer_probono | Australia | yes | 2026-04-01 | **$0** | **$0** | **$165** | **$165** |
| `FLVOL_OA_AMYes_JulEffective` | volunteer_probono | Outside Australia | yes | 2025-11-01 | **$0** | $0 â€  | **$300** | **$300** |
| `FLVOL_AMNo_JulEffective_ZeroTotal` | volunteer_probono | Australia | No | 2025-07-15 | **$0** | $0 â€  | **$0** | **$0** |

> **We do not grant PC for Volunteers residing outside Australia or who have a PPP outside Australia.**
| `FLOther_Sole_AU_AMYes_JulEffective` | sole | Australia | yes | 2025-07-01 | **$550** | **$0** | **$330** | **$880** |
| `FLOther_Sole_AU_AMYes_JanEffective` | sole | Australia | yes | 2026-05-01 | **$275** | **$0** | **$165** | **$440** |
| `FLOther_EmployeeARFL_OA_AMYes_JulEffective` | employeeARFL | Outside Australia | yes | 2025-08-15 | **$550** | **$0** | **$300** | **$850** |
| `FLOther_Other_AU_AMNo_JulEffective` | other | Australia | No | 2025-09-01 | **$550** | **$0** | **$0** | **$550** |
| `MissingFields_Returns400` | *(missing fields)* | â€” | â€” | â€” | â€” | â€” | â€” | **400** |
| `InvalidDate_Returns400` | partnership | Australia | yes | not-a-date | â€” | â€” | â€” | **400** |

> **Bold** values are explicitly asserted by the test.  
> **â€ ** value comes from the fee table (known correct) but the test does not assert it â€” the test focuses on a different field in that row.  
> **â€”** means the test does not assert that field and the value is not relevant to the test's purpose.  
> **Period rule:** `effectiveDate` month 1â€“6 â†’ Janâ€“Jun (half fee); month 7â€“12 â†’ Julâ€“Dec (full fee).  
> **GST:** applies when `practiceCountry = "Australia"` (`Logic` contains `"incl. GST"`).  
> **No GST:** `practiceCountry` other than Australia (`Logic` contains `"No GST"`).

---

## Running Integration Tests

```powershell
# From the repo root:
dotnet test ls-formshub/app/FeeLogic.Tests --filter Category=ARCNew
```

**Prerequisites:**
1. Table seeded (see above)
2. Function app running locally (`func host start` in `bin/Debug/net8.0`)

Override base URL if running on a different port:

```powershell
$env:GETFEE_BASE_URL = "http://localhost:7072"
dotnet test ls-formshub/app/FeeLogic.Tests --filter Category=ARCNew
```

---

## Re-seeding / Updating Fees

Edit `seed-fee-rules-pcoriginal.ps1` and re-run â€” no code changes required.

