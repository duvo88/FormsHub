# Change Employment Details — Fee Logic & Test Cases

## Overview

The Change Employment Details fee is calculated using a **hybrid approach**:
- **Backend API** (`PCVariationFeeCalculator`) calculates fees for a single category transition via `POST /api/GetFee` (`formType = "change-in-employment-details"`)
- **Frontend logic** (in `ChangeEmploymentDetailsForm.tsx`) handles multiple practice entities by making multiple API calls and applying scenario-based fee rules

### Backend API Inputs:
- `prevCategory` — previous practice category (`volunteer` | `principal` | `employee` | `government` | `corporate`)
- `newCategory` — new practice category (same options)
- `effectiveDate` — ISO 8601 date; month determines Jan–Jun vs Jul–Dec period

### Frontend Multi-Category Logic:
When a user selects "Yes" for "Do you intend to practice with more than one entity?", the form collects:
- **Entity 1 Category + Date**: Main practice entity/category and date
- **Entity 2 Category + Date**: Additional practice entity/category and date

The frontend makes two API calls and combines fees using component-wise max logic:

1. Call `GetFee` for `Previous -> Entity 1` using Entity 1 date.
2. Call `GetFee` for `Previous -> Entity 2` using Entity 2 date.
3. Build the final charge as:
	- `FinalPC = max(Entity1.FeePc, Entity2.FeePc)`
	- `FinalFidelity = max(Entity1.FeeFidelity, Entity2.FeeFidelity)`
	- `FinalTotal = FinalPC + FinalFidelity`

This allows mixed outcomes where PC and Fidelity can come from different entity/date scenarios.

Example:
- Entity 1 result: `PC=550, Fidelity=0`
- Entity 2 result: `PC=275, Fidelity=45`
- Final result: `PC=550, Fidelity=45, Total=595`

If multiple entities is not selected, only the single `Previous -> Entity 1` API result is used.

Rules are stored in Azure Table Storage table **`FeeRulePCVariation`** (16 rows, PartitionKey = `Registry`).

---

## Fee Rules

### PC Fee
| Condition | Fee |
|---|---|
| Previous = **Volunteer** â†’ new â‰  Volunteer, effective date **Julâ€“Dec** | Full PC fee ($550) |
| Previous = **Volunteer** â†’ new â‰  Volunteer, effective date **Janâ€“Jun** | Half PC fee ($275) |
| Previous â‰  Volunteer | $0 |
| New category = **Volunteer** | $0 |

### Fidelity Fund Contribution
| Condition | Fee |
|---|---|
| New = **Principal** or **Employee**, effective date **Julâ€“Dec** | $90 |
| New = **Principal** or **Employee**, effective date **Janâ€“Jun** | $45 |
| New = **Volunteer**, **Government**, or **Corporate** | $0 |

---

## Variation Types & Expected Fees

| Previous Category | New Category | Effective Date | PC Fee | Fidelity | Total |
|---|---|---|---|---|---|
| volunteer | principal | Julâ€“Dec | $550 | $90 | **$640** |
| volunteer | principal | Janâ€“Jun | $275 | $45 | **$320** |
| volunteer | employee | Julâ€“Dec | $550 | $90 | **$640** |
| volunteer | employee | Janâ€“Jun | $275 | $45 | **$320** |
| volunteer | government | Julâ€“Dec | $550 | $0 | **$550** |
| volunteer | government | Janâ€“Jun | $275 | $0 | **$275** |
| volunteer | corporate | Julâ€“Dec | $550 | $0 | **$550** |
| volunteer | corporate | Janâ€“Jun | $275 | $0 | **$275** |
| government | principal | Julâ€“Dec | $0 | $90 | **$90** |
| government | principal | Janâ€“Jun | $0 | $45 | **$45** |
| government | employee | Julâ€“Dec | $0 | $90 | **$90** |
| government | employee | Janâ€“Jun | $0 | $45 | **$45** |
| corporate | principal | Julâ€“Dec | $0 | $90 | **$90** |
| corporate | principal | Janâ€“Jun | $0 | $45 | **$45** |
| corporate | employee | Julâ€“Dec | $0 | $90 | **$90** |
| corporate | employee | Janâ€“Jun | $0 | $45 | **$45** |
| principal/employee | any | Any | $0 | $0 | **$0** |
| any | volunteer | Any (â‰  volâ†’vol) | $0 | $0 | **$0** |
| same â†’ same | â€” | Any | $0 | $0 | **$0** |

