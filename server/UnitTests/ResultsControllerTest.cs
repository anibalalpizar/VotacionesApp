using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Server.Controllers;
using Server.Data;
using Server.DTOs;
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
    public class ResultsControllerTest
    {
        public static IConfiguration configuration { get; set; }

        public ControllerContext ControllerContext { get; set; }

        public TestContext TestContext { get; set; } // 🧩 Contexto del test actual


        public static AppDbContext GetInMemoryDb(string name)
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

        [TestMethod]
        [Fact]
        [TestDescription("Verifica que se devuelva NotFound (404) cuando la elección no existe en la base de datos.")]
        public async Task GetResults_ReturnsNotFound_WhenElectionDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetResults_ReturnsNotFound_WhenElectionDoesNotExist));
            var controller = new ResultsController(db);

            // Act
            var result = await controller.GetResults(999, CancellationToken.None);

            // Assert
            var notFound = result as NotFoundObjectResult;
            Assert.IsNotNull(notFound);
            Assert.AreEqual(StatusCodes.Status404NotFound, notFound.StatusCode);
            Assert.IsTrue(notFound.Value!.ToString().Contains("La elección no existe."));
        }

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que se devuelva Forbidden (403) cuando la elección aún no ha finalizado.")]
        public async Task GetResults_ReturnsForbidden_WhenElectionNotClosed()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetResults_ReturnsForbidden_WhenElectionNotClosed));
            var now = DateTimeOffset.UtcNow;

            db.Elections.Add(new Election
            {
                ElectionId = 1,
                Name = "Elección Activa",
                StartDate = now.AddDays(-2),
                EndDate = now.AddDays(1) // Aún no termina
            });
            await db.SaveChangesAsync();

            var controller = new ResultsController(db);

            // Act
            var result = await controller.GetResults(1, CancellationToken.None);

            // Assert
            var forbidden = result as ObjectResult;
            Assert.IsNotNull(forbidden);
            Assert.AreEqual(StatusCodes.Status403Forbidden, forbidden.StatusCode);
            Assert.IsTrue(forbidden.Value!.ToString().Contains("Los resultados solo pueden consultarse cuando la elección esté cerrada."));
        }

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que se devuelva OK (200) con los resultados correctos cuando la elección está cerrada.")]
        public async Task GetResults_ReturnsOk_WithResults_WhenElectionClosed()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetResults_ReturnsOk_WithResults_WhenElectionClosed));
            var now = DateTimeOffset.UtcNow;

            var election = new Election
            {
                ElectionId = 1,
                Name = "Elección Cerrada",
                StartDate = now.AddDays(-10),
                EndDate = now.AddDays(-1)
            };

            db.Elections.Add(election);

            var candidate1 = new Candidate { CandidateId = 1, Name = "Alice", Party = "A", ElectionId = 1 };
            var candidate2 = new Candidate { CandidateId = 2, Name = "Bob", Party = "B", ElectionId = 1 };

            db.Candidates.AddRange(candidate1, candidate2);

            db.Votes.AddRange(
                new Vote { VoteId = 1, ElectionId = 1, CandidateId = 1, VoterId = 10 },
                new Vote { VoteId = 2, ElectionId = 1, CandidateId = 1, VoterId = 11 },
                new Vote { VoteId = 3, ElectionId = 1, CandidateId = 2, VoterId = 12 }
            );

            await db.SaveChangesAsync();

            var controller = new ResultsController(db);

            // Act
            var result = await controller.GetResults(1, CancellationToken.None);

            // Assert
            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreEqual(StatusCodes.Status200OK, ok.StatusCode);

            var dto = ok.Value as ElectionResultDto;
            Assert.IsNotNull(dto);
            Assert.IsTrue(dto.IsClosed);
            Assert.AreEqual(3, dto.TotalVotes);
            Assert.AreEqual(2, dto.TotalCandidates);
            Assert.AreEqual("Elección Cerrada", dto.ElectionName);
            Assert.AreEqual("Alice", dto.Items.First().Name);
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
