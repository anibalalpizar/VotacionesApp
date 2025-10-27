using EleccionesUTN;
using EleccionesUTN.Exceptions;
using Npgsql;
using Org.BouncyCastle.Crypto.Generators;
using System.Threading.Tasks;
using Xunit;
using BCrypt.Net;
using Server.Models;

namespace IntegrationTest
{
    [TestClass]
    public class PostgresIntegrationTest : IAsyncLifetime
    {


        PostgresSqlContainerWrapper _postgresContainer;

        public PostgresIntegrationTest()
        {
            _postgresContainer = new PostgresSqlContainerWrapper();
        }


        //[TestInitialize]
        //public async Task Init()
        //{
        //    _postgresContainer = new PostgresSqlContainerWrapper();
        //    await _postgresContainer.StartAsync();
        //}

        //[TestCleanup]
        //public async Task Cleanup()
        //{
        //    await _postgresContainer.StopAsync();
        //}

        [TestInitialize]
        public async Task InitializeAsync()
        {
            await _postgresContainer.Setup();
        }

        public async Task DisposeAsync() => await _postgresContainer.Teardown();


        [TestMethod]
        public void RegistrarVotoValido_RetornaTrue_Test()
        {
            //Arrange
            string cedulaVotante = "101"; // Dennis Ritchie que no ha votado
            string cedulaCandidato = "902"; // Morpheus, candidato válido
            const bool EXPECTED_TRUE = true;

            //Act
            Urna _urna = new Urna(_postgresContainer.GetPostgresDb());
            bool result = _urna.RegistrarVoto(cedulaVotante, cedulaCandidato);


            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }




        [TestMethod]
        public void RegistrarVotoDuplicado_RetornaAlreadyVotedException_Test()
        {
            //Arrange
            string cedulaVotante = "101"; // Dennis Ritchie que no ha votado
            string cedulaCandidato = "902"; // Morpheus, candidato válido
            const bool EXPECTED_TRUE = true;

            //Act
            Urna _urna = new Urna(_postgresContainer.GetPostgresDb());
            bool result = _urna.RegistrarVoto(cedulaVotante, cedulaCandidato);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);

            Assert.ThrowsException<AlreadyVotedException>(() => _urna.RegistrarVoto(cedulaVotante, cedulaCandidato));
            
        }


        [TestMethod]
        public void RegistrarUsers()
        {
            //Arrange
            string identifi = "123456";

            var password = "Password123!";
            var email = "perezfloreskevin@gmail.com";
            var name = "Kevin Perez Flores";
            var role = UserRole.ADMIN;

            const bool EXPECTED_TRUE = true;

            LoginResult _loginResult = new LoginResult(_postgresContainer.GetPostgresDb());
            bool result = _loginResult.RegistrarUsers(identifi, name, email, password, role);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);

        }

        [TestMethod]
        public void Login_ReturnsOk_WhenCredentialsAreValid_Test()
        {
            //Arrange
            string identifi = "123456";

            var password = "Password123!";
            var hash = BCrypt.Net.BCrypt.HashPassword(password);


            const bool EXPECTED_TRUE = true;

            LoginResult _loginResult = new LoginResult(_postgresContainer.GetPostgresDb());
            bool result = _loginResult.Login_ReturnsOk_WhenCredentialsAreValid(identifi, hash);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);

        }

        [TestMethod]
        public void RegistroElecciones_Test()
        {
            //Arrange
            string nombreEleccion = "Eleccion Presidencial 2024";
            DateTime fechaInicio = new DateTime(2024, 11, 1);
            DateTime fechaFin = new DateTime(2024, 11, 30);
            string status = "Programada";
            int candidateCount = 5;
            int voteCount = 0;
            bool isActive = false;
            const bool EXPECTED_TRUE = true;
            Elecciones _elecciones = new Elecciones(_postgresContainer.GetPostgresDb());
            bool result = _elecciones.RegisrarElecciones(nombreEleccion, fechaInicio, fechaFin, status, candidateCount, voteCount, isActive);
            //Assert
            Assert.AreEqual(EXPECTED_TRUE, result);
        }

    }
}