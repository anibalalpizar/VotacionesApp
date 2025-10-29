using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using EleccionesUTN;
using Microsoft.Data.SqlClient;
using Renci.SshNet;
using System;
using System.Threading.Tasks;

namespace IntegrationTest
{
    internal class SqlServerContainerWrapper
    {
        private readonly IContainer _dbContainer;
        private string _connectionString = string.Empty;

        private readonly SqlServerContainerWrapper _db;

        public SqlServerContainerWrapper()
        {
            // Configuración básica del contenedor SQL Server
            _dbContainer = new ContainerBuilder()
                .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
                .WithEnvironment("ACCEPT_EULA", "Y")
                .WithEnvironment("SA_PASSWORD", "YourStrong!Passw0rd") // Debe cumplir políticas de complejidad
                .WithPortBinding(1433, true)
                .WithWaitStrategy(Wait.ForUnixContainer().UntilMessageIsLogged("SQL Server is now ready for client connections"))
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

            _connectionString = $"Server={host},{port};User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;Encrypt=False;";

            await using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            // Ejecuta scripts de creación de base de datos, tablas y seed (igual que en tu Postgres)
            await using (var cmd = new SqlCommand(ScriptsQLS.DDL, con))
                await cmd.ExecuteNonQueryAsync();

            await using (var cmd = new SqlCommand(ScriptsQLS.Seed, con))
                await cmd.ExecuteNonQueryAsync();

            await using (var cmd = new SqlCommand(ScriptsQLS.Users, con))
                await cmd.ExecuteNonQueryAsync();
        }

        /// <summary>
        /// Retorna el objeto de conexión para usar en tus pruebas.
        /// </summary>
        internal SqlConnection GetSqlConnection() => new SqlConnection(_connectionString);

        /// <summary>
        /// Finaliza y elimina el contenedor.
        /// </summary>
        internal async Task Teardown() => await _dbContainer.DisposeAsync().AsTask();

        public Task StartAsync() => _dbContainer.StartAsync();
        public Task StopAsync() => _dbContainer.StopAsync();
    }
}
