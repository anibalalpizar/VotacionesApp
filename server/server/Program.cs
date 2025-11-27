using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Server.Data;
using Server.Models;
using Server.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Obtener connection string y convertir si es formato postgresql://
var connectionString = builder.Configuration.GetConnectionString("Default");

if (!string.IsNullOrWhiteSpace(connectionString) && connectionString.StartsWith("postgresql://"))
{
    try
    {
        // Convertir postgresql://user:password@host:port/database a formato Npgsql
        var uri = new Uri(connectionString);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";

        connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode=Require";

        Console.WriteLine($"[DB] Converted postgresql URL to Npgsql format");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Error converting connection string: {ex.Message}");
    }
}

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("No connection string found in configuration.");

Console.WriteLine($"[DB] Connection string configured (SSL Mode enabled)");

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(connectionString));

builder.Services.AddScoped<IMailSender, SmtpMailSender>();
builder.Services.AddSingleton<IEmailDomainValidator, EmailDomainValidator>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditService, AuditService>();

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

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000" };
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        // Crea la BD y tablas si no existen
        await db.Database.EnsureCreatedAsync();
        Console.WriteLine($"[DB] Database initialized successfully");

        // Seed admin si no existe
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
            Console.WriteLine($"[DB] Admin user created");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Error during initialization: {ex.Message}");
        throw;
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Votaciones API v1");
    c.RoutePrefix = string.Empty; // Hacer swagger la raíz
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();