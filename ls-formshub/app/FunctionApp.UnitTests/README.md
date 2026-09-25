# Function App Unit Tests

Unit tests for Azure Functions business logic that run WITHOUT requiring deployed infrastructure.

## What's Tested

### ✅ EasyAuthGuardTests (9 tests)
Tests Azure Static Web Apps authentication header validation:
- Valid authentication headers
- Missing/empty headers
- Invalid Base64 encoding
- Invalid JSON
- Missing or empty userId

### ✅ PCNewFeeCalculatorTests (12 tests)
Tests PC New fee calculator validation logic:
- Required field validation (dateOfAdmission, effectiveDate, practiceCountry, registryType, SM)
- Date format validation
- Valid request scenarios
- Various date formats (ISO, slash-separated, with timestamps)
- Case-insensitive SM values (yes/no/Yes/No/YES/NO)

## Running Tests

### Run all unit tests
```bash
dotnet test FunctionApp.UnitTests
```

### Run with detailed output
```bash
dotnet test FunctionApp.UnitTests --logger "console;verbosity=detailed"
```

### Run specific test class
```bash
dotnet test FunctionApp.UnitTests --filter FullyQualifiedName~EasyAuthGuardTests
```

### Run with coverage
```bash
dotnet test FunctionApp.UnitTests --collect:"XPlat Code Coverage"
```

## CI/CD Integration

These tests run in the Azure DevOps pipeline **BEFORE deployment**:

```yaml
- task: DotNetCoreCLI@2
  displayName: 'Run Unit Tests'
  inputs:
    command: test
    projects: '**/FunctionApp.UnitTests.csproj'
    arguments: '--configuration Release --logger trx --collect:"XPlat Code Coverage"'
```

**Benefits:**
- ✅ Fast execution (no infrastructure required)
- ✅ Early failure detection (before deployment)
- ✅ No Azure credentials needed
- ✅ Tests business logic in isolation

## vs FeeLogic Integration Tests

| **Unit Tests** (FunctionApp.UnitTests) | **FeeLogic Integration Tests** (FeeLogic.Tests) |
|---|---|
| Test business logic | Test fee calculation rules |
| No infrastructure needed | Requires Azure Table Storage |
| Run in build pipeline | Run post-deployment or locally |
| Fast (<1 second) | Slower (database calls) |
| Mock external dependencies | Use real Azure Table Storage |

## Adding More Tests

### Test Calculator Validation
```csharp
[Fact]
public void Validate_MissingRequiredField_ReturnsError()
{
    var request = new UnifiedFeeRequest { /* ... */ };
    var error = _calculator.Validate(request);
    Assert.NotNull(error);
}
```

### Test Authentication
```csharp
[Fact]
public void RequireAuthenticatedUser_InvalidScenario_ReturnsUnauthorized()
{
    var request = CreateRequestWithHeader("invalid");
    var result = EasyAuthGuard.RequireAuthenticatedUser(request);
    Assert.IsType<UnauthorizedResult>(result);
}
```

### Test Models/DTOs
```csharp
[Fact]
public void FormSubmissionRequest_RequiredFields_Validated()
{
    var submission = new FormSubmissionRequest();
    // Test validation attributes
}
```

## Best Practices

1. **AAA Pattern** - Arrange, Act, Assert
2. **One assertion per test** - Keep tests focused
3. **Descriptive names** - Use `DisplayName` attribute
4. **Mock external dependencies** - Use Moq for services
5. **Test edge cases** - Empty strings, nulls, invalid formats
6. **Fast execution** - No I/O, no sleeps, no real dependencies

## Test Coverage Goals

Target coverage for business logic:
- Validators: 100%
- Guards: 100%
- Calculators: 80%+ (validation logic)
- Models: 60%+

Run coverage report:
```bash
dotnet test FunctionApp.UnitTests --collect:"XPlat Code Coverage"
```
