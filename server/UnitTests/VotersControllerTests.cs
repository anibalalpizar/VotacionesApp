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
using System.Threading;
using System.Threading.Tasks;

namespace UnitTests
{
    [TestClass]
    public class VotersControllerTests
    {
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
        public async Task Post_ReturnsCreated_WhenValidInput()
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

            // Convert to JSON for easier inspection
            var json = System.Text.Json.JsonSerializer.Serialize(value);
            var parsed = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json)!;

            Assert.AreEqual(dto.Identification, parsed["identification"].ToString());
            Assert.AreEqual(dto.FullName, parsed["fullName"].ToString());
            Assert.AreEqual(dto.Email.ToLowerInvariant(), parsed["email"].ToString());
            Assert.AreEqual("VOTER", parsed["role"].ToString());
        }

        [TestMethod]
        public async Task Post_ShouldStoreVoterInDatabase_WhenInputIsValid()
        {
            var db = GetInMemoryDbPost();

            var mockEmail = new Mock<IMailSender>();
            mockEmail.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                     .Returns(Task.CompletedTask);

            var mockValidator = new Mock<IEmailDomainValidator>();
            mockValidator.Setup(v => v.DomainHasMxAsync(It.IsAny<string>()))
                         .ReturnsAsync(true);

            var controller = new VotersController(db, mockEmail.Object, mockValidator.Object);

            // Reutilizar la misma lógica que el primer test
            var dto = new AdminCreateUserDto
            {
                Identification = "123456789",
                FullName = "Test User",
                Email = "testuser@example.com"
            };

            var ct = new CancellationToken();

            await controller.Post(dto, ct); // 🔄 Crea el usuario como en el primer test

            // Ahora verificamos que exista
            var users = await db.Users.ToListAsync();
            Assert.AreEqual(1, users.Count);
            Assert.AreEqual("123456789", users.First().Identification);
        }
    }
}
