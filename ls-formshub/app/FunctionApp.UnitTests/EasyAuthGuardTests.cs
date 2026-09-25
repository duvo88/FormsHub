using api.services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Moq;
using System.Text;
using System.Text.Json;
using Xunit;

namespace FunctionApp.UnitTests;

/// <summary>
/// Unit tests for EasyAuthGuard - validates Azure Static Web Apps authentication headers
/// </summary>
public class EasyAuthGuardTests
{
    private const string ClientPrincipalHeader = "X-MS-CLIENT-PRINCIPAL";

    private static HttpRequest CreateRequestWithHeader(string? headerValue)
    {
        var mockRequest = new Mock<HttpRequest>();
        var headers = new HeaderDictionary();
        
        if (headerValue != null)
        {
            headers[ClientPrincipalHeader] = new StringValues(headerValue);
        }
        
        mockRequest.Setup(r => r.Headers).Returns(headers);
        return mockRequest.Object;
    }

    private static string CreateValidAuthHeader(string userId = "test-user-123")
    {
        var principal = new
        {
            userId,
            userDetails = "test@example.com",
            identityProvider = "aadb2c",
            claims = Array.Empty<object>()
        };
        
        var json = JsonSerializer.Serialize(principal);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    [Fact(DisplayName = "Returns null when valid authentication header is present")]
    public void RequireAuthenticatedUser_ValidHeader_ReturnsNull()
    {
        // Arrange
        var validHeader = CreateValidAuthHeader();
        var request = CreateRequestWithHeader(validHeader);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.Null(result); // Null means authentication passed
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when header is missing")]
    public void RequireAuthenticatedUser_MissingHeader_ReturnsUnauthorized()
    {
        // Arrange
        var request = CreateRequestWithHeader(null);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when header is empty")]
    public void RequireAuthenticatedUser_EmptyHeader_ReturnsUnauthorized()
    {
        // Arrange
        var request = CreateRequestWithHeader(string.Empty);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when header is whitespace")]
    public void RequireAuthenticatedUser_WhitespaceHeader_ReturnsUnauthorized()
    {
        // Arrange
        var request = CreateRequestWithHeader("   ");

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when header is not valid Base64")]
    public void RequireAuthenticatedUser_InvalidBase64_ReturnsUnauthorized()
    {
        // Arrange
        var request = CreateRequestWithHeader("not-valid-base64!");

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when header contains invalid JSON")]
    public void RequireAuthenticatedUser_InvalidJson_ReturnsUnauthorized()
    {
        // Arrange
        var invalidJson = "{ invalid json }";
        var encodedInvalid = Convert.ToBase64String(Encoding.UTF8.GetBytes(invalidJson));
        var request = CreateRequestWithHeader(encodedInvalid);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when userId is missing")]
    public void RequireAuthenticatedUser_MissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        var principal = new { userDetails = "test@example.com" }; // Missing userId
        var json = JsonSerializer.Serialize(principal);
        var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
        var request = CreateRequestWithHeader(encoded);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns UnauthorizedResult when userId is empty string")]
    public void RequireAuthenticatedUser_EmptyUserId_ReturnsUnauthorized()
    {
        // Arrange
        var validHeader = CreateValidAuthHeader(userId: "");
        var request = CreateRequestWithHeader(validHeader);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact(DisplayName = "Returns null when userId is present with valid structure")]
    public void RequireAuthenticatedUser_ValidUserIdPresent_ReturnsNull()
    {
        // Arrange
        var validHeader = CreateValidAuthHeader("user-abc-123");
        var request = CreateRequestWithHeader(validHeader);

        // Act
        var result = EasyAuthGuard.RequireAuthenticatedUser(request);

        // Assert
        Assert.Null(result);
    }
}
