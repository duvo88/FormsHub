using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace FeeLogic.Tests;

/// <summary>
/// Integration tests for the GetFee Azure Function - formType = "change-in-employment-details".
///
/// HOW TO USE
/// 1. Seed the FeeRulePCVariation table:
///      .\cicd\storageAccount\seed-fee-rules-pcvariation.ps1 -StorageAccountName "azaestformshubdev"
/// 2. Start the function app (F5 or "func host start" in bin/Debug/net8.0).
/// 3. Run:  dotnet test FeeLogic.Tests --filter Category=ChangeEmploymentDetails
///
/// BASE URL: defaults to http://localhost:7071
/// Override: $env:GETFEE_BASE_URL = "http://localhost:7072"
/// </summary>
public class GetFeeChangeEmploymentDetailsIntegrationTests : IAsyncLifetime
{
    private static readonly string BaseUrl =
        Environment.GetEnvironmentVariable("GETFEE_BASE_URL") ?? "http://localhost:7071";

    private static readonly HttpClient Http;

    static GetFeeChangeEmploymentDetailsIntegrationTests()
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
                "Start it locally then re-run: dotnet test FeeLogic.Tests --filter Category=ChangeEmploymentDetails");
    }

    private async Task<(HttpStatusCode Status, GetFeeApiResponse? Body)> Post(
        string effectiveDate, string prevCategory, string newCategory)
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType      = "change-in-employment-details",
            effectiveDate,
            practiceCountry = "Australia", // not used by calculator but required field
            prevCategory,
            newCategory,
        });
        if (!response.IsSuccessStatusCode)
            return (response.StatusCode, null);
        var body = await response.Content.ReadFromJsonAsync<GetFeeApiResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return (response.StatusCode, body);
    }

    private static GetFeeApiResponse CombineMultiEntity(GetFeeApiResponse entity1, GetFeeApiResponse entity2)
    {
        var feePc = Math.Max(entity1.FeePc, entity2.FeePc);
        var feeFidelity = Math.Max(entity1.FeeFidelity, entity2.FeeFidelity);
        return new GetFeeApiResponse
        {
            FeePc = feePc,
            FeeFidelity = feeFidelity,
            FeeAmount = feePc + feeFidelity,
            Logic = $"Combined max components from two entities (PC={feePc}, Fidelity={feeFidelity})"
        };
    }

    private async Task<GetFeeApiResponse> PostCombined(
        string prevCategory,
        string entity1Category,
        string entity1EffectiveDate,
        string entity2Category,
        string entity2EffectiveDate)
    {
        var (_, entity1) = await Post(entity1EffectiveDate, prevCategory, entity1Category);
        var (_, entity2) = await Post(entity2EffectiveDate, prevCategory, entity2Category);

        Assert.NotNull(entity1);
        Assert.NotNull(entity2);

        return CombineMultiEntity(entity1!, entity2!);
    }

    // =========================================================================
    // Multi-Entity Combination (frontend orchestration rule)
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails MultiEntity] Vol->Corp(Aug) + Vol->Principal(Feb) => PC 550 + Fidelity 45 = 595")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MultiEntity_VolToCorpAug_And_VolToPrincipalFeb_CombinesTo_550Plus45()
    {
        var combined = await PostCombined(
            prevCategory: "volunteer",
            entity1Category: "corporate",
            entity1EffectiveDate: "2026-08-01",
            entity2Category: "principal",
            entity2EffectiveDate: "2026-02-01");

        Assert.Equal(550, combined.FeePc);
        Assert.Equal(45, combined.FeeFidelity);
        Assert.Equal(595, combined.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails MultiEntity] Vol->Principal(Aug) + Vol->Corp(Feb) => PC 550 + Fidelity 90 = 640")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MultiEntity_VolToPrincipalAug_And_VolToCorpFeb_CombinesTo_550Plus90()
    {
        var combined = await PostCombined(
            prevCategory: "volunteer",
            entity1Category: "principal",
            entity1EffectiveDate: "2026-08-01",
            entity2Category: "corporate",
            entity2EffectiveDate: "2026-02-01");

        Assert.Equal(550, combined.FeePc);
        Assert.Equal(90, combined.FeeFidelity);
        Assert.Equal(640, combined.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails MultiEntity] Vol->Volunteer(Aug) + Vol->Principal(Feb) => PC 275 + Fidelity 45 = 320")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MultiEntity_VolToVolAug_And_VolToPrincipalFeb_CombinesTo_275Plus45()
    {
        var combined = await PostCombined(
            prevCategory: "volunteer",
            entity1Category: "volunteer",
            entity1EffectiveDate: "2026-08-01",
            entity2Category: "principal",
            entity2EffectiveDate: "2026-02-01");

        Assert.Equal(275, combined.FeePc);
        Assert.Equal(45, combined.FeeFidelity);
        Assert.Equal(320, combined.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails MultiEntity] Prin->Volunteer(Aug) + Prin->Corp(Feb) => No Fee")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MultiEntity_PrincipalToVolAug_And_PrincipalToCorpFeb_NoFee()
    {
        var combined = await PostCombined(
            prevCategory: "principal",
            entity1Category: "volunteer",
            entity1EffectiveDate: "2026-08-01",
            entity2Category: "corporate",
            entity2EffectiveDate: "2026-02-01");

        Assert.Equal(0, combined.FeePc);
        Assert.Equal(0, combined.FeeFidelity);
        Assert.Equal(0, combined.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails MultiEntity] Corp->Principal(Feb) + Corp->Volunteer(Aug) => Fidelity 45")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MultiEntity_CorpToPrincipalFeb_And_CorpToVolAug_CombinesTo_45()
    {
        var combined = await PostCombined(
            prevCategory: "corporate",
            entity1Category: "principal",
            entity1EffectiveDate: "2026-02-01",
            entity2Category: "volunteer",
            entity2EffectiveDate: "2026-08-01");

        Assert.Equal(0, combined.FeePc);
        Assert.Equal(45, combined.FeeFidelity);
        Assert.Equal(45, combined.FeeAmount);
    }

    // =========================================================================
    // Volunteer → Principal/Employee
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Principal / Jul → PC=$550 Fidelity=$90 Total=$640")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToPrincipal_Jul_FullPCFidelity()
    {
        var (_, r) = await Post("2026-07-01", "volunteer", "principal");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(640, r.FeeAmount);
        Assert.Contains("Full PC + Full Fidelity", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Employee / Jul → PC=$550 Fidelity=$90 Total=$640")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToEmployee_Jul_FullPCFidelity()
    {
        var (_, r) = await Post("2026-07-15", "volunteer", "employee");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(90,  r.FeeFidelity);
        Assert.Equal(640, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Principal / Jan → PC=$275 Fidelity=$45 Total=$320")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToPrincipal_Jan_HalfPCFidelity()
    {
        var (_, r) = await Post("2026-03-01", "volunteer", "principal");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(45,  r.FeeFidelity);
        Assert.Equal(320, r.FeeAmount);
        Assert.Contains("Half PC + Half Fidelity", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Employee / Jan → PC=$275 Fidelity=$45 Total=$320")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToEmployee_Jan_HalfPCFidelity()
    {
        var (_, r) = await Post("2026-01-15", "volunteer", "employee");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(45,  r.FeeFidelity);
        Assert.Equal(320, r.FeeAmount);
    }

    // =========================================================================
    // Volunteer → Gov/Corporate
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Government / Jul → PC=$550 Fidelity=$0 Total=$550")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToGovernment_Jul_FullPCFees()
    {
        var (_, r) = await Post("2026-07-01", "volunteer", "government");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(550, r.FeeAmount);
        Assert.Contains("Full PC Fees", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Corporate / Jul → PC=$550 Fidelity=$0 Total=$550")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToCorporate_Jul_FullPCFees()
    {
        var (_, r) = await Post("2026-08-01", "volunteer", "corporate");
        Assert.NotNull(r);
        Assert.Equal(550, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(550, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Corporate / Jan → PC=$275 Fidelity=$0 Total=$275")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToCorporate_Jan_HalfPCFees()
    {
        var (_, r) = await Post("2026-04-01", "volunteer", "corporate");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(275, r.FeeAmount);
        Assert.Contains("Half PC Fees", r!.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Vol→Government / Jan → PC=$275 Fidelity=$0 Total=$275")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToGovernment_Jan_HalfPCFees()
    {
        var (_, r) = await Post("2026-03-15", "volunteer", "government");
        Assert.NotNull(r);
        Assert.Equal(275, r!.FeePc);
        Assert.Equal(0,   r.FeeFidelity);
        Assert.Equal(275, r.FeeAmount);
        Assert.Contains("Half PC Fees", r.Logic);
    }

    // =========================================================================
    // Gov/Corporate → Principal/Employee
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails] GovCorp→Principal / Jul → PC=$0 Fidelity=$90 Total=$90")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task GovCorpToPrincipal_Jul_FullFidelity()
    {
        var (_, r) = await Post("2026-07-01", "government", "principal");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(90, r.FeeAmount);
        Assert.Contains("Full Fidelity", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Corporate→Employee / Jul → PC=$0 Fidelity=$90 Total=$90")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task CorporateToEmployee_Jul_FullFidelity()
    {
        var (_, r) = await Post("2026-09-01", "corporate", "employee");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(90, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Corporate→Principal / Jul → PC=$0 Fidelity=$90 Total=$90")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task CorpToPrincipal_Jul_FullFidelity()
    {
        var (_, r) = await Post("2026-07-15", "corporate", "principal");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(90, r.FeeAmount);
        Assert.Contains("Full Fidelity", r!.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Government→Employee / Jul → PC=$0 Fidelity=$90 Total=$90")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task GovToEmployee_Jul_FullFidelity()
    {
        var (_, r) = await Post("2026-08-15", "government", "employee");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(90, r.FeeFidelity);
        Assert.Equal(90, r.FeeAmount);
        Assert.Contains("Full Fidelity", r!.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] GovCorp→Principal / Jan → PC=$0 Fidelity=$45 Total=$45")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task GovCorpToPrincipal_Jan_HalfFidelity()
    {
        var (_, r) = await Post("2026-02-01", "government", "principal");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(45, r.FeeFidelity);
        Assert.Equal(45, r.FeeAmount);
        Assert.Contains("Half Fidelity", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Corporate→Employee / Jan → PC=$0 Fidelity=$45 Total=$45")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task CorporateToEmployee_Jan_HalfFidelity()
    {
        var (_, r) = await Post("2026-06-01", "corporate", "employee");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(45, r.FeeFidelity);
        Assert.Equal(45, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Corporate→Principal / Jan → PC=$0 Fidelity=$45 Total=$45")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task CorpToPrincipal_Jan_HalfFidelity()
    {
        var (_, r) = await Post("2026-05-01", "corporate", "principal");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(45, r.FeeFidelity);
        Assert.Equal(45, r.FeeAmount);
        Assert.Contains("Half Fidelity", r!.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Government→Employee / Jan → PC=$0 Fidelity=$45 Total=$45")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task GovToEmployee_Jan_HalfFidelity()
    {
        var (_, r) = await Post("2026-03-15", "government", "employee");
        Assert.NotNull(r);
        Assert.Equal(0,  r!.FeePc);
        Assert.Equal(45, r.FeeFidelity);
        Assert.Equal(45, r.FeeAmount);
        Assert.Contains("Half Fidelity", r!.Logic);
    }

    // =========================================================================
    // No Fee variations
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails] Principal→Government / Any → $0")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task PrincipalToGovernment_NoFee()
    {
        var (_, r) = await Post("2026-07-01", "principal", "government");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(0, r.FeeAmount);
        Assert.Contains("No Fees", r.Logic);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Employee→Volunteer / Any → $0")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task EmployeeToVolunteer_NoFee()
    {
        var (_, r) = await Post("2026-07-01", "employee", "volunteer");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(0, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Government→Volunteer / Any → $0")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task GovernmentToVolunteer_NoFee()
    {
        var (_, r) = await Post("2026-03-01", "government", "volunteer");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(0, r.FeeAmount);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Volunteer→Volunteer / Any → $0")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task VolToVol_NoFee()
    {
        var (_, r) = await Post("2026-07-01", "volunteer", "volunteer");
        Assert.NotNull(r);
        Assert.Equal(0, r!.FeePc);
        Assert.Equal(0, r.FeeFidelity);
        Assert.Equal(0, r.FeeAmount);
    }

    // =========================================================================
    // Validation — 400 Bad Request
    // =========================================================================

    [Fact(DisplayName = "[ChangeEmploymentDetails] Missing prevCategory → 400")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MissingPrevCategory_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "change-in-employment-details",
            effectiveDate = "2026-07-01",
            practiceCountry = "Australia",
            newCategory = "principal"
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Missing newCategory → 400")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task MissingNewCategory_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "change-in-employment-details",
            effectiveDate = "2026-07-01",
            practiceCountry = "Australia",
            prevCategory = "volunteer"
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "[ChangeEmploymentDetails] Invalid effectiveDate → 400")]
    [Trait("Category", "ChangeEmploymentDetails")]
    public async Task InvalidDate_Returns400()
    {
        GuardRunning();
        var response = await Http.PostAsJsonAsync("/api/GetFee", new
        {
            formType = "change-in-employment-details",
            effectiveDate = "not-a-date",
            practiceCountry = "Australia",
            prevCategory = "volunteer",
            newCategory = "principal"
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