---

## Seed Script

```powershell
cd ls-formshub/pipelines/storageAccount
.\seed-fee-rules-pcvariation.ps1 -StorageAccountName "azaestformshubdev"
```

Populates **`FeeRulePCVariation`** table (16 rows):

| RowKey | PrevCategory | NewCategory | Period | PC Fee | Fidelity | Logic |
|---|---|---|---|---|---|---|
| `VolToPrincipal_Jan` | volunteer | principal | 01-01 â€“ 06-30 | $275 | $45 | Half PC + Half Fidelity |
| `VolToPrincipal_Jul` | volunteer | principal | 07-01 â€“ 99-99 | $550 | $90 | Full PC + Full Fidelity |
| `VolToEmployee_Jan` | volunteer | employee | 01-01 â€“ 06-30 | $275 | $45 | Half PC + Half Fidelity |
| `VolToEmployee_Jul` | volunteer | employee | 07-01 â€“ 99-99 | $550 | $90 | Full PC + Full Fidelity |
| `VolToGovernment_Jan` | volunteer | government | 01-01 â€“ 06-30 | $275 | $0 | Half PC Fees |
| `VolToGovernment_Jul` | volunteer | government | 07-01 â€“ 99-99 | $550 | $0 | Full PC Fees |
| `VolToCorporate_Jan` | volunteer | corporate | 01-01 â€“ 06-30 | $275 | $0 | Half PC Fees |
| `VolToCorporate_Jul` | volunteer | corporate | 07-01 â€“ 99-99 | $550 | $0 | Full PC Fees |
| `GovToPrincipal_Jan` | government | principal | 01-01 â€“ 06-30 | $0 | $45 | Half Fidelity |
| `GovToPrincipal_Jul` | government | principal | 07-01 â€“ 99-99 | $0 | $90 | Full Fidelity |
| `GovToEmployee_Jan` | government | employee | 01-01 â€“ 06-30 | $0 | $45 | Half Fidelity |
| `GovToEmployee_Jul` | government | employee | 07-01 â€“ 99-99 | $0 | $90 | Full Fidelity |
| `CorpToPrincipal_Jan` | corporate | principal | 01-01 â€“ 06-30 | $0 | $45 | Half Fidelity |
| `CorpToPrincipal_Jul` | corporate | principal | 07-01 â€“ 99-99 | $0 | $90 | Full Fidelity |
| `CorpToEmployee_Jan` | corporate | employee | 01-01 â€“ 06-30 | $0 | $45 | Half Fidelity |
| `CorpToEmployee_Jul` | corporate | employee | 07-01 â€“ 99-99 | $0 | $90 | Full Fidelity |

All other combinations â†’ **No Fees** (handled in code, no table row needed).

---

## Running Integration Tests

```powershell
# 1. Seed the table (once)
.\cicd\storageAccount\seed-fee-rules-pcvariation.ps1 -StorageAccountName "azaestformshubdev"

# 2. Start the function app
cd ls-formshub/app/az-ae-fa-formshub-functionapp/bin/Debug/net8.0
func host start

# 3. Run tests
dotnet test FeeLogic.Tests --filter Category=ChangeEmploymentDetails
```

---

## Frontend Unit Tests (Multi-Entity Combination)

Multi-entity combination behavior is unit-tested in:

- `web/src/utils/pcVariationFee.test.ts`

Run with:

```powershell
cd ls-formshub/app/web
npm test -- --watchAll=false --runInBand --testPathPattern=pcVariationFee.test.ts
```

---

## Integration Test Cases (23 tests)

