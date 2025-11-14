using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Security.Claims;

namespace Server.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Registra una acción especificando el userId manualmente
    /// </summary>
    public async Task LogAsync(int userId, string action, string? details = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(action))
            return;

        // Validar que el usuario existe
        var userExists = await _db.Users.AnyAsync(u => u.UserId == userId, ct);
        if (!userExists)
            return;

        var auditLog = new AuditLog
        {
            UserId = userId,
            Action = action.Trim().Length > 50 ? action.Trim()[..50] : action.Trim(),
            Details = details?.Trim().Length > 255 ? details.Trim()[..255] : details?.Trim(),
            Timestamp = DateTime.Now
        };

        _db.AuditLogs.Add(auditLog);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Si falla el registro de auditoría, no queremos que rompa la operación principal
        }
    }

    /// <summary>
    /// Registra una acción obteniendo el userId del token JWT del request actual
    /// </summary>
    public async Task LogAsync(string action, string? details = null, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            await LogAsync(userId.Value, action, details, ct);
        }
    }

    /// <summary>
    /// Obtiene el UserId del claim del token JWT
    /// </summary>
    private int? GetCurrentUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(userIdClaim, out var userId))
            return userId;

        return null;
    }
}