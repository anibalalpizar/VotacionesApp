using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Server.Data;
using Server.Models;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// EF Core -> usa la cadena "Default" (apunta a tu appVotaciones en appsettings)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Autenticación JWT
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });

// Autorización (solo ADMIN para registrar votantes)
builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy("AdminOnly", p => p.RequireRole(nameof(UserRole.ADMIN)));
});

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger con botón Authorize (Bearer JWT)
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Votaciones API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Ingrese **Bearer** + espacio + su token JWT.\nEj: `Bearer eyJhbGciOi...`",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

//// Conexión a BD existente + seed admin si falta (SIN migraciones)
//using (var scope = app.Services.CreateScope())
//{
//    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//    // Verifica que puede conectar a tu SQL Server / appVotaciones
//    if (!await db.Database.CanConnectAsync())
//        throw new Exception("No se puede conectar a la base configurada. Revisa la cadena 'Default' en appsettings.");

//    // Crea admin si no existe (no depende de migraciones)
//    var adminEmail = "admin@utn.ac.cr";
//    if (!await db.Users.AnyAsync(u => u.Email == adminEmail))
//    {
//        db.Users.Add(new User
//        {
//            Identification = "ADMIN-001",
//            FullName = "Administrador del Sistema",
//            Email = adminEmail,
//            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
//            Role = UserRole.ADMIN
//        });
//        await db.SaveChangesAsync();
//        Console.WriteLine("Admin seeded: admin@utn.ac.cr / Admin123!");
//    }
//}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var cs = db.Database.GetDbConnection().ConnectionString;
    Console.WriteLine($"[DB] ConnectionString: {cs}");

    try
    {
        var can = await db.Database.CanConnectAsync();
        Console.WriteLine($"[DB] CanConnect: {can}");
        if (!can) throw new Exception("No se puede conectar (CanConnect=false).");
    }
    catch (Exception ex)
    {
        Console.WriteLine("[DB] ERROR al conectar:");
        Console.WriteLine(ex.GetType().FullName);
        Console.WriteLine(ex.Message);
        Console.WriteLine(ex.InnerException?.Message);
        throw; 
    }

    // seed admin si falta
    var adminEmail = "admin@utn.ac.cr";
    if (!await db.Users.AnyAsync(u => u.Email == adminEmail))
    {
        db.Users.Add(new User
        {
            Identification = "ADMIN-001",
            FullName = "Administrador del Sistema",
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = UserRole.ADMIN
        });
        await db.SaveChangesAsync();
        Console.WriteLine("Admin seeded: admin@utn.ac.cr / Admin123!");
    }
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
