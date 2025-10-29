using EleccionesUTN;
using EleccionesUTN.Exceptions;
using Npgsql;
using System;
using System.Threading.Tasks;
using BCrypt.Net;
using Server.Models;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace IntegrationTest
{
    [TestClass]
    public class PostgresIntegrationTest
    {
        private static PostgresSqlContainerWrapper? _postgresContainer;

        private static SqlServerContainerWrapper? _sqlContainer;

        // Use ClassInitialize for one-time setup
        [ClassInitialize]
        public static async Task ClassInitialize(TestContext context)
        {
            _postgresContainer = new PostgresSqlContainerWrapper();
            _sqlContainer = new SqlServerContainerWrapper();
            await _sqlContainer.Setup();
            await _postgresContainer.Setup();
        }

        // Use ClassCleanup for one-time teardown
        [ClassCleanup]
        public static async Task ClassCleanup()
        {
            if (_postgresContainer != null)
            {
                await _postgresContainer.Teardown();
            }
            if (_sqlContainer != null)
            {
                await _sqlContainer.Teardown();
            }

        }

        [TestMethod]
        public void RegistrarVotoValido_RetornaTrue_Test()
        {
            //Arrange
            string cedulaVotante = "101"; // Dennis Ritchie que no ha votado
            string cedulaCandidato = "902"; // Morpheus, candidato válido
            const bool EXPECTED_TRUE = true;

            //Act
            Urna _urna = new Urna(_postgresContainer!.GetPostgresDb());
            bool result = _urna.RegistrarVoto(cedulaVotante, cedulaCandidato);


            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }

        [TestMethod]
        public void RegistrarVotoDuplicado_RetornaAlreadyVotedException_Test()
        {
            //Arrange
            string cedulaVotante = "103"; // Richard Stallman que no ha votado
            string cedulaCandidato = "901"; // Mr.Anderson, candidato válido
            const bool EXPECTED_TRUE = true;

            //Act
            Urna _urna = new Urna(_postgresContainer!.GetPostgresDb());
            bool result = _urna.RegistrarVoto(cedulaVotante, cedulaCandidato);

            if (result != EXPECTED_TRUE)
            {
                Assert.Fail("El primer voto debería haberse registrado correctamente.");
            }
            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }

        [TestMethod]
        public void RegistrarUsers_Test()
        {
            //Arrange
            string identifi = "789012";
            var password = "Password123!";
            var email = "test@example.com";
            var name = "Test User";
            var role = UserRole.ADMIN;
            const bool EXPECTED_TRUE = true;

            //Act
            LoginResult _loginResult = new LoginResult(_postgresContainer!.GetPostgresDb());
            bool result = _loginResult.RegistrarUsers(identifi, name, email, password, role);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }

        [TestMethod]
        public void Login_ReturnsOk_WhenCredentialsAreValid_Test()
        {
            //Arrange
            string identifi = "345678";
            var password = "Password123!";
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            const bool EXPECTED_TRUE = true;

            // First register the user
            LoginResult _loginResult = new LoginResult(_postgresContainer!.GetPostgresDb());
            _loginResult.RegistrarUsers(identifi, "Login Test User", "logintest@example.com", password, UserRole.ADMIN);

            //Act
            bool result = _loginResult.Login_ReturnsOk_WhenCredentialsAreValid(identifi, hash);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }

        [TestMethod]
        public void RegistroElecciones_Test()
        {
            //Arrange
            string nombreEleccion = "Eleccion Presidencial 2025";
            DateTime fechaInicio = new DateTime(2025, 11, 1);
            DateTime fechaFin = new DateTime(2025, 11, 30);

            //Act
            string connectionString = _postgresContainer!.GetConnectionString();
            int electionId = 0;

            using (var connection = new NpgsqlConnection(connectionString))
            {
                connection.Open();
                string insertQuery = """
                    INSERT INTO "Elections"("Name", "StartDate", "EndDate")
                    VALUES (@Name, @StartDate, @EndDate)
                    RETURNING "ElectionId";
                """;

                using (var cmd = new NpgsqlCommand(insertQuery, connection))
                {
                    cmd.Parameters.AddWithValue("Name", nombreEleccion);
                    cmd.Parameters.AddWithValue("StartDate", fechaInicio);
                    cmd.Parameters.AddWithValue("EndDate", fechaFin);

                    var result = cmd.ExecuteScalar();
                    electionId = Convert.ToInt32(result);
                }
            }

            //Assert
            Assert.IsTrue(electionId > 0, "La elección debe ser registrada con un ID válido");
        }
    }
}