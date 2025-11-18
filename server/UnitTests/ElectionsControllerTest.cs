using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Server.Controllers;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests
{
    [TestClass]
    public class ElectionsControllerTest
    {
        public TestContext TestContext { get; set; } // 🧩 Contexto del test actual

        public static IConfiguration configuration { get; set; }

        private static AppDbContext GetInMemoryDb(string name)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(name)
                .Options;

            // Crear configuración en memoria
            var inMemorySettings = new Dictionary<string, string>
            {
                {"App:TimeZoneId", "Central Standard Time"}
            };

            configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            return new AppDbContext(options);
        }

        private static async Task SeedBasicData(AppDbContext db)
        {
            var e1 = new Election
            {
                ElectionId = 1,
                Name = "Presidencial",
                StartDate = DateTime.UtcNow.AddDays(-5),
                EndDate = DateTime.UtcNow.AddDays(5),
            };

            var e2 = new Election
            {
                ElectionId = 2,
                Name = "Municipal",
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(10),
            };

            db.Elections.AddRange(e1, e2);

            db.Candidates.Add(new Candidate { CandidateId = 1, Name = "Ana", Party = "Partido A", ElectionId = 1 });
            db.Votes.Add(new Vote { VoteId = 1, ElectionId = 1, CandidateId = 1 });

            await db.SaveChangesAsync();
        }

        // ────────────────────────────────────────────
        // POST: /api/elections
        // ────────────────────────────────────────────
        [TestMethod]
        public async Task Create_ReturnsCreated_WhenValid()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsCreated_WhenValid));
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            // Simular un Request con cabeceras
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.Request.Headers["X-Client-Offset"] = "0"; // UTC (sin desfase)

            var dto = new CreateElectionDto
            {
                Name = "Regional",
                StartDateUtc = DateTime.UtcNow.AddMinutes(10), // empieza dentro de 10 min
                EndDateUtc = DateTime.UtcNow.AddDays(1)
            };

            var result = await controller.Create(dto, CancellationToken.None);
            var created = result as CreatedAtActionResult;

            Assert.IsNotNull(created);
            var outDto = created.Value as ElectionDto;
            Assert.AreEqual("Regional", outDto!.Name);
            Assert.AreEqual("Scheduled", outDto.Status);
        }

        [TestMethod]
        public async Task Create_ReturnsBadRequest_WhenInvalidDates()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsBadRequest_WhenInvalidDates));
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            // Simular un Request con cabeceras
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.Request.Headers["X-Client-Offset"] = "0";

            var dto = new CreateElectionDto
            {
                Name = "Regional",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddHours(-1)
            };

            var result = await controller.Create(dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
        }

        [TestMethod]
        public async Task Create_ReturnsConflict_WhenDuplicateName()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsConflict_WhenDuplicateName));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.Request.Headers["X-Client-Offset"] = "0";

            var dto = new CreateElectionDto
            {
                Name = "Presidencial",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddDays(1)
            };

            var result = await controller.Create(dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(ConflictObjectResult));
        }

        [TestMethod]
        public async Task GetAll_ReturnsOk_WithItems()
        {
            var db = GetInMemoryDb(nameof(GetAll_ReturnsOk_WithItems));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var result = await controller.GetAll(1, 20, CancellationToken.None);
            var ok = result as OkObjectResult;

            var value = ok.Value!;
            var totalProperty = value.GetType().GetProperty("total");
            Assert.IsNotNull(totalProperty);

            int total = (int)totalProperty.GetValue(value)!;
            Assert.AreEqual(2, total);
        }

        [TestMethod]
        public async Task GetById_ReturnsOk_WhenExists()
        {
            var db = GetInMemoryDb(nameof(GetById_ReturnsOk_WhenExists));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var result = await controller.GetById(1, CancellationToken.None);
            var ok = result as OkObjectResult;

            Assert.IsNotNull(ok);
            var dto = ok.Value as ElectionDto;
            Assert.AreEqual("Presidencial", dto!.Name);
        }

        [TestMethod]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            var db = GetInMemoryDb(nameof(GetById_ReturnsNotFound_WhenMissing));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var result = await controller.GetById(99, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundResult));
        }

        [TestMethod]
        public async Task Update_ReturnsOk_WhenValid()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsOk_WhenValid));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.Request.Headers["X-Client-Offset"] = "0";

            var dto = new UpdateElectionDto
            {
                Name = "Presidencial 2025",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddDays(2)
            };

            var result = await controller.Update(1, dto, CancellationToken.None);
            var ok = result as OkObjectResult;

            Assert.IsNotNull(ok);
            var updated = ok.Value as ElectionDto;
            Assert.AreEqual("Presidencial 2025", updated!.Name);
        }

        [TestMethod]
        public async Task Update_ReturnsNotFound_WhenMissing()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsNotFound_WhenMissing));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var dto = new UpdateElectionDto
            {
                Name = "Nueva",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddDays(1),
            };

            var result = await controller.Update(99, dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundResult));
        }

        [TestMethod]
        public async Task Update_ReturnsConflict_WhenDuplicateName()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsConflict_WhenDuplicateName));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var dto = new UpdateElectionDto
            {
                Name = "Municipal",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddDays(2),
            };

            var result = await controller.Update(1, dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(ConflictObjectResult));
        }

        [TestMethod]
        public async Task Update_ReturnsBadRequest_WhenInvalidDateRange()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsBadRequest_WhenInvalidDateRange));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.Request.Headers["X-Client-Offset"] = "0";

            var dto = new UpdateElectionDto
            {
                Name = "Test",
                StartDateUtc = DateTime.UtcNow,
                EndDateUtc = DateTime.UtcNow.AddHours(-1),
            };

            var result = await controller.Update(1, dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
        }

        [TestMethod]
        public async Task Delete_ReturnsOk_WhenNoDependencies()
        {
            var db = GetInMemoryDb(nameof(Delete_ReturnsOk_WhenNoDependencies));
            await SeedBasicData(db);

            db.Votes.RemoveRange(db.Votes);
            db.Candidates.RemoveRange(db.Candidates);
            await db.SaveChangesAsync();

            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);
            var result = await controller.Delete(1, CancellationToken.None);

            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);

            var selector = ok.Value!;
            var value = selector.GetType().GetProperty("message");
            Assert.IsNotNull(value);

            string msg = (string)value.GetValue(selector);
            Assert.AreEqual("La elección fue eliminada con éxito.", msg);
        }

        [TestMethod]
        public async Task Delete_ReturnsBadRequest_WhenHasVotes()
        {
            var db = GetInMemoryDb(nameof(Delete_ReturnsBadRequest_WhenHasVotes));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var result = await controller.Delete(1, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
        }

        [TestMethod]
        public async Task Delete_ReturnsNotFound_WhenMissing()
        {
            var db = GetInMemoryDb(nameof(Delete_ReturnsNotFound_WhenMissing));
            await SeedBasicData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);

            var result = await controller.Delete(99, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundResult));
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