using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Utils;

namespace Server.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = $"{nameof(UserRole.ADMIN)},{nameof(UserRole.AUDITOR)}")]
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    /// GET: /api/audit-logs
    /// Lista paginada completa
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 50 : pageSize;

        var query = _db.AuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .AsQueryable();

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                auditId = a.AuditId,
                timestamp = a.Timestamp,
                userId = a.UserId,
                userName = a.User != null ? a.User.FullName : "(usuario eliminado)",
                action = a.Action,
                details = a.Details
            })
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    /// GET: /api/audit-logs/user/{userId}
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
    {
        var logs = await _db.AuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new
            {
                auditId = a.AuditId,
                timestamp = a.Timestamp,
                userId = a.UserId,
                userName = a.User != null ? a.User.FullName : "(usuario eliminado)",
                action = a.Action,
                details = a.Details
            })
            .ToListAsync(ct);

        return Ok(logs);
    }

    /// GET: /api/audit-logs/actions/{action}
    [HttpGet("by-action")]
    public async Task<IActionResult> GetByAction([FromQuery] string action, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(action))
        {
            return BadRequest(new { message = "La acción es requerida" });
        }

        var logs = await _db.AuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .Where(a => a.Action == action)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new
            {
                auditId = a.AuditId,
                timestamp = a.Timestamp,
                userId = a.UserId,
                userName = a.User != null ? a.User.FullName : "(usuario eliminado)",
                action = a.Action,
                details = a.Details
            })
            .ToListAsync(ct);

        return Ok(logs);
    }
}
