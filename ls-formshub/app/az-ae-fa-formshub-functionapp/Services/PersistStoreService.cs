using Microsoft.Data.SqlClient;

namespace api.Services
{
    public class PersistStoreService
    {
        private readonly string _connectionString;

        public PersistStoreService()
        {
            _connectionString =
                Environment.GetEnvironmentVariable("SqlDbConnectionString")
                ?? throw new InvalidOperationException(
                    "SqlDbConnectionString is not configured.");
        }

        public async Task<bool> SaveAsync(string? lawId, string? formType, string submissionId, string payload)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            if (string.IsNullOrWhiteSpace(submissionId))
            {
                return false;
            }

            const string sql = """
            IF EXISTS (
                SELECT 1
                FROM dbo.PersistStore
                WHERE JSON_VALUE(Payload, '$.formData.submissionId') = @SubmissionId
            )
            BEGIN
                SELECT CAST(0 AS bit);
            END
            ELSE
            BEGIN
                INSERT INTO dbo.PersistStore
                (
                    LawId,
                    FormType,
                    Payload,
                    CreatedBy,
                    UpdatedBy
                )
                VALUES
                (
                    @LawId,
                    @FormType,
                    @Payload,
                    @User,
                    @User
                );

                SELECT CAST(1 AS bit);
            END
            """;

            await using var command = new SqlCommand(sql, connection);

            command.Parameters.AddWithValue("@LawId", (object?)lawId ?? DBNull.Value);
            command.Parameters.AddWithValue("@FormType", (object?)formType ?? DBNull.Value);
            command.Parameters.AddWithValue("@SubmissionId", submissionId);
            command.Parameters.AddWithValue("@Payload", payload);
            command.Parameters.AddWithValue("@User", "FormsHub Function App");

            var result = await command.ExecuteScalarAsync();
            return result is bool inserted && inserted;
        }
    }
}