using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using DotNet.Testcontainers.Configurations;
using EleccionesUTN;
using Microsoft.Data.SqlClient;
using System;
using System.Threading.Tasks;

namespace IntegrationTest
{
    internal class SqlServerContainerWrapper
    {
        private readonly IContainer _dbContainer;
        private string _connectionString = string.Empty;

        public SqlServerContainerWrapper()
        {
            // Configuración básica del contenedor SQL Server
            _dbContainer = new ContainerBuilder()
                .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
                .WithEnvironment("ACCEPT_EULA", "Y")
                .WithEnvironment("SA_PASSWORD", "YourStrong!Passw0rd")
                .WithEnvironment("MSSQL_PID", "Developer")
                .WithPortBinding(1433, true)
                .WithWaitStrategy(Wait.ForUnixContainer()
                    .UntilMessageIsLogged("SQL Server is now ready for client connections"))
                .Build();
        }

        /// <summary>
        /// Inicia el contenedor, crea la base de datos y ejecuta los scripts iniciales.
        /// </summary>
        internal async Task Setup()
        {
            await _dbContainer.StartAsync();

            var host = _dbContainer.Hostname;
            var port = _dbContainer.GetMappedPublicPort(1433);
            _connectionString = $"Server={host},{port};User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;Encrypt=False;Connection Timeout=60;";

            var maxRetries = 10;
            var retryDelay = 2000;
            SqlConnection? connection = null;

            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    connection = new SqlConnection(_connectionString);
                    await connection.OpenAsync();
                    Console.WriteLine($"Successfully connected to SQL Server on attempt {i + 1}");
                    break;
                }
                catch (SqlException ex)
                {
                    Console.WriteLine($"Connection attempt {i + 1} failed: {ex.Message}");
                    connection?.Dispose();
                    connection = null;

                    if (i == maxRetries - 1)
                    {
                        throw new Exception($"Failed to connect to SQL Server after {maxRetries} attempts", ex);
                    }

                    await Task.Delay(retryDelay);
                }
            }

            if (connection == null)
            {
                throw new Exception("Failed to establish SQL Server connection");
            }

            try
            {
                await ExecuteScriptAsync(connection, ScriptsQLS.Users, "Users");
                await ExecuteScriptAsync(connection, ScriptsQLS.Elections, "Elections");
                await ExecuteScriptAsync(connection, ScriptsQLS.Candidates, "Candidates");
                await ExecuteScriptAsync(connection, ScriptsQLS.Votes, "Votes");
                await ExecuteScriptAsync(connection, ScriptsQLS.AuditLog, "AuditLog");
                await ExecuteScriptAsync(connection, ScriptsQLS.Seed, "Seed");
                await ExecuteScriptAsync(connection, ScriptsQLS.DDL, "DDL");
                await ExecuteScriptAsync(connection, ScriptsQLS.SeedLegacy, "SeedLegacy");
                await ExecuteScriptAsync(connection, ScriptsQLS.votes, "votes");
            }
            finally
            {
                await connection.DisposeAsync();
            }
        }

        /// <summary>
        /// Helper method to execute scripts with error handling
        /// </summary>
        private async Task ExecuteScriptAsync(SqlConnection connection, string script, string scriptName)
        {
            try
            {
                Console.WriteLine($"Executing script: {scriptName}");
                await using var cmd = new SqlCommand(script, connection);
                cmd.CommandTimeout = 120; // 2 minutes timeout for large scripts
                await cmd.ExecuteNonQueryAsync();
                Console.WriteLine($"Successfully executed script: {scriptName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error executing script {scriptName}: {ex.Message}");
                throw new Exception($"Failed to execute {scriptName} script", ex);
            }
        }

        /// <summary>
        /// Retorna el objeto de conexión para usar en tus pruebas.
        /// </summary>
        internal SqlConnection GetSqlConnection() => new SqlConnection(_connectionString);

        /// <summary>
        /// Finaliza y elimina el contenedor.
        /// </summary>
        internal async Task Teardown()
        {
            try
            {
                await _dbContainer.StopAsync();
                await _dbContainer.DisposeAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during teardown: {ex.Message}");
            }
        }

        public Task StartAsync() => _dbContainer.StartAsync();
        public Task StopAsync() => _dbContainer.StopAsync();
    }
}
