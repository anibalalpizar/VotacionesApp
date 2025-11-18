using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Server.Controllers;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
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
        public TestContext TestContext { get; set; }

        public static AppDbContext GetInMemoryDb(string name)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(name)
                .Options;

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
            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

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

            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

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

            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

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

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que GetParticipation devuelve NotFound (404) cuando el ID de la elección especificado no existe en la base de datos.")]
        public async Task GetParticipation_ReturnsNotFound_WhenElectionDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetParticipation_ReturnsNotFound_WhenElectionDoesNotExist));
            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

            // Act
            var result = await controller.GetParticipation(999, CancellationToken.None);

            // Assert
            var notFound = result as NotFoundObjectResult;
            Assert.IsNotNull(notFound);
            Assert.AreEqual(404, notFound.StatusCode);
        }

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que GetParticipation devuelve BadRequest (400) cuando la elección aún no ha finalizado.")]
        public async Task GetParticipation_ReturnsBadRequest_WhenElectionNotEnded()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetParticipation_ReturnsBadRequest_WhenElectionNotEnded));

            db.Elections.Add(new Election
            {
                ElectionId = 1,
                Name = "Ongoing Election",
                StartDate = DateTimeOffset.UtcNow.AddDays(-1),
                EndDate = DateTimeOffset.UtcNow.AddHours(1) // Not ended yet
            });
            await db.SaveChangesAsync();

            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

            // Act
            var result = await controller.GetParticipation(1, CancellationToken.None);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            Assert.IsNotNull(badRequest);
            Assert.AreEqual(400, badRequest.StatusCode);
        }

        [TestMethod]
        [TestDescription("Verifica que GetParticipation devuelve Ok (200) con los datos de participación esperados cuando la elección ha finalizado, incluyendo el total de votantes, votos emitidos y porcentajes calculados de participación.")]
        public async Task GetParticipation_ReturnsOk_WithExpectedParticipationData()
        {
            // Arrange
            var db = GetInMemoryDb(nameof(GetParticipation_ReturnsOk_WithExpectedParticipationData));

            // Add finished election
            var election = new Election
            {
                ElectionId = 1,
                Name = "Finalized Election",
                StartDate = DateTimeOffset.UtcNow.AddDays(-5),
                EndDate = DateTimeOffset.UtcNow.AddDays(-1)
            };
            db.Elections.Add(election);

            // Add voters with required fields populated
            db.Users.AddRange(
                new User
                {
                    UserId = 1,
                    Role = UserRole.VOTER,
                    Email = "voter1@example.com",
                    FullName = "Voter 1",
                    Identification = "ID1",
                    PasswordHash = "hash1"
                },
                new User
                {
                    UserId = 2,
                    Role = UserRole.VOTER,
                    Email = "voter2@example.com",
                    FullName = "Voter 2",
                    Identification = "ID2",
                    PasswordHash = "hash2"
                },
                new User
                {
                    UserId = 3,
                    Role = UserRole.VOTER,
                    Email = "voter3@example.com",
                    FullName = "Voter 3",
                    Identification = "ID3",
                    PasswordHash = "hash3"
                }
            );

            // Add votes (2 of 3 voted)
            db.Votes.AddRange(
                new Vote { VoteId = 1, ElectionId = 1, VoterId = 1 },
                new Vote { VoteId = 2, ElectionId = 1, VoterId = 2 }
            );

            await db.SaveChangesAsync();

            var mockAudit = new Mock<IAuditService>();
            var controller = new ResultsController(db, mockAudit.Object);

            // Act
            var result = await controller.GetParticipation(1, CancellationToken.None);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.IsNotNull(okResult);

            var dto = okResult.Value as ParticipationReportDto;
            Assert.IsNotNull(dto);

            Assert.AreEqual(3, dto.TotalVoters);
            Assert.AreEqual(2, dto.TotalVoted);
            Assert.AreEqual(1, dto.NotParticipated);
            Assert.AreEqual(66.67, dto.ParticipationPercent);
            Assert.AreEqual(33.33, dto.NonParticipationPercent);
            Assert.IsTrue(dto.IsClosed);
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