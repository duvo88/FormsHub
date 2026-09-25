using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace FeeLogic.Tests;

/// <summary>
/// Integration tests for the GetFeeARCNew Azure Function.
///
/// HOW TO USE
/// 1. Seed the FeeRulePCOriginal table:
///      .\cicd\storageAccount\seed-fee-rules-pcoriginal.ps1 -StorageAccountName "azaestformshubdev"
/// 2. Start the function app (F5 or "func host start" in bin/Debug/net8.0).
/// 3. Run:  dotnet test FeeLogic.Tests --filter Category=ARCNew
///
/// BASE URL: defaults to http://localhost:7071
/// Override: $env:GETFEE_BASE_URL = "http://localhost:7072"
/// </summary>
public class GetFeeARCNewIntegrationTests : IAsyncLifetime
{
    private static readonly string BaseUrl =
        Environment.GetEnvironmentVariable("GETFEE_BASE_URL") ?? "http://localhost:7071";

    private static readonly HttpClient Http;

    static GetFeeARCNewIntegrationTests()
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
                "Start it locally then re-run: dotnet test FeeLogic.Tests --filter Category=ARCNew");
    }

    private async Task<GetFeeApiResponse?> Post(
        string effectiveDate, string formOfPractice, string country, string am)
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "australian-registration-certificate-new",
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
    // FOREIGN LAWYER PRINCIPAL / EMPLOYEE — AUSTRALIA
    // =========================================================================

    [Fact(DisplayName = "[ARCNew] partnership / AU / AM=Yes / Jul → $275+$45+$165=$550+$90+$330=$970")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_AU_AMYes_JulEffective_FullFees()
    {
        var r = await Post("2025-07-01", "partnership", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(970, r.FeeAmount);
        Assert.Contains("incl. GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCNew] partnership / AU / AM=Yes / Jan → Half fees $275+$45+$165=$485")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_AU_AMYes_JanEffective_HalfFees()
    {
        var r = await Post("2026-01-15", "partnership", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(45,  r.FeeFidelity);
        Assert.Equal(165, r.FeeSm);
        Assert.Equal(485, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] partnership / AU / AM=No / Jul → FeeSm=$0 Total $640")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_AU_AMNo_JulEffective_SmZero()
    {
        var r = await Post("2025-09-01", "partnership", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeeSm);
        Assert.Equal(640, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] incorporated / AU / AM=Yes / Jul → Same as partnership")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_Incorporated_AU_AMYes_JulEffective()
    {
        var r = await Post("2025-07-15", "incorporated", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(970, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] employee / AU / AM=Yes / Jan → Half fees")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_Employee_AU_AMYes_JanEffective()
    {
        var r = await Post("2026-03-01", "employee", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(45,  r.FeeFidelity);
        Assert.Equal(165, r.FeeSm);
        Assert.Equal(485, r.FeeAmount);
    }

    // =========================================================================
    // FOREIGN LAWYER PRINCIPAL / EMPLOYEE — OUTSIDE AUSTRALIA
    // =========================================================================

    [Fact(DisplayName = "[ARCNew] partnership / OA / AM=Yes / Jul → $550+$90+$300=$940 No GST")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_OA_AMYes_JulEffective_FullFees()
    {
        var r = await Post("2025-08-01", "partnership", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(940, r.FeeAmount);
        Assert.Contains("No GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCNew] partnership / OA / AM=Yes / Jan → $275+$45+$150=$470")]
    [Trait("Category", "ARCNew")]
    public async Task FLPE_OA_AMYes_JanEffective_HalfFees()
    {
        var r = await Post("2026-02-01", "partnership", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(45,  r.FeeFidelity);
        Assert.Equal(150, r.FeeSm);
        Assert.Equal(470, r.FeeAmount);
    }

    // =========================================================================
    // VOLUNTEER
    // =========================================================================

    [Fact(DisplayName = "[ARCNew] volunteer_probono / AU / AM=Yes / Jul → $0+$0+$330=$330")]
    [Trait("Category", "ARCNew")]
    public async Task FLVOL_AU_AMYes_JulEffective_NoPcFee()
    {
        var r = await Post("2025-10-01", "volunteer_probono", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(330, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] volunteer_probono / AU / AM=Yes / Jan → $0+$0+$165=$165")]
    [Trait("Category", "ARCNew")]
    public async Task FLVOL_AU_AMYes_JanEffective_HalfAm()
    {
        var r = await Post("2026-04-01", "volunteer_probono", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(165, r.FeeSm);
        Assert.Equal(165, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] volunteer_probono / OA / AM=Yes / Jul → $300 No GST")]
    [Trait("Category", "ARCNew")]
    public async Task FLVOL_OA_AMYes_JulEffective()
    {
        var r = await Post("2025-11-01", "volunteer_probono", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(0,   r!.FeePc);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(300, r.FeeAmount);
        Assert.Contains("No GST", r.Logic);
    }

    [Fact(DisplayName = "[ARCNew] volunteer_probono / AM=No / Jul → $0 total")]
    [Trait("Category", "ARCNew")]
    public async Task FLVOL_AMNo_JulEffective_ZeroTotal()
    {
        var r = await Post("2025-07-15", "volunteer_probono", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeSm);
        Assert.Equal(0, r.FeeAmount);
    }

    // =========================================================================
    // OTHER (sole, volunteer/ARFL, employeeARFL, other)
    // =========================================================================

    [Fact(DisplayName = "[ARCNew] sole / AU / AM=Yes / Jul → $550+$0+$330=$880")]
    [Trait("Category", "ARCNew")]
    public async Task FLOther_Sole_AU_AMYes_JulEffective()
    {
        var r = await Post("2025-07-01", "sole", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(330, r.FeeSm);
        Assert.Equal(880, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] sole / AU / AM=Yes / Jan → $275+$0+$165=$440")]
    [Trait("Category", "ARCNew")]
    public async Task FLOther_Sole_AU_AMYes_JanEffective()
    {
        var r = await Post("2026-05-01", "sole", "Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(165, r.FeeSm);
        Assert.Equal(440, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] employeeARFL / OA / AM=Yes / Jul → $550+$0+$300=$850")]
    [Trait("Category", "ARCNew")]
    public async Task FLOther_EmployeeARFL_OA_AMYes_JulEffective()
    {
        var r = await Post("2025-08-15", "employeeARFL", "Outside Australia", "yes");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(300, r.FeeSm);
        Assert.Equal(850, r.FeeAmount);
    }

    [Fact(DisplayName = "[ARCNew] other / AU / AM=No / Jul → $550 only (no fidelity, no AM)")]
    [Trait("Category", "ARCNew")]
    public async Task FLOther_Other_AU_AMNo_JulEffective()
    {
        var r = await Post("2025-09-01", "other", "Australia", "No");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(0,   r.FeeSm);
        Assert.Equal(550, r.FeeAmount);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    [Fact(DisplayName = "[ARCNew] Missing required fields → 400")]
    [Trait("Category", "ARCNew")]
    public async Task MissingFields_Returns400()
    {
        GuardRunning();
        var resp = await Http.PostAsJsonAsync("/api/GetFee", new { formType = "australian-registration-certificate-new", effectiveDate = "2026-07-01" });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact(DisplayName = "[ARCNew] Invalid effectiveDate → 400")]
    [Trait("Category", "ARCNew")]
    public async Task InvalidDate_Returns400()
    {
        GuardRunning();
        var resp = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "australian-registration-certificate-new",
            effectiveDate = "not-a-date",
            formOfPractice = "partnership",
            practiceCountry = "Australia",
            AM = "yes"
        });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
