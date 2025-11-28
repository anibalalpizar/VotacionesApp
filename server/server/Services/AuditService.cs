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

    public async Task LogAsync(int userId, string action, string? details = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(action))
            return;

        var userExists = await _db.Users.AnyAsync(u => u.UserId == userId, ct);
        if (!userExists)
            return;

        var auditLog = new AuditLog
        {
            UserId = userId,
            Action = action.Trim().Length > 50 ? action.Trim()[..50] : action.Trim(),
            Details = details?.Trim().Length > 255 ? details.Trim()[..255] : details?.Trim(),
            Timestamp = DateTime.UtcNow // ✅ Cambio importante
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

    public async Task LogAsync(string action, string? details = null, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            await LogAsync(userId.Value, action, details, ct);
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
            return userId;
        return null;
    }
}