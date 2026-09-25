# PC New ï¿½ Fee Logic Integration Tests

Tests the unified `POST /api/GetFee` endpoint with `formType = "practising-certificate-new"`.  
All expected fee amounts are based on `seed-fee-rules-pcnew.ps1`.

---

## How to Run

### Prerequisites
1. Seed the `FeeRulePCNew` table:
   ```powershell
   .\cicd\storageAccount\seed-fee-rules-pcnew.ps1 -StorageAccountName "azaestformshubdev"
   ```
2. Start the function app (press **F5** in VS Code, or run from a terminal):
   ```
   cd ls-formshub/app/az-ae-fa-formshub-functionapp/bin/Debug/net8.0
   func host start
   ```

### Commands

```powershell
cd ls-formshub/app

# Run PC New tests only
dotnet test FeeLogic.Tests --filter Category=Integration

# Run ALL fee integration tests
dotnet test FeeLogic.Tests

# Override the base URL (default: http://localhost:7071)
$env:GETFEE_BASE_URL = "http://localhost:7072"
dotnet test FeeLogic.Tests --filter Category=Integration
```

> If the function app is **not** running, every test throws a clear `[SKIPPED]` message.

---

## Endpoint

**`POST /api/GetFee`** with `formType = "practising-certificate-new"`.

```json
{
  "formType": "practising-certificate-new",
  "dateOfAdmission": "2010-03-15",
  "effectiveDate": "2025-07-01",
  "practiceCountry": "Australia",
  "registryType": "Principal/Employee",
  "SM": "yes"
}
```

| Field | Required | Notes |
|---|---|---|
| `formType` | ? | Must be `"practising-certificate-new"` |
| `dateOfAdmission` | ? | ISO 8601. Used to detect if DOA falls in the current PC year. |
| `effectiveDate` | ? | ISO 8601. Determines full (Julï¿½Dec) vs half (Janï¿½Jun) fees. |
| `practiceCountry` | ? | `"Australia"` ? AU amounts; anything else ? Outside Australia amounts. |
| `registryType` | ? | See table below. |
| `SM` | ? | `"yes"` ? include SM fee; anything else ? SM = $0. |

---

## Fee Calculation Rules

| Rule | Detail |
|---|---|
| **PC Year** | 1 Jul (Y) ? 30 Jun (Y+1). e.g. 2025/2026 |
| **Full fees** | Effective date Julï¿½Dec ? FeePc & FeeFidelity at full amount |
| **Half fees** | Effective date Janï¿½Jun ? FeePc & FeeFidelity halved |
| **SM = No** | FeeSm = $0 always |
| **DOA in PC year** | DOA between 1 Dec (Y) and 30 Jun (Y+1) ? FeeSm = $0 (new admittee) |
| **DOA NOT in PC year + Julï¿½Dec** | FeeSm = full |
| **DOA NOT in PC year + Janï¿½Jun** | FeeSm = half |

---

## Test Cases (`GetFeePCNewIntegrationTests.cs`)

> **Total column** shows `feeAmount` only when the test explicitly asserts it. `â€”` means the test does not assert `FeeAmount` for that row (it still checks the individual fee components).  
> **Formula:** Total = FeePc + FeeFidelity + FeeSm

### Principal / Employee ï¿½ Australia

| # | DOA | Effective Date | SM | DOA in PC Year? | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-----------------|-------|-------------|-------|-------|
| 1 | 2010-03-15 | 2025-07-01 | yes | No  | $550 | $90 | $440 | $1,080 |
| 2 | 2010-03-15 | 2026-01-15 | yes | No  | $275 | $45 | $220 | $540 |
| 3 | 2010-03-15 | 2025-07-01 | No  | No  | $550 | $90 | $0   | $640 |
| 4 | 2026-03-01 | 2026-03-15 | yes | Yes | **$275** | **$45** | **$0** | **$320** |

### Principal / Employee ï¿½ Outside Australia

| # | DOA | Effective Date | SM | DOA in PC Year? | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-----------------|-------|-------------|-------|-------|
| 6 | 2010-03-15 | 2025-07-01 | yes | No | $550 | $90 | $400 | $1,040 |
| 7 | 2010-03-15 | 2026-04-01 | yes | No | **$275** | **$45** | **$200** | **$520** |
| 8 | 2010-03-15 | 2026-04-01 | No  | No | **$275** | **$45** | **$0**   | **$320** |

### Gov / Corporate ï¿½ Australia

| # | DOA | Effective Date | SM | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-------|-------------|-------|-------|
| 9  | 2010-03-15 | 2025-09-01 | yes | $550 | $0 | $440 | $990 |
| 10 | 2010-03-15 | 2026-02-01 | yes | $275 | $0 | $220 | $495 |

### Gov / Corporate ï¿½ Outside Australia

| # | DOA | Effective Date | SM | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-------|-------------|-------|-------|
| 11 | 2010-03-15 | 2025-11-01 | yes | **$550** | **$0** | **$400** | **$950** |

### Not Currently Practising ï¿½ Australia

| # | DOA | Effective Date | SM | DOA in PC Year? | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-----------------|-------|-------------|-------|-------|
| 12 | 2010-03-15 | 2025-07-15 | yes | No  | $550 | $0 | $440 | $990 |
| 13 | 2010-03-15 | 2026-06-01 | yes | No  | $275 | $0 | $220 | $495 |
| 14 | 2026-05-01 | 2026-05-20 | yes | Yes | **$275** | **$0** | **$0** | **$275** |

> NCP has no Fidelity Fund component â€” `FeeFidelity` is always $0. Total = FeePc + FeeSm.

> **Note on DOA-in-PC-year (rows 4, 14):** When DOA falls in the current PC year, FeeSm=$0. Total = FeePc + FeeFidelity only.

