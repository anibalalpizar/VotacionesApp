using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Server.Controllers;
using Server.Data;
using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests
{
    [TestClass]
    public class AuditControllerTest
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

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que GetAll retorna paginación correcta con total de registros e items filtrados por page y pageSize.")]
        public async Task GetAll_ReturnsPagedResults()
        {
            var db = GetInMemoryDb(nameof(GetAll_ReturnsPagedResults));

            // Arrange: Insertar 3 logs con un usuario
            var user = new User
            {
                UserId = 1,
                FullName = "Admin",
                Email = "admin@test.com",
                Identification = "12345",
                PasswordHash = "X"  // puede ser texto dummy
            };
            db.Users.Add(user);

            db.AuditLogs.AddRange(
                new AuditLog { AuditId = 1, Action = "Login", Timestamp = DateTime.UtcNow.AddMinutes(-1), UserId = 1 },
                new AuditLog { AuditId = 2, Action = "Create", Timestamp = DateTime.UtcNow.AddMinutes(-2), UserId = 1 },
                new AuditLog { AuditId = 3, Action = "Delete", Timestamp = DateTime.UtcNow.AddMinutes(-3), UserId = 1 }
            );

            await db.SaveChangesAsync();

            var controller = new AuditLogsController(db);

            // Act
            var result = await controller.GetAll(1, 2, CancellationToken.None);
            var ok = result as OkObjectResult;

            var json = JsonSerializer.Serialize(ok.Value);
            var root = JsonSerializer.Deserialize<JsonElement>(json);

            // Assert
            Assert.IsNotNull(ok);

            Assert.AreEqual(1, root.GetProperty("page").GetInt32());
            Assert.AreEqual(2, root.GetProperty("pageSize").GetInt32());
            Assert.AreEqual(3, root.GetProperty("total").GetInt32());

            var items = root.GetProperty("items").EnumerateArray();
            Assert.AreEqual(2, items.Count());
        }

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que GetByUser retorna solamente los registros de auditoría asociados al usuario solicitado.")]
        public async Task GetByUser_ReturnsUserLogs()
        {
            var db = GetInMemoryDb(nameof(GetByUser_ReturnsUserLogs));

            db.Users.Add(new User
            {
                UserId = 10,
                FullName = "Alice",
                Email = "alice@test.com",
                Identification = "12345",
                PasswordHash = "X"  // puede ser texto dummy
            });

            db.AuditLogs.AddRange(
                new AuditLog { AuditId = 1, Action = "Login", UserId = 10, Timestamp = DateTime.UtcNow },
                new AuditLog { AuditId = 2, Action = "Logout", UserId = 10, Timestamp = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();

            var controller = new AuditLogsController(db);

            var result = await controller.GetByUser(10, CancellationToken.None);
            var ok = result as OkObjectResult;

            Assert.IsNotNull(ok);
            var list = ok.Value as IEnumerable<object>;
            Assert.AreEqual(2, list.Count());
        }

        [Fact]
        [TestMethod]
        [TestDescription("Verifica que GetByAction retorna únicamente los registros cuyo campo Action coincide con el valor proporcionado.")]
        public async Task GetByAction_ReturnsMatchingLogs()
        {
            var db = GetInMemoryDb(nameof(GetByAction_ReturnsMatchingLogs));

            db.Users.Add(new User
            {
                UserId = 1,
                FullName = "Admin",
                Email = "admin@test.com",
                Identification = "12345",
                PasswordHash = "X"  // puede ser texto dummy
            });

            db.AuditLogs.AddRange(
                new AuditLog { AuditId = 1, Action = "Login", UserId = 1, Timestamp = DateTime.UtcNow },
                new AuditLog { AuditId = 2, Action = "Login", UserId = 1, Timestamp = DateTime.UtcNow },
                new AuditLog { AuditId = 3, Action = "Delete", UserId = 1, Timestamp = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();

            var controller = new AuditLogsController(db);

            var result = await controller.GetByAction("Login", CancellationToken.None);
            var ok = result as OkObjectResult;

            Assert.IsNotNull(ok);

            var list = ok.Value as IEnumerable<object>;

            Assert.AreEqual(2, list.Count());
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
