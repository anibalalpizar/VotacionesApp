using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using server.DTOs;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Models.DTOs;
using Server.Services;
using Server.Utils;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;


namespace UnitTests
{
    [TestClass]
    public class AuthControllerTests
    {
        private readonly Mock<AppDbContext> _mockDb;
        private readonly Mock<IJwtTokenService> _mockJwt;
        private readonly Mock<IMailSender> _mockEmail;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            // 🔧 Inicializa los mocks

            var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb")
            .Options;

            using var context = new AppDbContext(options);
            _mockDb = new Mock<AppDbContext>(options);
            _mockJwt = new Mock<IJwtTokenService>();
            _mockEmail = new Mock<IMailSender>();

            // 🎯 Instancia del controlador bajo prueba
            _controller = new AuthController(context, _mockJwt.Object, _mockEmail.Object);
        }

        // ---------------------------------------------------------------------
        // ✅ TEST LOGIN
        // ---------------------------------------------------------------------

        [TestMethod]
        public async Task Login_ReturnsOk_WhenCredentialsAreValid()
        {
            // Arrange
            var password = "Password123!";
            var hash = BCrypt.Net.BCrypt.HashPassword(password);

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDbLogin")
                .Options;

            using var context = new AppDbContext(options);

            context.Users.Add(new User
            {
                UserId = 1,
                Email = "test@mail.com",
                Identification = "123456",
                FullName = "Test User",
                PasswordHash = hash,
                Role = UserRole.ADMIN
            });
            await context.SaveChangesAsync();

            var mockJwt = new Mock<IJwtTokenService>();
            mockJwt.Setup(j => j.CreateToken(It.IsAny<User>())).Returns("fake-jwt-token");
            mockJwt.SetupGet(j => j.ExpiresInSeconds).Returns(3600);

            var mockEmail = new Mock<IMailSender>();

            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object);

            var req = new LoginRequest
            {
                UserOrEmail = "test@mail.com",
                Password = password
            };

            // Act
            var result = await controller.Login(req);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.IsNotNull(okResult, "El resultado no es OkObjectResult");

            var resp = okResult.Value as LoginResponse;
            Assert.IsNotNull(resp, "El valor devuelto no es LoginResponse");

            Assert.AreEqual("fake-jwt-token", resp.Token);
            Assert.AreEqual("test@mail.com", resp.User.Email);
        }


        [TestMethod]
        public async Task Login_ReturnsUnauthorized_WhenInvalidCredentials()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDbLoginInvalid")
                .Options;

            using var context = new AppDbContext(options);
            context.Users.Add(new User
            {
                UserId = 1,
                Email = "user@test.com",
                Identification = "123",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword1!"),
                Role = UserRole.ADMIN
            });
            await context.SaveChangesAsync();

            var mockJwt = new Mock<IJwtTokenService>();
            var mockEmail = new Mock<IMailSender>();

            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object);

            var req = new LoginRequest
            {
                UserOrEmail = "user@test.com",
                Password = "WrongPassword!" // contraseña incorrecta
            };

            // Act
            var result = await controller.Login(req);

            // Assert
            var unauthorized = result as UnauthorizedObjectResult;
            Assert.IsNotNull(unauthorized, "El resultado no es UnauthorizedObjectResult");
            StringAssert.Contains(unauthorized.Value.ToString(), "Credenciales inválidas");
        }

        // ---------------------------------------------------------------------
        // ✅ TEST CHANGE PASSWORD
        // ---------------------------------------------------------------------

        [TestMethod]
        public async Task ChangePassword_ReturnsOk_WhenTemporalPasswordIsValid()
        {
            // Arrange
            var tempPassword = "Temp123!";
            var tempHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            var newPassword = "NewPassword1!";

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;

            // Crear contexto en memoria y agregar usuario de prueba
            using var context = new AppDbContext(options);

            context.Users.Add(new User
            {
                UserId = 1,
                FullName = "John Doe",
                Email = "john@example.com",          // obligatorio
                Identification = "123456789",        // obligatorio
                PasswordHash = "dummyhash",          // obligatorio, aunque no se use temporal
                TemporalPassword = tempHash
            });


            await context.SaveChangesAsync();

            // Mocks de dependencias externas
            var mockJwt = new Mock<IJwtTokenService>();
            var mockEmail = new Mock<IMailSender>();

            // Instanciar controlador con DbContext real
            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object);

            var req = new ChangePasswordRequest
            {
                UserId = 1,
                TemporalPassword = tempPassword,
                NewPassword = newPassword
            };

            // Act
            var result = await controller.ChangePassword(req, CancellationToken.None);

            // Assert
            var okResult = result as OkObjectResult;
            StringAssert.Contains(okResult.Value.ToString(), "Contraseña cambiada con éxito");
        }

        [TestMethod]
        public async Task ChangePassword_ReturnsBadRequest_WhenInvalidPasswordFormat()
        {
            // Arrange
            var req = new ChangePasswordRequest
            {
                UserId = 1,
                TemporalPassword = "Temp123!",
                NewPassword = "abc" // ❌ no cumple reglas
            };

            // Act
            var result = await _controller.ChangePassword(req, CancellationToken.None);

            // Assert
            var bad = result as BadRequestObjectResult;
            StringAssert.Contains(bad.Value.ToString(), "No cumple con los requisitos");

        }

        // ---------------------------------------------------------------------
        // ✅ TEST FORGOT PASSWORD
        // ---------------------------------------------------------------------

        [TestMethod]
        public async Task ForgotPassword_ReturnsOk_WhenEmailIsValid()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDbForgotPassword")
                .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning)) // <- aquí
                .Options;

            using var context = new AppDbContext(options);
            context.Users.Add(new User
            {
                UserId = 1,
                Email = "test@mail.com",
                FullName = "Test User",
                Identification = "123456789",   // obligatorio
                PasswordHash = "dummyhash"       // obligatorio
            });
            await context.SaveChangesAsync();

            var mockJwt = new Mock<IJwtTokenService>();
            var mockEmail = new Mock<IMailSender>();
            mockEmail.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                     .Returns(Task.CompletedTask);

            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object);

            var req = new ForgotPasswordRequest
            {
                Email = "test@mail.com"
            };

            // Act
            var result = await controller.ForgotPassword(req, CancellationToken.None);

            // Assert
            var ok = result as OkObjectResult;
            StringAssert.Contains(ok.Value.ToString(), "Si el correo existe");
        }

        [TestMethod]
        public async Task ForgotPassword_ReturnsBadRequest_WhenEmailFormatIsInvalid()
        {
            // Arrange
            var req = new ForgotPasswordRequest
            {
                Email = "invalid-email"
            };

            // Act
            var result = await _controller.ForgotPassword(req, CancellationToken.None);

            // Assert
            var bad = result as BadRequestObjectResult;
            StringAssert.Contains(bad.Value.ToString(), "no tiene un formato válido");
        }
    }
}
