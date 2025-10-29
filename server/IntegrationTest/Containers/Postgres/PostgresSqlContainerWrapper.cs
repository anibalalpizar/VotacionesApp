using EleccionesUTN;
using Npgsql;
using System;
using System.Threading.Tasks;
using Testcontainers.PostgreSql;

namespace IntegrationTest
{
    internal class PostgresSqlContainerWrapper
    {
        private readonly PostgreSqlContainer _db;

        /// <summary>
        /// Crear una nueva instancia de la base de datos en un contenedor Docker con la configuración para las pruebas
        /// </summary>
        public PostgresSqlContainerWrapper()
        {
            _db = new PostgreSqlBuilder()
                    .WithDatabase("EleccionesUTNDb")
                    .WithUsername("grupo")
                    .WithPassword("123456")
                    .WithImage("postgres:15.1")
                    .WithCleanUp(true)
                    .Build();
        }

        /// <summary>
        /// Crear la base de datos y las tablas, esto debe ejecutarse una sola vez al inicio de las pruebas
        /// </summary>
        /// <returns></returns>
        internal async Task Setup()
        {
            await _db.StartAsync();
            string connectionString = _db.GetConnectionString();

            await using var con = new NpgsqlConnection(connectionString);
            await con.OpenAsync();

            await using var transaction = await con.BeginTransactionAsync();
            try
            {
                await using (var cmd = new NpgsqlCommand(Scripts.Users, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.Elections, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.Candidates, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.Votes, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.AuditLog, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.Seed, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.DDL, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await using (var cmd = new NpgsqlCommand(Scripts.SeedLegacy, con, transaction))
                    await cmd.ExecuteNonQueryAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Retorna la base de datos configurada para las pruebas, que luego será pasada al constructor de Urna por medio 
        /// inyección de dependencias
        /// </summary>
        /// <returns></returns>
        internal PostgresDb GetPostgresDb() => new PostgresDb(_db.GetConnectionString());

        /// <summary>
        /// Obtiene el connection string para uso directo en tests
        /// </summary>
        /// <returns></returns>
        internal string GetConnectionString() => _db.GetConnectionString();

        /// <summary>
        /// Libera todos los recursos de la base de datos, esto debe ejecutarse una sola vez al final de todas las pruebas
        /// </summary>
        /// <returns></returns>
        internal async Task Teardown() => await _db.DisposeAsync().AsTask();
    }
}