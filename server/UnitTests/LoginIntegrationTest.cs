using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests
{
    [TestClass]
    public class LoginIntegrationTest
    {
        [Fact]
        [TestMethod]
        public void Login_ReturnsOk_WhenCredentialsAreValid()
        {
            //Arrange
            string identifi = "123456";
            var password = "Password123!";
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            const bool EXPECTED_TRUE = true;

            Moq.Mock<EleccionesUTN.IDatabase> bdMock = new Moq.Mock<EleccionesUTN.IDatabase>();
            bdMock.Setup(db => db.Login_ReturnsOk_WhenCredentialsAreValid(identifi,password)).Verifiable();

            //Act
            EleccionesUTN.LoginResult loginResult = new EleccionesUTN.LoginResult(bdMock.Object);
            bool resultado = loginResult.Login_ReturnsOk_WhenCredentialsAreValid(identifi, password);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, resultado);
        }

        [Fact]
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

            Moq.Mock<EleccionesUTN.IDatabase> bdMock = new Moq.Mock<EleccionesUTN.IDatabase>();
            bdMock.Setup(db => db.RegistrarUser(identifi, name, email, password, role)).Verifiable();
            //Act
            EleccionesUTN.LoginResult loginResult = new EleccionesUTN.LoginResult(bdMock.Object);
            bool resultado = loginResult.RegistrarUsers(identifi, name, email, password, role);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, resultado);

        }
    }
}
