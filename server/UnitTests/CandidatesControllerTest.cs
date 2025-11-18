using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Server.Controllers;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace UnitTests
{
    [TestClass]
    public class CandidatesControllerTest
    {
        public TestContext TestContext { get; set; } // 🧩 Contexto del test actual

        private static AppDbContext GetInMemoryDb(string name)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(name)
                .Options;
            return new AppDbContext(options);
        }

        private static async Task SeedSampleData(AppDbContext db)
        {
            var election = new Election
            {
                ElectionId = 1,
                Name = "Elección Nacional",
                StartDate = DateTime.Now,          // O la fecha que sea apropiada
                EndDate = DateTime.Now.AddDays(1)  // O la fecha que sea apropiada
            };

            db.Elections.Add(election);

            db.Candidates.AddRange(
                new Candidate { CandidateId = 1, Name = "Carlos", Party = "Partido A", ElectionId = 1 },
                new Candidate { CandidateId = 2, Name = "Ana", Party = "Partido B", ElectionId = 1 }
            );

            await db.SaveChangesAsync();
        }

        // ───────────────────────────────
        // GET: api/candidates
        // ───────────────────────────────
        [TestMethod]
        [TestDescription("Verifica que la obtención de todos los candidatos con paginación devuelva un estado OK y el total correcto.")]
        public async Task GetAll_ReturnsCandidates_WhenExists()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetAll_ReturnsCandidates_WhenExists));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            // Act
            var result = await controller.GetAll(null, 1, 20, CancellationToken.None);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.IsNotNull(okResult);

            var value = okResult.Value!;
            var totalProperty = value.GetType().GetProperty("total");
            Assert.IsNotNull(totalProperty);

            int total = (int)totalProperty.GetValue(value)!;
            Assert.AreEqual(2, total);

        }

        // ───────────────────────────────
        // GET: api/candidates/{id}
        // ───────────────────────────────
        [TestMethod]
        [TestDescription("Verifica que la obtención de un candidato por ID devuelva un estado OK cuando el candidato existe.")]
        public async Task GetById_ReturnsOk_WhenCandidateExists()
        {
            var db = GetInMemoryDb(nameof(GetById_ReturnsOk_WhenCandidateExists));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var result = await controller.GetById(1, CancellationToken.None);

            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);

            var selector = ok.Value!;
            var value = selector.GetType().GetProperty("Name");
            Assert.IsNotNull(value);

            string valueString = (string)value.GetValue(selector)!;
            Assert.AreEqual("Carlos", valueString);
        }

        [TestMethod]
        [TestDescription("Verifica que la obtención de un candidato por ID devuelva un NotFound cuando el candidato no existe.")]
        public async Task GetById_ReturnsNotFound_WhenCandidateDoesNotExist()
        {
            var db = GetInMemoryDb(nameof(GetById_ReturnsNotFound_WhenCandidateDoesNotExist));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var result = await controller.GetById(99, CancellationToken.None);

            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        }

        // ───────────────────────────────
        // POST: api/candidates
        // ───────────────────────────────
        [TestMethod]
        [TestDescription("Verifica que la creación de un candidato con datos válidos devuelva un Created.")]
        public async Task Create_ReturnsCreated_WhenValidData()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsCreated_WhenValidData));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateCreateDto
            {
                ElectionId = 1,
                Name = "Luis",
                Party = "Partido C"
            };

            var result = await controller.Create(dto, CancellationToken.None);

            var created = result as CreatedAtActionResult;
            Assert.IsNotNull(created);
            dynamic item = created.Value;
            // Convert to Candidate or use JSON-like comparison
            var json = System.Text.Json.JsonSerializer.Serialize(item);
            StringAssert.Contains(json, "\"Luis\"");

        }

        [TestMethod]
        [TestDescription("Verifica que la creación de un candidato sin nombre devuelva un BadRequest.")]
        public async Task Create_ReturnsBadRequest_WhenMissingName()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsBadRequest_WhenMissingName));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateCreateDto { ElectionId = 1, Party = "Partido X" };

            var result = await controller.Create(dto, CancellationToken.None);

            Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
        }

        [TestMethod]
        [TestDescription("Verifica que la creación de un candidato para una elección que no existe devuelva un NotFound.")]
        public async Task Create_ReturnsNotFound_WhenElectionDoesNotExist()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsNotFound_WhenElectionDoesNotExist));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateCreateDto
            {
                ElectionId = 99,
                Name = "Nuevo",
                Party = "Partido D"
            };

            var result = await controller.Create(dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        }

        [TestMethod]
        [TestDescription("Verifica que la creación de un candidato duplicado (mismo nombre en la misma elección) devuelva un Conflict.")]
        public async Task Create_ReturnsConflict_WhenDuplicateCandidate()
        {
            var db = GetInMemoryDb(nameof(Create_ReturnsConflict_WhenDuplicateCandidate));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateCreateDto
            {
                ElectionId = 1,
                Name = "Carlos",
                Party = "Partido A"
            };

            var result = await controller.Create(dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(ConflictObjectResult));
        }

        // ───────────────────────────────
        // PUT: api/candidates/{id}
        // ───────────────────────────────
        [TestMethod]
        [TestDescription("Verifica que la actualización de un candidato con datos válidos devuelva un Ok.")]
        public async Task Update_ReturnsOk_WhenValidChanges()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsOk_WhenValidChanges));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateUpdateDto
            {
                Name = "Carlos Editado",
                Party = "Partido A+"
            };

            var result = await controller.Update(1, dto, CancellationToken.None);
            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);

            var selector = ok.Value!;

            var value = selector.GetType().GetProperty("message");
            Assert.IsNotNull(value);

            string valueString = (string)value.GetValue(selector)!;
            Assert.AreEqual("El candidato se ha editado con éxito.", valueString);
        }

        [TestMethod]
        [TestDescription("Verifica que la actualización de un candidato que no existe devuelva un NotFound.")]
        public async Task Update_ReturnsNotFound_WhenCandidateDoesNotExist()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsNotFound_WhenCandidateDoesNotExist));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateUpdateDto { Name = "Fake", Party = "X" };

            var result = await controller.Update(99, dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        }

        [TestMethod]
        [TestDescription("Verifica que la actualización de un candidato para usar un nombre ya existente en la misma elección (duplicado) devuelva un Conflict.")]
        public async Task Update_ReturnsConflict_WhenDuplicateInElection()
        {
            var db = GetInMemoryDb(nameof(Update_ReturnsConflict_WhenDuplicateInElection));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var dto = new CandidateUpdateDto
            {
                Name = "Ana", // ya existe ese nombre en la misma elección
                Party = "Partido A"
            };

            var result = await controller.Update(1, dto, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(ConflictObjectResult));
        }

       // ───────────────────────────────
        // DELETE: api/candidates/{id}
        // ───────────────────────────────

        public record ApiMessage(string Message);

        [TestMethod]
        [TestDescription("Verifica que la eliminación de un candidato existente devuelva un Ok.")]
        public async Task Delete_ReturnsOk_WhenCandidateExists()
        {
            var db = GetInMemoryDb(nameof(Delete_ReturnsOk_WhenCandidateExists));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var result = await controller.Delete(1, CancellationToken.None);

            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);

            var msg = ok.Value as ApiMessage;
            StringAssert.Contains(ok.Value.ToString(), "El candidato se ha eliminado con éxito.");
        }

        [TestMethod]
        [TestDescription("Verifica que la eliminación de un candidato que no existe devuelva un NotFound.")]
        public async Task Delete_ReturnsNotFound_WhenCandidateDoesNotExist()
        {
            var db = GetInMemoryDb(nameof(Delete_ReturnsNotFound_WhenCandidateDoesNotExist));
            await SeedSampleData(db);
            var mockAudit = new Mock<IAuditService>();
            var controller = new CandidatesController(db, mockAudit.Object);

            var result = await controller.Delete(999, CancellationToken.None);
            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
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