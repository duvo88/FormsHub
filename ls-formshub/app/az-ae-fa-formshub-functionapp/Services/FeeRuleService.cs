using api;
using Azure;
using Azure.Data.Tables;
using Azure.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace FormsHub.FeeLogic
{
    public class FeeRuleEntity : ITableEntity
    {
        public string PartitionKey { get; set; } = "Registry";
        public string? RowKey { get; set; } // Unique ID (e.g., Guid or composite key)
        public string? RegistryType { get; set; }
        public string AdmissionStartMMDD { get; set; } = string.Empty;
        public string AdmissionEndMMDD { get; set; } = string.Empty;
        public string EffectivePeriodStartMMDD { get; set; } = string.Empty;
        public string EffectivePeriodEndMMDD { get; set; } = string.Empty;
        public string? PracticeCountry { get; set; }
        public double FeePc { get; set; }
        public double FeeFidelity { get; set; }
        public double FeeSm { get; set; }
        public string? Logic { get; set; }

        // New columns for PC year start/end MMDD
        public string PCYearStartMMDD { get; set; } = string.Empty;
        public string PCYearEndMMDD { get; set; } = string.Empty;

        // PCVariation — exact category columns (volunteer|principal|employee|government|corporate)
        public string? PrevCategory { get; set; }
        public string? NewCategory  { get; set; }

        public ETag ETag { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
    }

    public class FeeRuleService
    {
        protected readonly TableClient _tableClient;

        public FeeRuleService(string tableServiceUri, string tableName)
        {
            var credential = new DefaultAzureCredential();
            _tableClient = new TableClient(new Uri(tableServiceUri), tableName, credential);
        }

        public async Task<FeeRuleEntity?> GetFeeRuleAsync(
            DateTime dateOfAdmission,
            DateTime effectiveDate,
            string practiceCountry,
            string registryType, string lawSoceityMember,ILogger _logger)
        {
            // --- Calculate PC Year Range ---
            // PC year is calculated based on effective date.
            // First half  (Jan-Jun): 1 July (effectiveYear-1) to 30 June (effectiveYear)
            // Second half (Jul-Dec): 1 July (effectiveYear)   to 30 June (effectiveYear+1)
            int year = effectiveDate.Year;
            int pcYearStart, pcYearEnd;

            if (effectiveDate.Month < 7) // Jan-Jun: first half
            {
                pcYearStart = year - 1;
                pcYearEnd   = year;
            }
            else // Jul-Dec: second half
            {
                pcYearStart = year;
                pcYearEnd   = year + 1;
            }
            _logger.LogInformation($"PC Year Range: {pcYearStart} to {pcYearEnd}");

            // Query for matching rules — filter by registry type and country only.
            // Effective date period matching is done in code below (year is dynamic).
            var query = _tableClient.QueryAsync<FeeRuleEntity>(rule =>
                rule.RegistryType == registryType &&
                rule.PracticeCountry == practiceCountry
            );

            try
            {
                var allRows = new List<FeeRuleEntity>();
                await foreach (var rule in query)
                {
                    allRows.Add(rule);
                }
                _logger.LogInformation($"Total rules returned for [{registryType} | {practiceCountry}]: {allRows.Count}");

                // For each row returned, check which one matches the effective date window.
                // There should be exactly one matching row at the end.
                foreach (var rule in allRows)
                {
                    if (string.IsNullOrWhiteSpace(rule.EffectivePeriodStartMMDD) ||
                        string.IsNullOrWhiteSpace(rule.EffectivePeriodEndMMDD))
                        continue;

                    // ── Build PC Year start/end dates ──────────────────────────────────
                    string pcYearStartMMDD = string.IsNullOrWhiteSpace(rule.PCYearStartMMDD)
                        ? "0701" : rule.PCYearStartMMDD.Replace("-", "");
                    string pcYearEndMMDD = string.IsNullOrWhiteSpace(rule.PCYearEndMMDD)
                        ? "0630" : rule.PCYearEndMMDD.Replace("-", "");

                    DateTime pcStart, pcEnd;
                    try
                    {
                        int pcStartMonth = int.Parse(pcYearStartMMDD.Substring(0, 2));
                        int pcStartDay   = int.Parse(pcYearStartMMDD.Substring(2, 2));
                        pcStart = new DateTime(pcYearStart, pcStartMonth, pcStartDay); // e.g. 1 Jul 2025

                        int pcEndMonth = int.Parse(pcYearEndMMDD.Substring(0, 2));
                        int pcEndDay   = int.Parse(pcYearEndMMDD.Substring(2, 2));
                        pcEnd = new DateTime(pcYearEnd, pcEndMonth, pcEndDay);         // e.g. 30 Jun 2026

                        _logger.LogInformation($"PC Year window: {pcStart:yyyy-MM-dd} to {pcEnd:yyyy-MM-dd}");
                    }
                    catch
                    {
                        _logger.LogWarning($"Could not parse PCYearMMDD for rule {rule.RowKey}: " +
                            $"start='{rule.PCYearStartMMDD}', end='{rule.PCYearEndMMDD}'");
                        continue;
                    }

                    // ── Build Effective Period start/end dates ─────────────────────────
                    // 99-99 in EffectivePeriodEndMMDD means "no upper bound" (Jul-Dec bucket)
                    string effEndMMDD   = rule.EffectivePeriodEndMMDD.Replace("-", "");
                    string effStartMMDD = rule.EffectivePeriodStartMMDD.Replace("-", "");
                    bool   noEndLimit   = effEndMMDD == "9999";

                    DateTime effStart;
                    DateTime effEnd = DateTime.MinValue; // dummy — only used when !noEndLimit
                    try
                    {
                        int effStartMonth = int.Parse(effStartMMDD.Substring(0, 2));
                        int effStartDay   = int.Parse(effStartMMDD.Substring(2, 2));

                        // Jul-Dec bucket uses pcYearStart year; Jan-Jun uses pcYearEnd year
                        effStart = effStartMonth >= 7
                            ? new DateTime(pcYearStart, effStartMonth, effStartDay)
                            : new DateTime(pcYearEnd,   effStartMonth, effStartDay);

                       if (!noEndLimit)
            {
                int effEndMonth = int.Parse(effEndMMDD.Substring(0, 2));
                int effEndDay   = int.Parse(effEndMMDD.Substring(2, 2));

                // Fix: check effEndMonth independently, not effStartMonth
                effEnd = effEndMonth < 7
                    ? new DateTime(pcYearEnd,   effEndMonth, effEndDay)   // Jun → pcYearEnd ✅
                    : new DateTime(pcYearStart, effEndMonth, effEndDay);  // Dec → pcYearStart ✅
            }
                    }
                    catch
                    {
                        _logger.LogWarning($"Could not parse EffectivePeriodMMDD for rule {rule.RowKey}: " +
                            $"start='{rule.EffectivePeriodStartMMDD}', end='{rule.EffectivePeriodEndMMDD}'");
                        continue;
                    }

                    // ── Check if effective date falls in this rule's window ────────────
                    bool effectiveDateMatches = noEndLimit
                        ? effectiveDate >= effStart
                        : effectiveDate >= effStart && effectiveDate <= effEnd;

                    if (!effectiveDateMatches)
                        continue;

                    _logger.LogInformation($"Rule {rule.RowKey} matched effective date {effectiveDate:yyyy-MM-dd} " +
                        $"in window {effStart:yyyy-MM-dd} to {(noEndLimit ? "open" : effEnd.ToString("yyyy-MM-dd"))}");

                    // ── Validate admission date fields exist ───────────────────────────
                    if (string.IsNullOrWhiteSpace(rule.AdmissionStartMMDD) ||
                        string.IsNullOrWhiteSpace(rule.AdmissionEndMMDD))
                    {
                        _logger.LogWarning($"Rule {rule.RowKey} has empty AdmissionStartMMDD or AdmissionEndMMDD.");
                        throw new Exception($"Rule {rule.RowKey} missing AdmissionStartMMDD/AdmissionEndMMDD. " +
                            "Cannot evaluate DateOfAdmission criteria.");
                    }

                    // ── Build admission window dates (combine table MMDD + code year) ──
                    string startMMDD = rule.AdmissionStartMMDD.Replace("-", "");
                    string endMMDD   = rule.AdmissionEndMMDD.Replace("-", "");

                    DateTime admissionStart, admissionEnd;
                    try
                    {
                        admissionStart = DateTime.ParseExact($"{pcYearStart}{startMMDD}", "yyyyMMdd", null);
                        admissionEnd   = DateTime.ParseExact($"{pcYearEnd}{endMMDD}",     "yyyyMMdd", null);

                        _logger.LogInformation($"Admission window: {admissionStart:yyyy-MM-dd} to {admissionEnd:yyyy-MM-dd}");
                    }
                    catch
                    {
                        _logger.LogWarning($"Could not parse AdmissionMMDD for rule {rule.RowKey}: " +
                            $"start='{rule.AdmissionStartMMDD}', end='{rule.AdmissionEndMMDD}'");
                        continue;
                    }

                    // ── SM Fee logic ───────────────────────────────────────────────────
                    // $0  if member said No to Law Society membership
                    // $0  if DOA falls within current PC year admission window (new admittee)
                    // Half if effective date is Jan-Jun AND DOA is NOT in current PC year
                    // Full otherwise (Jul-Dec and DOA not in current PC year)
                    bool doaInRange = dateOfAdmission >= admissionStart && dateOfAdmission <= admissionEnd;
                    bool smNo       = string.Equals(lawSoceityMember, "No", StringComparison.OrdinalIgnoreCase);

                    if (smNo || doaInRange)
                    {
                        rule.FeeSm = 0;
                        _logger.LogInformation($"FeeSm = $0 for rule {rule.RowKey}: smNo={smNo}, doaInRange={doaInRange}");
                    }
                    else if (effectiveDate.Month <= 6) // Jan-Jun: half SM fee
                    {
                        rule.FeeSm = rule.FeeSm / 2;
                        _logger.LogInformation($"FeeSm halved for rule {rule.RowKey}: " +
                            $"effective date {effectiveDate:yyyy-MM-dd} is Jan-Jun, DOA not in PC year");
                    }
                    else
                    {
                        _logger.LogInformation($"FeeSm full for rule {rule.RowKey}: " +
                            $"effective date {effectiveDate:yyyy-MM-dd} is Jul-Dec, DOA not in PC year");
                    }      

                    return rule;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error querying fee rules from Table Storage");
                throw;
            }

            return null;
        }

        /// <summary>
        /// Simplified fee rule lookup — no Date of Admission logic.
        /// Used for PC Original (Foreign Lawyer) where fees are purely based on
        /// effective date period, practice country, and registry type.
        /// FeeSm is zeroed when associateMember = "No".
        /// </summary>
        public async Task<FeeRuleEntity?> GetFeeRuleSimpleAsync(
            DateTime effectiveDate,
            string practiceCountry,
            string registryType,
            string associateMember,
            ILogger logger)
        {
            // No PC Year or DOA logic for PC Original — match purely on effective date month/day.
            // Jul-Dec  → EffectivePeriodStartMMDD="07-01", EndMMDD="99-99"
            // Jan-Jun  → EffectivePeriodStartMMDD="01-01", EndMMDD="06-30"
            int effMMDD = effectiveDate.Month * 100 + effectiveDate.Day;

            logger.LogInformation(
                "GetFeeRuleSimple: registryType={RegistryType}, country={Country}, effective={Effective}, AM={AM}",
                registryType, practiceCountry, effectiveDate, associateMember);

            var query = _tableClient.QueryAsync<FeeRuleEntity>(rule =>
                rule.RegistryType == registryType &&
                rule.PracticeCountry == practiceCountry
            );

            try
            {
                var allRows = new List<FeeRuleEntity>();
                await foreach (var rule in query) allRows.Add(rule);
                logger.LogInformation($"Rules found for [{registryType} | {practiceCountry}]: {allRows.Count}");

                foreach (var rule in allRows)
                {
                    if (string.IsNullOrWhiteSpace(rule.EffectivePeriodStartMMDD) ||
                        string.IsNullOrWhiteSpace(rule.EffectivePeriodEndMMDD))
                        continue;

                    string effStartMMDD = rule.EffectivePeriodStartMMDD.Replace("-", "");
                    string effEndMMDD   = rule.EffectivePeriodEndMMDD.Replace("-", "");
                    bool   noEndLimit   = effEndMMDD == "9999";

                    int ruleStart = int.Parse(effStartMMDD);
                    bool effectiveDateMatches = noEndLimit
                        ? effMMDD >= ruleStart
                        : effMMDD >= ruleStart && effMMDD <= int.Parse(effEndMMDD);

                    if (!effectiveDateMatches) continue;

                    logger.LogInformation($"Rule {rule.RowKey} matched effective date {effectiveDate:yyyy-MM-dd}");

                    // Zero out AM fee if user chose not to be an associate member
                    bool amNo = string.Equals(associateMember, "No", StringComparison.OrdinalIgnoreCase);
                    if (amNo)
                    {
                        rule.FeeSm = 0;
                        logger.LogInformation($"FeeSm = $0 for rule {rule.RowKey}: AM=No");
                    }

                    return rule;
                }
            }
            catch (Exception e)
            {
                logger.LogError(e, "Error querying fee rules from Table Storage (simple)");
                throw;
            }

            return null;
        }

        /// <summary>
        /// Direct lookup by PartitionKey="Registry" and RowKey.
        /// Used by PCVariationFeeCalculator where the row key encodes the full variation scenario.
        /// </summary>
        public async Task<FeeRuleEntity?> GetFeeRuleByRowKeyAsync(string rowKey, ILogger logger)
        {
            try
            {
                var response = await _tableClient.GetEntityAsync<FeeRuleEntity>("Registry", rowKey);
                logger.LogInformation("GetFeeRuleByRowKey: found rowKey={RowKey}", rowKey);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                logger.LogWarning("GetFeeRuleByRowKey: no entity for rowKey={RowKey}", rowKey);
                return null;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetFeeRuleByRowKey: error for rowKey={RowKey}", rowKey);
                throw;
            }
        }
    }

    /// <summary>Typed subclass so DI can distinguish the PCOriginal table from the PCNew table.</summary>
    public class FeeRuleServiceARCNew : FeeRuleService
    {
        public FeeRuleServiceARCNew(string tableServiceUri, string tableName)
            : base(tableServiceUri, tableName) { }
    }

    /// <summary>Typed subclass for the PCRenew fee table (FeeRulePCRenew).</summary>
    public class FeeRuleServiceARCRenew : FeeRuleService
    {
        public FeeRuleServiceARCRenew(string tableServiceUri, string tableName)
            : base(tableServiceUri, tableName) { }
    }

    /// <summary>Typed subclass for the PCVariation fee table (FeeRulePCVariation).</summary>
    public class FeeRuleServiceChangeEmploymentDetails : FeeRuleService
    {
        public FeeRuleServiceChangeEmploymentDetails(string tableServiceUri, string tableName)
            : base(tableServiceUri, tableName) { }

        /// <summary>
        /// Query by exact PrevCategory + NewCategory, then filter by EffectivePeriodStartMMDD/EndMMDD.
        /// Returns null when no row matches (caller treats this as No Fee).
        /// </summary>
        public async Task<FeeRuleEntity?> GetFeeRuleChangeEmploymentDetailsAsync(
            DateTime effectiveDate,
            string prevCategory,
            string newCategory,
            ILogger logger)
        {
            // Determine the lookup MMDD and financial year information based on the effective date.
            var (isPreviousFinancialYear, currentFinancialYearStart, lookupMMDD) =
                ResolveLookupMMDDForPcVariation(effectiveDate);

            logger.LogInformation(
                "GetFeeRulePCVariation: prev={Prev}, new={New}, effective={Effective}, lookupMMDD={LookupMMDD}, currentFYStart={CurrentFYStart}, isPreviousFY={IsPreviousFY}",
                prevCategory, newCategory, effectiveDate, lookupMMDD, currentFinancialYearStart, isPreviousFinancialYear);

            var query = _tableClient.QueryAsync<FeeRuleEntity>(rule =>
                rule.PrevCategory == prevCategory &&
                rule.NewCategory  == newCategory);

            try
            {
                await foreach (var rule in query)
                {
                    if (string.IsNullOrWhiteSpace(rule.EffectivePeriodStartMMDD) ||
                        string.IsNullOrWhiteSpace(rule.EffectivePeriodEndMMDD))
                        continue;

                    string effStartMMDD = rule.EffectivePeriodStartMMDD.Replace("-", "");
                    string effEndMMDD   = rule.EffectivePeriodEndMMDD.Replace("-", "");
                    bool   noEndLimit   = effEndMMDD == "9999";

                    int ruleStart = int.Parse(effStartMMDD);
                    bool matches = noEndLimit
                        ? lookupMMDD >= ruleStart
                        : lookupMMDD >= ruleStart && lookupMMDD <= int.Parse(effEndMMDD);

                    if (!matches) continue;

                    logger.LogInformation(
                        "GetFeeRulePCVariation: matched rowKey={RowKey} for lookupMMDD={LookupMMDD}",
                        rule.RowKey, lookupMMDD);
                    return rule;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetFeeRulePCVariation: error querying table");
                throw;
            }

            logger.LogInformation(
                "GetFeeRulePCVariation: no row matched prev={Prev}, new={New}, lookupMMDD={LookupMMDD}",
                prevCategory, newCategory, lookupMMDD);
            return null;
        }

        private static (bool IsPreviousFinancialYear, DateTime CurrentFinancialYearStart, int LookupMMDD)
            ResolveLookupMMDDForPcVariation(DateTime effectiveDate)
        {
            int effMMDD = effectiveDate.Month * 100 + effectiveDate.Day;

            var today = DateTime.Today;
            int currentFinancialYearStartYear = today.Month >= 7 ? today.Year : today.Year - 1;
            var currentFinancialYearStart = new DateTime(currentFinancialYearStartYear, 7, 1);
            bool isPreviousFinancialYear = effectiveDate.Date < currentFinancialYearStart.Date;

            // Use Jul-Dec bucket for previous financial year, otherwise use actual effective date MMDD.
            int fullFeeStartMMDD = currentFinancialYearStart.Month * 100 + currentFinancialYearStart.Day;
            int lookupMMDD = isPreviousFinancialYear ? fullFeeStartMMDD : effMMDD;

            return (isPreviousFinancialYear, currentFinancialYearStart, lookupMMDD);
        }
    }
}
