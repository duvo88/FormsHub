namespace api.services;

using System;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

public static class EasyAuthGuard
{
    private const string ClientPrincipalHeader = "X-MS-CLIENT-PRINCIPAL";

    public static IActionResult? RequireAuthenticatedUser(HttpRequest req)
    {
        if (!req.Headers.TryGetValue(ClientPrincipalHeader, out var headerValues))
            return new UnauthorizedResult();

        var encoded = headerValues.ToString();
        if (string.IsNullOrWhiteSpace(encoded))
            return new UnauthorizedResult();

        try
        {
            var jsonBytes = Convert.FromBase64String(encoded);
            var json = Encoding.UTF8.GetString(jsonBytes);
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("userId", out var userIdEl) ||
                string.IsNullOrWhiteSpace(userIdEl.GetString()))
                return new UnauthorizedResult();
        }
        catch
        {
            return new UnauthorizedResult();
        }

        return null;
    }
}
