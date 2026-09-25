using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Xunit;

namespace FeeLogic.Tests;

/// <summary>
/// Integration tests for PC New fee calculations - calls POST /api/GetFee with formType="practising-certificate-new".
///
/// HOW TO USE
/// 1. Seed FeeRulePCNew table:
///      .\cicd\storageAccount\seed-fee-rules-pcnew.ps1 -StorageAccountName "azaestformshubdev"
/// 2. Start the function app (F5 or "func host start" in bin/Debug/net8.0).
/// 3. Run:  dotnet test FeeLogic.Tests --filter Category=Integration
///
/// BASE URL: defaults to http://localhost:7071
/// Override: $env:GETFEE_BASE_URL = "http://localhost:7072"
/// </summary>
public class GetFeePCNewIntegrationTests : IAsyncLifetime
{
    private static readonly string BaseUrl =
        Environment.GetEnvironmentVariable("GETFEE_BASE_URL") ?? "http://localhost:7071";

    private static readonly HttpClient Http;

    static GetFeePCNewIntegrationTests()
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
            var resp = await Http.GetAsync("/api/GetFee", cts.Token);
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
                "Start it locally (F5) then re-run: dotnet test FeeLogic.Tests --filter Category=Integration");
    }

    private async Task<GetFeeApiResponse?> Post(
        string doa, string effectiveDate, string country, string registryType, string sm)
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "practising-certificate-new",
            dateOfAdmission = doa, effectiveDate, practiceCountry = country, registryType, sm
        });
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<GetFeeApiResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    // PRINCIPAL / EMPLOYEE � AUSTRALIA
    [Fact(DisplayName = "[API] PE / AU / SM=Yes / Old DOA / Effective Jul -> Full $1080")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_SMYes_OldDOA_JulEffective_FullFees()
    {
        var r = await Post("2010-03-15", "2025-07-01", "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(440, r.FeeSm); Assert.Equal(1080, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / AU / SM=Yes / Old DOA / Effective Jan -> Half $540")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_SMYes_OldDOA_JanEffective_HalfFees()
    {
        var r = await Post("2010-03-15", "2026-01-15", "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(275, r!.FeePc); Assert.Equal(45, r.FeeFidelity);
        Assert.Equal(220, r.FeeSm); Assert.Equal(540, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / AU / SM=No / Effective Jul -> FeeSm=$0 Total $640")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_SMNo_JulEffective_SmZero()
    {
        var r = await Post("2010-03-15", "2025-07-01", "Australia", "Principal/Employee", "No");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm); Assert.Equal(640, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / AU / SM=Yes / DOA in PC year / Jul -> FeeSm=$0")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_DOAInPCYear_JulEffective_SmZero()
    {
        var r = await Post("2026-01-15", "2025-08-01", "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm); Assert.Equal(640, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / AU / SM=Yes / DOA in PC year / Jan -> FeeSm=$0 (not half)")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_DOAInPCYear_JanEffective_SmZeroNotHalf()
    {
        var r = await Post("2026-03-01", "2026-03-15", "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm); Assert.Equal(275, r.FeePc); Assert.Equal(320, r.FeeAmount);
    }

    // PRINCIPAL / EMPLOYEE � OUTSIDE AUSTRALIA
    [Fact(DisplayName = "[API] PE / OA / SM=Yes / Old DOA / Effective Jul -> Full $1040")]
    [Trait("Category", "Integration")]
    public async Task API_PE_OA_SMYes_OldDOA_JulEffective_FullFees()
    {
        var r = await Post("2010-03-15", "2025-07-01", "Outside Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(400, r.FeeSm); Assert.Equal(1040, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / OA / SM=Yes / Old DOA / Effective Jan -> Half SM=$200")]
    [Trait("Category", "Integration")]
    public async Task API_PE_OA_SMYes_OldDOA_JanEffective_HalfSm()
    {
        var r = await Post("2010-03-15", "2026-04-01", "Outside Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(200, r!.FeeSm); Assert.Equal(520, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PE / OA / SM=No -> FeeSm=$0")]
    [Trait("Category", "Integration")]
    public async Task API_PE_OA_SMNo_SmZero()
    {
        var r = await Post("2010-03-15", "2026-04-01", "Outside Australia", "Principal/Employee", "No");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm);
    }

    // PRINCIPAL - SUPERVISOR
    [Fact(DisplayName = "[API] PS / AU / SM=Yes / Effective Jul -> Free Fidelity")]
    [Trait("Category", "Integration")]
    public async Task API_PS_AU_SMYes_JulEffective_FreeFidelity()
    {
        var r = await Post("2010-03-15", "2025-07-01", "Australia", "Principal-Supervisor", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(440, r.FeeSm); Assert.Equal(990, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] PS / OA / SM=Yes / Effective Jan -> Free Fidelity")]
    [Trait("Category", "Integration")]
    public async Task API_PS_OA_SMYes_JanEffective_FreeFidelity()
    {
        var r = await Post("2010-03-15", "2026-01-15", "Outside Australia", "Principal-Supervisor", "yes");
        Assert.NotNull(r); Assert.Equal(275, r!.FeePc); Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(200, r.FeeSm); Assert.Equal(475, r.FeeAmount);
    }

    // GOV / CORPORATE
    [Fact(DisplayName = "[API] GC / AU / SM=Yes / Effective Jul -> $990")]
    [Trait("Category", "Integration")]
    public async Task API_GC_AU_JulEffective_FullFees()
    {
        var r = await Post("2010-03-15", "2025-09-01", "Australia", "Gov/Corporate", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(440, r.FeeSm); Assert.Equal(990, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] GC / AU / SM=Yes / Effective Jan -> $495")]
    [Trait("Category", "Integration")]
    public async Task API_GC_AU_JanEffective_HalfFees()
    {
        var r = await Post("2010-03-15", "2026-02-01", "Australia", "Gov/Corporate", "yes");
        Assert.NotNull(r); Assert.Equal(275, r!.FeePc); Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(220, r.FeeSm); Assert.Equal(495, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] GC / OA / SM=Yes / Effective Jul -> Full OA fees")]
    [Trait("Category", "Integration")]
    public async Task API_GC_OA_JulEffective_FullFees()
    {
        var r = await Post("2010-03-15", "2025-11-01", "Outside Australia", "Gov/Corporate", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(0, r.FeeFidelity); Assert.Equal(400, r.FeeSm); Assert.Equal(950, r.FeeAmount);
    }

    // NOT CURRENTLY PRACTISING
    [Fact(DisplayName = "[API] NCP / AU / SM=Yes / Effective Jul -> Full fees")]
    [Trait("Category", "Integration")]
    public async Task API_NCP_AU_JulEffective_FullFees()
    {
        var r = await Post("2010-03-15", "2025-07-15", "Australia", "Not Currently Practising", "yes");
        Assert.NotNull(r); Assert.Equal(550, r!.FeePc); Assert.Equal(0, r.FeeFidelity); Assert.Equal(440, r.FeeSm); Assert.Equal(990, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] NCP / AU / SM=Yes / Effective Jan -> Half fees")]
    [Trait("Category", "Integration")]
    public async Task API_NCP_AU_JanEffective_HalfFees()
    {
        var r = await Post("2010-03-15", "2026-06-01", "Australia", "Not Currently Practising", "yes");
        Assert.NotNull(r); Assert.Equal(275, r!.FeePc); Assert.Equal(0, r.FeeFidelity); Assert.Equal(220, r.FeeSm); Assert.Equal(495, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] NCP / OA / SM=No -> FeeSm=$0")]
    [Trait("Category", "Integration")]
    public async Task API_NCP_OA_SMNo_SmZero()
    {
        var r = await Post("2010-03-15", "2025-10-01", "Outside Australia", "Not Currently Practising", "No");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm); Assert.Equal(550, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] NCP / AU / DOA in PC year / SM=Yes -> FeeSm=$0")]
    [Trait("Category", "Integration")]
    public async Task API_NCP_AU_DOAInPCYear_SmZero()
    {
        var r = await Post("2026-05-01", "2026-05-20", "Australia", "Not Currently Practising", "yes");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeSm); Assert.Equal(275, r.FeeAmount);
    }

    // VOLUNTEER
    [Fact(DisplayName = "[API] VOL / AU / SM=Yes / Effective Jul -> $0 PC + Full SM")]
    [Trait("Category", "Integration")]
    public async Task API_VOL_AU_JulEffective_FullSM()
    {
        var r = await Post("2010-03-15", "2025-08-01", "Australia", "Volunteer", "yes");
        Assert.NotNull(r); Assert.Equal(0, r!.FeePc); Assert.Equal(0, r.FeeFidelity); Assert.Equal(440, r.FeeSm); Assert.Equal(440, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] VOL / AU / SM=Yes / Effective Jan -> $0 PC + Half SM")]
    [Trait("Category", "Integration")]
    public async Task API_VOL_AU_JanEffective_HalfSM()
    {
        var r = await Post("2010-03-15", "2026-03-01", "Australia", "Volunteer", "yes");
        Assert.NotNull(r); Assert.Equal(0, r!.FeePc); Assert.Equal(0, r.FeeFidelity); Assert.Equal(220, r.FeeSm); Assert.Equal(220, r.FeeAmount);
    }

    [Fact(DisplayName = "[API] VOL / OA / SM=No -> $0 total")]
    [Trait("Category", "Integration")]
    public async Task API_VOL_OA_SMNo_ZeroTotal()
    {
        var r = await Post("2010-03-15", "2025-09-15", "Outside Australia", "Volunteer", "No");
        Assert.NotNull(r); Assert.Equal(0, r!.FeeAmount);
    }

    // MULTIPLE PC YEARS
    [Theory(DisplayName = "[API] PE / AU / Old DOA / Jul effective -> Full $1080 across PC years")]
    [InlineData("2025-07-01")] [InlineData("2026-07-01")] [InlineData("2030-07-01")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_JulEffective_MultipleYears(string effectiveDate)
    {
        var r = await Post("2000-01-01", effectiveDate, "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(1080, r!.FeeAmount);
    }

    [Theory(DisplayName = "[API] PE / AU / Old DOA / Jan effective -> Half $540 across PC years")]
    [InlineData("2026-01-15")] [InlineData("2027-03-01")] [InlineData("2031-06-30")]
    [Trait("Category", "Integration")]
    public async Task API_PE_AU_JanEffective_MultipleYears(string effectiveDate)
    {
        var r = await Post("2000-01-01", effectiveDate, "Australia", "Principal/Employee", "yes");
        Assert.NotNull(r); Assert.Equal(540, r!.FeeAmount);
    }

    // ERROR CASES
    [Fact(DisplayName = "[API] Unknown registry type -> 404")]
    [Trait("Category", "Integration")]
    public async Task API_UnknownRegistryType_Returns404()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "practising-certificate-new",
            dateOfAdmission = "2010-01-01", effectiveDate = "2025-07-01",
            practiceCountry = "Australia", registryType = "UnknownType", sm = "yes"
        });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact(DisplayName = "[API] Missing required fields -> 400")]
    [Trait("Category", "Integration")]
    public async Task API_MissingFields_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new { formType = "practising-certificate-new", dateOfAdmission = "2025-01-01" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

internal sealed class GetFeeApiResponse
{
    [JsonPropertyName("feeAmount")]   public double  FeeAmount   { get; set; }
    [JsonPropertyName("feePc")]       public double  FeePc       { get; set; }
    [JsonPropertyName("feeFidelity")] public double  FeeFidelity { get; set; }
    [JsonPropertyName("feeSm")]       public double  FeeSm       { get; set; }
    [JsonPropertyName("logic")]       public string? Logic       { get; set; }
}
