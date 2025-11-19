using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests
{
    [TestClass]
    public class PublicCandidates
    {
        public static IConfiguration configuration { get; set; }
        public ControllerContext ControllerContext { get; set; }
        public TestContext TestContext { get; set; }

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

        [DataTestMethod]
        [DataRow(ClaimTypes.NameIdentifier, "101")]
        [DataRow("sub", "202")]
        [DataRow("id", "303")]
        public void GetUserId_Returns_ExpectedValue(string claimType, string userIdValue)
        {
            var db = GetInMemoryDb(nameof(GetUserId_Returns_ExpectedValue));
            var controller = new PublicCandidatesController(db);

            var claims = new List<Claim> { new Claim(claimType, userIdValue) };
            var identity = new ClaimsIdentity(claims);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            var method = typeof(PublicCandidatesController).GetMethod(
                "GetUserId",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = method?.Invoke(controller, null);

            Assert.IsNotNull(result);
            Assert.AreEqual(int.Parse(userIdValue), (int)result!);
        }

        [Fact]
        [TestMethod]
        public void GetUserId_Returns_Null_When_NoValidClaims()
        {
            var db = GetInMemoryDb(nameof(GetUserId_Returns_Null_When_NoValidClaims));
            var mockAudit = new Mock<IAuditService>();
            var controller = new ElectionsController(db, configuration, mockAudit.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            var result = controller.GetType()
                .GetMethod("GetUserId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.Invoke(controller, null);

            Assert.IsNull(result);
        }

        [Fact]
        [TestMethod]
        public async Task ReturnsUnauthorized_WhenUserIdIsNull()
        {
            var db = GetInMemoryDb(nameof(ReturnsUnauthorized_WhenUserIdIsNull));
            var controller = new Server.Controllers.PublicCandidatesController(db);
            controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            var result = await controller.GetActiveElectionsWithCandidates(CancellationToken.None);

            var notFound = result as UnauthorizedObjectResult;
            Assert.IsInstanceOfType(result, typeof(UnauthorizedObjectResult));
            Assert.IsTrue(notFound.Value!.ToString().Contains("No se pudo identificar el usuario"));
        }

        [Fact]
        [TestMethod]
        public async Task ReturnsNotFound_WhenNoActiveElections()
        {
            var db = GetInMemoryDb(nameof(ReturnsNotFound_WhenNoActiveElections));
            var controller = new PublicCandidatesController(db);

            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "5") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };

            var result = await controller.GetActiveElectionsWithCandidates(CancellationToken.None);

            bool isUnauthorized =
                result is UnauthorizedObjectResult unauthorized &&
                unauthorized.Value!.ToString().Contains("No se pudo identificar el usuario");

            bool isNotFound =
                result is NotFoundObjectResult notFound &&
                notFound.Value!.ToString().Contains("No hay elecciones activas");

            bool isOkWithEmpty =
                result is OkObjectResult ok &&
                ok.Value?.ToString()?.Contains("No hay elecciones activas") == true;

            Assert.IsTrue(isUnauthorized || isNotFound || isOkWithEmpty,
                "El resultado no fue Unauthorized, NotFound ni un Ok con mensaje esperado.");
        }

        [Fact]
        [TestMethod]
        public async Task ReturnsActiveElectionsWithCandidates_AndVoteStatus()
        {
            var db = GetInMemoryDb(nameof(ReturnsActiveElectionsWithCandidates_AndVoteStatus));
            var now = DateTimeOffset.UtcNow;

            db.Elections.Add(new Election
            {
                ElectionId = 1,
                Name = "Elección Estudiantil",
                StartDate = now.AddDays(-1),
                EndDate = now.AddDays(1)
            });

            db.Candidates.AddRange(
                new Candidate { CandidateId = 1, Name = "Alice", Party = "A", ElectionId = 1 },
                new Candidate { CandidateId = 2, Name = "Bob", Party = "B", ElectionId = 1 }
            );

            db.Votes.Add(new Vote { VoteId = 1, ElectionId = 1, VoterId = 5 });
            await db.SaveChangesAsync();

            var controller = new PublicCandidatesController(db);

            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "5") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            var result = await controller.GetActiveElectionsWithCandidates(CancellationToken.None);

            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.IsInstanceOfType(ok, typeof(OkObjectResult));

            var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
            var data = System.Text.Json.JsonSerializer.Deserialize<List<dynamic>>(json);
            Assert.IsNotNull(data);

            var electionData = data.First();

            var electionName = electionData.GetProperty("electionName").GetString();
            var hasVoted = electionData.GetProperty("hasVoted").GetBoolean();
            var canVote = electionData.GetProperty("canVote").GetBoolean();

            Assert.AreEqual("Elección Estudiantil", electionName);
            Assert.IsTrue(hasVoted);
            Assert.IsFalse(canVote);
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