### Not Currently Practising â€” Outside Australia

| # | DOA | Effective Date | SM | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-------|-------------|-------|-------|
| 15 | 2010-03-15 | 2025-10-01 | No | **$550** | **$0** | **$0** | **$550** |

### Volunteer ï¿½ Australia

| # | DOA | Effective Date | SM | FeePc | FeeFidelity | FeeSm | Total |
|---|-----|---------------|----|-------|-------------|-------|-------|
| 16 | 2010-03-15 | 2025-08-01 | yes | **$0** | **$0** | **$440** | **$440** |
| 17 | 2010-03-15 | 2026-03-01 | yes | **$0** | **$0** | **$220** | **$220** |

> Volunteer has no PC fee and no Fidelity Fund â€” only SM applies.

### Multiple PC Years ï¿½ Principal/Employee / Australia

| # | DOA | Effective Date | PC Year | SM | Expected Total |
|---|-----|---------------|---------|-----|----------------|
| 18 | 2000-01-01 | 2025-07-01 | 2025/2026 | yes | $1,080 |
| 19 | 2000-01-01 | 2026-07-01 | 2026/2027 | yes | $1,080 |
| 20 | 2000-01-01 | 2030-07-01 | 2030/2031 | yes | $1,080 |
| 21 | 2000-01-01 | 2026-01-15 | 2025/2026 | yes | $540 |
| 22 | 2000-01-01 | 2027-03-01 | 2026/2027 | yes | $540 |
| 23 | 2000-01-01 | 2031-06-30 | 2030/2031 | yes | $540 |

### Error Cases

| # | Scenario | Expected HTTP |
|---|----------|---------------|
| 24 | Unknown `registryType` (`UnknownType`) | 404 Not Found |
| 25 | Missing required fields (only `formType` + `dateOfAdmission` sent) | 400 Bad Request |

> **"ï¿½"** in Total means the test does not assert `FeeAmount`.

---

## Multi-Entity Fee Logic (Frontend Implementation)

When a user selects **"Do you intend to practise with more than one entity? Yes"**, the fee calculation follows a **hybrid approach**:

- **Backend API**: Calculates fees for single category transitions (Section 4 practiceType and Section 6 otherPlaceType independently)
- **Frontend**: Makes 2 API calls and applies scenario-based business logic to determine final fees

### Practice Type Categories

Both Section 4 (principal place of practice) and Section 6 (other place of practice) types are categorized into 3 groups:

| Category | Practice Types |
|----------|---------------|
| **Principal/Employee** | Principal, Employee |
| **Gov/Cor** | Corporate, Government |
| **Volunteer** | Volunteer |

### Fee Scenarios

The fee charged depends on the **highest fee hierarchy** between Section 4 and Section 6 practice types:

#### **Scenario 1: Section 4 is Principal/Employee**
- **Section 4**: PC fee + Fidelity Fee charged
- **Section 6**: No additional fees (fees already charged above)
- **Result**: `finalPc = section4.feePc`, `finalFidelity = section4.feeFidelity`

#### **Scenario 2: Section 4 is Gov/Cor**
- **Section 4**: PC fee only charged
- **Section 6**:
  - If **Principal/Employee**: Add Fidelity Fee (not charged above)
  - If **Gov/Cor** or **Volunteer**: No change
- **Result**: 
  - `finalPc = section4.feePc`
  - `finalFidelity = section6.feeFidelity` (if Section 6 is Principal/Employee, else 0)

#### **Scenario 3: Section 4 is Volunteer**
- **Section 4**: No fees charged
- **Section 6**:
  - If **Principal/Employee**: Add PC fee + Fidelity fee
  - If **Gov/Cor**: Add PC fee only
  - If **Volunteer**: No change
- **Result**:
  - If Section 6 is Principal/Employee: `finalPc = section6.feePc`, `finalFidelity = section6.feeFidelity`
  - If Section 6 is Gov/Cor: `finalPc = section6.feePc`, `finalFidelity = 0`
  - If Section 6 is Volunteer: `finalPc = 0`, `finalFidelity = 0`

### Implementation Location

- **File**: `ls-formshub/app/web/src/PCNewForm.tsx`
- **Lines**: ~220-340 (useEffect hook for multi-entity fee calculation)
- **Fee Display**: Lines ~1830-1890 (fee table uses `multiEntityFeeData` when applicable)
- **Payment**: Lines ~880-892 (Stripe line items use `multiEntityFeeData` when applicable)

### Example Scenarios

| Section 4 | Section 6 | PC Fee | Fidelity Fee | Explanation |
|-----------|-----------|--------|--------------|-------------|
| Principal | Employee | $550 | $90 | Scenario 1: Highest fees already charged in Section 4 |
| Employee | Corporate | $550 | $90 | Scenario 1: Highest fees already charged in Section 4 |
| Corporate | Principal | $550 | $90 | Scenario 2: PC from Section 4, Fidelity from Section 6 |
| Government | Volunteer | $550 | $0 | Scenario 2: PC from Section 4, no Fidelity needed |
| Volunteer | Employee | $550 | $90 | Scenario 3: Both fees from Section 6 |
| Volunteer | Corporate | $550 | $0 | Scenario 3: PC from Section 6, no Fidelity |
| Volunteer | Volunteer | $0 | $0 | Scenario 3: No fees charged |

*(Amounts shown are for July-December full fee period with Australia practice country)*

---

## Updating Tests After Fee Changes

1. Edit `seed-fee-rules-pcnew.ps1` and re-run against `azaestformshubdev`.
2. Update the `Assert.Equal(...)` expected values in `GetFeePCNewIntegrationTests.cs`.