| Test | prevCategory | newCategory | Effective Date | Expected PC | Expected Fidelity | Expected Total |
|---|---|---|---|---|---|---|
| `VolToPrincipal_Jul_FullPCFidelity` | volunteer | principal | 2026-07-01 | $550 | $90 | **$640** |
| `VolToEmployee_Jul_FullPCFidelity` | volunteer | employee | 2026-07-15 | $550 | $90 | **$640** |
| `VolToPrincipal_Jan_HalfPCFidelity` | volunteer | principal | 2026-03-01 | $275 | $45 | **$320** |
| `VolToEmployee_Jan_HalfPCFidelity` | volunteer | employee | 2026-01-15 | $275 | $45 | **$320** |
| `VolToGovernment_Jul_FullPCFees` | volunteer | government | 2026-07-01 | $550 | $0 | **$550** |
| `VolToCorporate_Jul_FullPCFees` | volunteer | corporate | 2026-08-01 | $550 | $0 | **$550** |
| `VolToGovernment_Jan_HalfPCFees` | volunteer | government | 2026-03-15 | $275 | $0 | **$275** |
| `VolToCorporate_Jan_HalfPCFees` | volunteer | corporate | 2026-04-01 | $275 | $0 | **$275** |
| `GovCorpToPrincipal_Jul_FullFidelity` | government | principal | 2026-07-01 | $0 | $90 | **$90** |
| `CorpToPrincipal_Jul_FullFidelity` | corporate | principal | 2026-07-15 | $0 | $90 | **$90** |
| `CorporateToEmployee_Jul_FullFidelity` | corporate | employee | 2026-09-01 | $0 | $90 | **$90** |
| `GovToEmployee_Jul_FullFidelity` | government | employee | 2026-08-15 | $0 | $90 | **$90** |
| `GovCorpToPrincipal_Jan_HalfFidelity` | government | principal | 2026-02-01 | $0 | $45 | **$45** |
| `CorpToPrincipal_Jan_HalfFidelity` | corporate | principal | 2026-05-01 | $0 | $45 | **$45** |
| `CorporateToEmployee_Jan_HalfFidelity` | corporate | employee | 2026-06-01 | $0 | $45 | **$45** |
| `GovToEmployee_Jan_HalfFidelity` | government | employee | 2026-03-15 | $0 | $45 | **$45** |
| `PrincipalToGovernment_NoFee` | principal | government | 2026-07-01 | $0 | $0 | **$0** |
| `EmployeeToVolunteer_NoFee` | employee | volunteer | 2026-07-01 | $0 | $0 | **$0** |
| `GovernmentToVolunteer_NoFee` | government | volunteer | 2026-03-01 | $0 | $0 | **$0** |
| `VolToVol_NoFee` | volunteer | volunteer | 2026-07-01 | $0 | $0 | **$0** |
| `MissingPrevCategory_Returns400` | *(omitted)* | principal | 2026-07-01 | â€” | â€” | **400** |
| `MissingNewCategory_Returns400` | volunteer | *(omitted)* | 2026-07-01 | â€” | â€” | **400** |
| `InvalidDate_Returns400` | volunteer | principal | not-a-date | â€” | â€” | **400** |

---

## FeeLogic.Tests Multi-Entity Scenario Coverage

The test file `GetFeeChangeEmploymentDetailsIntegrationTests.cs` now also includes multi-entity scenario tests that mirror the frontend orchestration rule:

1. Call API for `Previous -> Entity 1` using Entity 1 date.
2. Call API for `Previous -> Entity 2` using Entity 2 date.
3. Combine result with:
	- `FinalPC = max(Entity1.FeePc, Entity2.FeePc)`
	- `FinalFidelity = max(Entity1.FeeFidelity, Entity2.FeeFidelity)`
	- `FinalTotal = FinalPC + FinalFidelity`

Added tests:

- `MultiEntity_VolToCorpAug_And_VolToPrincipalFeb_CombinesTo_550Plus45`
- `MultiEntity_VolToPrincipalAug_And_VolToCorpFeb_CombinesTo_550Plus90`
- `MultiEntity_VolToVolAug_And_VolToPrincipalFeb_CombinesTo_275Plus45`
- `MultiEntity_PrincipalToVolAug_And_PrincipalToCorpFeb_NoFee`
- `MultiEntity_CorpToPrincipalFeb_And_CorpToVolAug_CombinesTo_45`

These tests are in the same category filter (`Category=ChangeEmploymentDetails`).

