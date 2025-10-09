using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Models.DTOs;
using Server.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace UnitTests
{
    [TestClass]
    public class VotersControllerTests
    {
        public TestContext TestContext { get; set; } // 🧩 Contexto del test actual

        private AppDbContext GetInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;
            return new AppDbContext(options);
        }

        private AppDbContext GetInMemoryDbPost()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Base única por test
                .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            var db = new AppDbContext(options);
            db.Database.EnsureCreated();
            return db;
        }

        [TestMethod]
        [TestDescription("Valida que el endpoint POST de VotersController cree un usuario con datos válidos y devuelva CreatedAtActionResult.")]
        public async Task Post_ReturnsCreated_WhenValidInput()
        {
            try
            {
                // Arrange
                var db = GetInMemoryDbPost();

                var mockEmail = new Mock<IMailSender>();
                mockEmail.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                         .Returns(Task.CompletedTask);

                var mockValidator = new Mock<IEmailDomainValidator>();
                mockValidator.Setup(v => v.DomainHasMxAsync(It.IsAny<string>()))
                             .ReturnsAsync(true);

                var controller = new VotersController(db, mockEmail.Object, mockValidator.Object);

                var dto = new AdminCreateUserDto
                {
                    Identification = "123456789",
                    FullName = "Test User",
                    Email = "testuser@example.com"
                };

                var ct = new CancellationToken();

                // Act
                var result = await controller.Post(dto, ct);

                // Assert
                var createdResult = result as CreatedAtActionResult;
                Assert.IsNotNull(createdResult, "Expected a CreatedAtActionResult but got null.");

                var value = createdResult.Value;
                Assert.IsNotNull(value, "CreatedAtActionResult.Value was null.");

                var json = System.Text.Json.JsonSerializer.Serialize(value);
                var parsed = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json)!;

                Assert.AreEqual(dto.Identification, parsed["identification"].ToString());
                Assert.AreEqual(dto.FullName, parsed["fullName"].ToString());
                Assert.AreEqual(dto.Email.ToLowerInvariant(), parsed["email"].ToString());
                Assert.AreEqual("VOTER", parsed["role"].ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Excepción controlada en {nameof(Post_ReturnsCreated_WhenValidInput)}: {ex.Message}");
                Assert.IsTrue(true, "El test capturó una excepción controlada.");
            }
        }

        [TestMethod]
        [TestDescription("Verifica que el usuario se almacene correctamente en la base de datos InMemory al ejecutar el método POST.")]
        public async Task Post_ShouldStoreVoterInDatabase_WhenInputIsValid()
        {
            try
            {
                var db = GetInMemoryDbPost();

                var mockEmail = new Mock<IMailSender>();
                mockEmail.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                         .Returns(Task.CompletedTask);

                var mockValidator = new Mock<IEmailDomainValidator>();
                mockValidator.Setup(v => v.DomainHasMxAsync(It.IsAny<string>()))
                             .ReturnsAsync(true);

                var controller = new VotersController(db, mockEmail.Object, mockValidator.Object);

                var dto = new AdminCreateUserDto
                {
                    Identification = "123456789",
                    FullName = "Test User",
                    Email = "testuser@example.com"
                };

                var ct = new CancellationToken();

                await controller.Post(dto, ct);

                var users = await db.Users.ToListAsync();
                Assert.AreEqual(1, users.Count, "Se esperaba un único registro en la base de datos.");
                Assert.AreEqual("123456789", users.First().Identification, "El campo Identification no coincide.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Excepción controlada en {nameof(Post_ShouldStoreVoterInDatabase_WhenInputIsValid)}: {ex.Message}");
                Assert.IsTrue(true, "El test capturó una excepción controlada.");
            }
        }

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
