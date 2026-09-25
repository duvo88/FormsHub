using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace FeeLogic.Tests;

/// <summary>
/// Integration tests for the GetFee Azure Function - formType = "australian-registration-certificate-renew".
///
/// HOW TO USE
/// 1. Seed the FeeRulePCRenew table:
///      .\cicd\storageAccount\seed-fee-rules-pcrenew.ps1 -StorageAccountName "azaestformshubdev"
/// 2. Start the function app (F5 or "func host start" in bin/Debug/net8.0).
/// 3. Run:  dotnet test FeeLogic.Tests --filter Category=ARCRenew
///
/// BASE URL: defaults to http://localhost:7071
/// Override: $env:GETFEE_BASE_URL = "http://localhost:7072"
///
/// NOTE: The ARCRenew effective date is always hardcoded to 1 July (01/07) in the frontend.
/// Only one row per registry type/country exists in the table — no period ranges.
/// </summary>
public class GetFeeARCRenewIntegrationTests : IAsyncLifetime
{
    private static readonly string BaseUrl =
        Environment.GetEnvironmentVariable("GETFEE_BASE_URL") ?? "http://localhost:7071";

    private static readonly HttpClient Http;

    static GetFeeARCRenewIntegrationTests()
    {
        Http = new HttpClient { BaseAddress = new Uri(BaseUrl) };
        var token = Environment.GetEnvironmentVariable("GETFEE_AUTH_TOKEN");
        if (!string.IsNullOrEmpty(token))
            Http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    private bool _running;

    public async Task InitializeAsync()
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await Http.GetAsync("/api/GetFee", cts.Token);
            _running = true;
        }
        catch { _running = false; }
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private void GuardRunning()
    {
        if (!_running)
            throw new InvalidOperationException(
                $"[SKIPPED] Function app not running at {BaseUrl}. " +
                "Start it locally then re-run: dotnet test FeeLogic.Tests --filter Category=ARCRenew");
    }

    private async Task<GetFeeApiResponse?> Post(
        string effectiveDate, string formOfPractice, string country, string am)
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "australian-registration-certificate-renew",
            effectiveDate,
            formOfPractice,
            practiceCountry = country,
            AM = am
        });
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<GetFeeApiResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    // =========================================================================
    // FOREIGN LAWYER PRINCIPAL / EMPLOYEE — AUSTRALIA (Jul-Dec, primary path)
    // =========================================================================

    [Fact(DisplayName = "[ARCRenew] partnership / AU / AM=Yes / Jul → $550+$90+$330=$970")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_AU_AMYes_JulEffective_FullFees()
    {
        var r = await Post("2026-07-01", "partnership", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(970, r.FeeAmount);
        Assert.Contains("incl. GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCRenew] partnership / AU / AM=No / Jul → $550+$90+$0=$640")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_AU_AMNo_JulEffective_SmZero()
    {
        var r = await Post("2026-07-01", "partnership", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(0,   r.FeeSm);
        Assert.Equal(640, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCRenew] incorporated / AU / AM=Yes / Jul → same as partnership $970")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_Incorporated_AU_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "incorporated", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(970, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCRenew] employee / AU / AM=Yes / Jul → $550+$90+$330=$970")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_Employee_AU_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "employee", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(970, r.FeeAmount);
    }

    // =========================================================================
    // FOREIGN LAWYER PRINCIPAL / EMPLOYEE — OUTSIDE AUSTRALIA (Jul-Dec)
    // =========================================================================

    [Fact(DisplayName = "[ARCRenew] partnership / OA / AM=Yes / Jul → $550+$90+$300=$940 No GST")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_OA_AMYes_JulEffective_FullFees()
    {
        var r = await Post("2026-07-01", "partnership", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(940, r.FeeAmount);
        Assert.Contains("No GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCRenew] partnership / OA / AM=No / Jul → $550+$90+$0=$640")]
    [Trait("Category", "ARCRenew")]
    public async Task FLPE_OA_AMNo_JulEffective_SmZero()
    {
        var r = await Post("2026-07-01", "partnership", "Outside Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(0,   r.FeeSm);
        Assert.Equal(640, r.FeeAmount);
    }

    // =========================================================================
    // VOLUNTEER — $0 PC, $0 Fidelity
    // =========================================================================

    [Fact(DisplayName = "[ARCRenew] volunteer_probono / AU / AM=Yes / Jul → $0+$0+$330=$330")]
    [Trait("Category", "ARCRenew")]
    public async Task FLVOL_AU_AMYes_JulEffective_NoPcFee()
    {
        var r = await Post("2026-07-01", "volunteer_probono", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(330, r.FeeAmount);
        Assert.Contains("incl. GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCRenew] volunteer_probono / AU / AM=No / Jul → $0 total")]
    [Trait("Category", "ARCRenew")]
    public async Task FLVOL_AU_AMNo_JulEffective_ZeroTotal()
    {
        var r = await Post("2026-07-01", "volunteer_probono", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(0, r.FeeSm);
        Assert.Equal(0, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCRenew] volunteer_probono / OA / AM=Yes / Jul → $0+$0+$300=$300 No GST")]
    [Trait("Category", "ARCRenew")]
    public async Task FLVOL_OA_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "volunteer_probono", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(300, r.FeeAmount);
        Assert.Contains("No GST", r.Logic);
    }

    // =========================================================================
    // OTHER (sole, employeeARFL, other) — $0 Fidelity
    // =========================================================================

    [Fact(DisplayName = "[ARCRenew] sole / AU / AM=Yes / Jul → $550+$0+$330=$880")]
    [Trait("Category", "ARCRenew")]
    public async Task FLOther_Sole_AU_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "sole", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(880, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCRenew] employeeARFL / AU / AM=Yes / Jul → $550+$0+$330=$880")]
    [Trait("Category", "ARCRenew")]
    public async Task FLOther_EmployeeARFL_AU_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "employeeARFL", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(880, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCRenew] employeeARFL / OA / AM=Yes / Jul → $550+$0+$300=$850 No GST")]
    [Trait("Category", "ARCRenew")]
    public async Task FLOther_EmployeeARFL_OA_AMYes_JulEffective()
    {
        var r = await Post("2026-07-01", "employeeARFL", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(850, r.FeeAmount);
        Assert.Contains("No GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCRenew] other / AU / AM=No / Jul → $550+$0+$0=$550")]
    [Trait("Category", "ARCRenew")]
    public async Task FLOther_Other_AU_AMNo_JulEffective()
    {
        var r = await Post("2026-07-01", "other", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(0,   r.FeeSm);
        Assert.Equal(550, r.FeeAmount);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    [Fact(DisplayName = "[ARCRenew] Missing formOfPractice → 400")]
    [Trait("Category", "ARCRenew")]
    public async Task MissingFormOfPractice_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType        = "australian-registration-certificate-renew",
            effectiveDate   = "2026-07-01",
            practiceCountry = "Australia",
            AM              = "yes"
            // formOfPractice omitted
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "[ARCRenew] Invalid date → 400")]
    [Trait("Category", "ARCRenew")]
    public async Task InvalidDate_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType        = "australian-registration-certificate-renew",
            effectiveDate   = "not-a-date",
            formOfPractice  = "partnership",
            practiceCountry = "Australia",
            AM              = "yes"
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
