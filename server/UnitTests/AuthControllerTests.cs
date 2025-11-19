using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using server.DTOs;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Models.DTOs;
using Server.Services;
using Server.Utils;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace UnitTests
{
    // 🔹 Atributo personalizado para documentar cada test
    [AttributeUsage(AttributeTargets.Method, Inherited = false)]
    public sealed class TestDescriptionAttribute : Attribute
    {
        public string Description { get; }

        public TestDescriptionAttribute(string description)
        {
            Description = description;
        }
    }

    [TestClass]
    public class AuthControllerTests
    {
        private readonly Mock<AppDbContext> _mockDb;
        private readonly Mock<IJwtTokenService> _mockJwt;
        private readonly Mock<IMailSender> _mockEmail;
        private readonly Mock<IAuditService> _mockAudit;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDb")
                .Options;

            using var context = new AppDbContext(options);
            _mockDb = new Mock<AppDbContext>(options);
            _mockJwt = new Mock<IJwtTokenService>();
            _mockEmail = new Mock<IMailSender>();
            _mockAudit = new Mock<IAuditService>();

            _controller = new AuthController(context, _mockJwt.Object, _mockEmail.Object, _mockAudit.Object);
        }

        // ---------------------------------------------------------------------
        // ✅ TEST LOGIN
        // ---------------------------------------------------------------------

        [TestMethod]
        [TestDescription("Valida que el endpoint de Login retorne un token JWT y los datos del usuario cuando las credenciales son válidas.")]
        public async Task Login_ReturnsOk_WhenCredentialsAreValid()
        {
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
            var mockAudit = new Mock<IAuditService>();
            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object, mockAudit.Object);

            var req = new LoginRequest
            {
                UserOrEmail = "test@mail.com",
                Password = password
            };

            var result = await controller.Login(req);

            var okResult = result as OkObjectResult;
            Assert.IsNotNull(okResult, "El resultado no es OkObjectResult");

            var resp = okResult.Value as LoginResponse;
            Assert.IsNotNull(resp, "El valor devuelto no es LoginResponse");

            Assert.AreEqual("fake-jwt-token", resp.Token);
            Assert.AreEqual("test@mail.com", resp.User.Email);

        }

        [TestMethod]
        [TestDescription("Verifica que el login retorne un error 401 (Unauthorized) cuando las credenciales son incorrectas.")]
        public async Task Login_ReturnsUnauthorized_WhenInvalidCredentials()
        {
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
            var mockAudit = new Mock<IAuditService>();
            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object, mockAudit.Object);

            var req = new LoginRequest
            {
                UserOrEmail = "user@test.com",
                Password = "WrongPassword!"
            };

            var result = await controller.Login(req);

            var unauthorized = result as UnauthorizedObjectResult;
            Assert.IsNotNull(unauthorized, "El resultado no es UnauthorizedObjectResult");
            StringAssert.Contains(unauthorized.Value.ToString(), "Credenciales inválidas");
        }

        // ---------------------------------------------------------------------
        // ✅ TEST CHANGE PASSWORD
        // ---------------------------------------------------------------------

        [TestMethod]
        [TestDescription("Comprueba que el usuario pueda cambiar su contraseña correctamente cuando la contraseña temporal es válida.")]
        public async Task ChangePassword_ReturnsOk_WhenTemporalPasswordIsValid()
        {
            var tempPassword = "Temp123!";
            var tempHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            var newPassword = "NewPassword1!";

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDbChangePassword")
                .Options;

            using var context = new AppDbContext(options);

            context.Users.Add(new User
            {
                UserId = 1,
                FullName = "John Doe",
                Email = "john@example.com",
                Identification = "123456789",
                PasswordHash = "dummyhash",
                TemporalPassword = tempHash
            });
            await context.SaveChangesAsync();

            var mockJwt = new Mock<IJwtTokenService>();
            var mockEmail = new Mock<IMailSender>();
            var mockAudit = new Mock<IAuditService>();
            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object, mockAudit.Object);

            var req = new ChangePasswordRequest
            {
                UserId = 1,
                TemporalPassword = tempPassword,
                NewPassword = newPassword
            };

            var result = await controller.ChangePassword(req, CancellationToken.None);

            var okResult = result as OkObjectResult;
            StringAssert.Contains(okResult.Value.ToString(), "Contraseña cambiada con éxito");
        }

        [TestMethod]
        [TestDescription("Valida que el cambio de contraseña falle con BadRequest cuando la nueva contraseña no cumple los requisitos mínimos de formato.")]
        public async Task ChangePassword_ReturnsBadRequest_WhenInvalidPasswordFormat()
        {
            var req = new ChangePasswordRequest
            {
                UserId = 1,
                TemporalPassword = "Temp123!",
                NewPassword = "abc"
            };

            try
            {
                // Act
                var result = await _controller.ChangePassword(req, CancellationToken.None);

                // Assert - si devuelve un resultado BadRequest, lo validamos
                if (result is BadRequestObjectResult bad)
                {
                    StringAssert.Contains(bad.Value.ToString(), "No cumple con los requisitos");
                    Console.WriteLine("✅ Se devolvió BadRequest con el mensaje esperado.");
                }
                else
                {
                    Assert.Fail("❌ No se devolvió BadRequest como se esperaba.");
                }
            }
            catch (Exception ex)
            {
                // Si lanza una excepción controlada, también se considera válido
                StringAssert.Contains(ex.Message, "No cumple", "El mensaje de error no coincide con el esperado.");
                Console.WriteLine($"⚠️ Excepción controlada recibida: {ex.Message}");
            }
        }

        // ---------------------------------------------------------------------
        // ✅ TEST FORGOT PASSWORD
        // ---------------------------------------------------------------------

        [TestMethod]
        [TestDescription("Verifica que el endpoint de recuperación de contraseña (ForgotPassword) responda correctamente cuando el correo existe y es válido.")]
        public async Task ForgotPassword_ReturnsOk_WhenEmailIsValid()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDbForgotPassword")
                .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            using var context = new AppDbContext(options);
            context.Users.Add(new User
            {
                UserId = 1,
                Email = "test@mail.com",
                FullName = "Test User",
                Identification = "123456789",
                PasswordHash = "dummyhash"
            });
            await context.SaveChangesAsync();

            var mockJwt = new Mock<IJwtTokenService>();
            var mockEmail = new Mock<IMailSender>();
            mockEmail.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                     .Returns(Task.CompletedTask);
            var mockAudit = new Mock<IAuditService>();

            var controller = new AuthController(context, mockJwt.Object, mockEmail.Object, mockAudit.Object);

            var req = new ForgotPasswordRequest
            {
                Email = "test@mail.com"
            };

            var result = await controller.ForgotPassword(req, CancellationToken.None);

            var ok = result as OkObjectResult;
            StringAssert.Contains(ok.Value.ToString(), "Si el correo existe");
        }

        [TestMethod]
        [TestDescription("Comprueba que el endpoint ForgotPassword devuelva BadRequest cuando el formato del correo es inválido.")]
        public async Task ForgotPassword_ReturnsBadRequest_WhenEmailFormatIsInvalid()
        {
            var req = new ForgotPasswordRequest
            {
                Email = "invalid-email"
            };

            var result = await _controller.ForgotPassword(req, CancellationToken.None);

            var bad = result as BadRequestObjectResult;
            StringAssert.Contains(bad.Value.ToString(), "no tiene un formato válido");
        }

        // ---------------------------------------------------------------------
        // 🔎 Contexto y limpieza
        // ---------------------------------------------------------------------

        public TestContext TestContext { get; set; }

        [TestCleanup]
        public void TestCleanup()
        {
            var testName = TestContext.TestName;
            var testMethod = GetType().GetMethod(testName);
            var descriptionAttr = testMethod?.GetCustomAttributes(typeof(TestDescriptionAttribute), false)
                                            .FirstOrDefault() as TestDescriptionAttribute;

            var description = descriptionAttr?.Description ?? "Sin descripción.";

            if (TestContext.CurrentTestOutcome == UnitTestOutcome.Passed)
            {
                Console.WriteLine($"✅ {testName} completado correctamente.");
            }
            else
            {
                Console.WriteLine($"❌ {testName} falló ({TestContext.CurrentTestOutcome}).");
            }

            Console.WriteLine($"📝 Descripción: {description}");
            Console.WriteLine(new string('-', 80));
        }
    }
}
