using FormsHub.FeeLogic;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FunctionApp.UnitTests;

/// <summary>
/// Unit tests for PCNewFeeCalculator validation logic
/// Tests business logic without requiring Azure Storage or deployed infrastructure
/// </summary>
public class PCNewFeeCalculatorTests
{
    private readonly PCNewFeeCalculator _calculator;

    public PCNewFeeCalculatorTests()
    {
        // Create a mock FeeRuleService that doesn't call the real constructor
        var mockFeeRuleService = new Mock<FeeRuleService>("https://test.table.core.windows.net", "TestTable");
        _calculator = new PCNewFeeCalculator(mockFeeRuleService.Object);
    }

    #region Validation Tests

    [Fact(DisplayName = "Validate returns error when dateOfAdmission is missing")]
    public void Validate_MissingDateOfAdmission_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("dateOfAdmission", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error when effectiveDate is missing")]
    public void Validate_MissingEffectiveDate_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("effectiveDate", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error when practiceCountry is missing")]
    public void Validate_MissingPracticeCountry_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "2026-07-01",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("practiceCountry", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error when registryType is missing")]
    public void Validate_MissingRegistryType_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("registryType", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error when SM is missing")]
    public void Validate_MissingSM_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("SM", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error for invalid dateOfAdmission format")]
    public void Validate_InvalidDateOfAdmissionFormat_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "not-a-date",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("dateOfAdmission", error, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("format", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns error for invalid effectiveDate format")]
    public void Validate_InvalidEffectiveDateFormat_ReturnsError()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "invalid-date",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.NotNull(error);
        Assert.Contains("effectiveDate", error, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("format", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Validate returns null for valid request")]
    public void Validate_ValidRequest_ReturnsNull()
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.Null(error); // Null means validation passed
    }

    [Theory(DisplayName = "Validate accepts various valid date formats")]
    [InlineData("2020-01-15", "2026-07-01")]
    [InlineData("2020/01/15", "2026/07/01")]
    [InlineData("2020-01-15T00:00:00Z", "2026-07-01T12:00:00Z")]
    public void Validate_VariousDateFormats_AcceptsValid(string admissionDate, string effectiveDate)
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = admissionDate,
            EffectiveDate = effectiveDate,
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = "yes"
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.Null(error);
    }

    [Theory(DisplayName = "Validate accepts different SM values")]
    [InlineData("yes")]
    [InlineData("no")]
    [InlineData("Yes")]
    [InlineData("No")]
    [InlineData("YES")]
    [InlineData("NO")]
    public void Validate_DifferentSMValues_Accepts(string smValue)
    {
        // Arrange
        var request = new UnifiedFeeRequest
        {
            FormType = "practising-certificate-new",
            DateOfAdmission = "2020-01-15",
            EffectiveDate = "2026-07-01",
            PracticeCountry = "Australia",
            RegistryType = "Principal/Employee",
            SM = smValue
        };

        // Act
        var error = _calculator.Validate(request);

        // Assert
        Assert.Null(error);
    }

    #endregion
}
