using EleccionesUTN;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
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
                    .Build();   
        }


        /// <summary>
        /// Crear la base de datos y las tablas, esto debe ejecutarse una sola vez al inicio de las pruebas
        /// </summary>
        /// <returns></returns>
        internal async Task Setup()
        {
            await _db.StartAsync();

            string connestionString = _db.GetConnectionString();            
            
            await using var con = new NpgsqlConnection(connestionString);
            await con.OpenAsync();


            await using (var cmd = new NpgsqlCommand(Scripts.DDL, con))
                await cmd.ExecuteNonQueryAsync();


            await using (var s = new NpgsqlCommand(Scripts.Seed, con))
                await s.ExecuteNonQueryAsync();

            await using (var s = new NpgsqlCommand(Scripts.users, con))
                await s.ExecuteNonQueryAsync();
        }


        /// <summary>
        /// Retorna la base de datos configurada para las pruebas, que luego será pasada al constructor de Urna por medio 
        /// inyección de dependencias
        /// </summary>
        /// <returns></returns>
        internal PostgresDb GetPostgresDb() => new PostgresDb(_db.GetConnectionString());


        /// <summary>
        /// Libera todos los recursos de la base de datos, esto debe ejecutarse una sola vez al final de todas las pruebas
        /// </summary>
        /// <returns></returns>
        internal async Task Teardown() => await _db.DisposeAsync().AsTask();

        public Task StartAsync() => _db.StartAsync();
        public Task StopAsync() => _db.StopAsync();


    }
}
