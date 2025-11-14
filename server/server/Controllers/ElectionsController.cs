using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Utils;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class ElectionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private static TimeZoneInfo _appTz = TimeZoneInfo.Local; // zona de la app (fallback)

    public ElectionsController(AppDbContext db, IConfiguration cfg, IAuditService audit)
    {
        _db = db;
        _audit = audit;

        // Opcional: configura la zona en appsettings.json -> "App:TimeZoneId"
        var tzId = cfg["App:TimeZoneId"];
        if (!string.IsNullOrWhiteSpace(tzId))
        {
            try { _appTz = TimeZoneInfo.FindSystemTimeZoneById(tzId); }
            catch { _appTz = TimeZoneInfo.Local; }
        }
    }

    // ----------------- Helpers (DateTimeOffset) -----------------

    // Lee offset del cliente en minutos (JS getTimezoneOffset), invierte signo.
    private TimeSpan GetClientOffset()
    {
        if (Request.Headers.TryGetValue("X-Client-Offset", out var h) &&
            int.TryParse(h.ToString(), out var minutes))
        {
            // JS da minutos "behind UTC" (ej. 360 en UTC-6) → invertimos signo
            return TimeSpan.FromMinutes(-minutes);
        }
        // Si no llega header, usamos la zona configurada de la app
        return _appTz.GetUtcOffset(DateTime.UtcNow);
    }

    // Normaliza lo que llega del cliente:
    // - Si trae offset real (!= 00:00), lo conservamos TAL CUAL (no lo pasamos a UTC).
    // - Si viene "plano" (offset == 00:00 pero la hora era local), reconstruimos con offset del cliente.
    private DateTimeOffset NormalizeFromClient(DateTimeOffset incoming)
    {
        if (incoming.Offset != TimeSpan.Zero)
            return incoming; // conservar tal cual (con su offset)

        // reconstruir usando el offset del cliente y conservar ese offset
        var rebuilt = new DateTimeOffset(incoming.DateTime, GetClientOffset());
        return rebuilt;
    }

    // Estado calculado en vivo comparando en UTC
    private static (string Status, bool IsActive) RuntimeStatus(DateTimeOffset? start, DateTimeOffset? end)
    {
        if (start is null || end is null) return ("Scheduled", false);

        var nowUtc = DateTimeOffset.UtcNow;
        var sUtc = start.Value.ToUniversalTime();
        var eUtc = end.Value.ToUniversalTime();

        if (nowUtc < sUtc) return ("Scheduled", false);
        if (nowUtc > eUtc) return ("Closed", false);
        return ("Active", true);
    }

    private static string? ValidateDates(DateTimeOffset start, DateTimeOffset end)
    {
        // Validar en UTC para evitar ambigüedades
        if (start.ToUniversalTime() >= end.ToUniversalTime())
            return "La fecha de inicio debe ser menor a la fecha de fin.";
        return null;
    }

    private static ElectionDto ToDto(Election e, int candidateCount, int voteCount)
    {
        var (status, isActive) = RuntimeStatus(e.StartDate, e.EndDate);

        return new ElectionDto
        {
            ElectionId = e.ElectionId,
            Name = e.Name,
            // Devolvemos EXACTAMENTE lo guardado (con offset)
            StartDateUtc = e.StartDate ?? default,
            EndDateUtc = e.EndDate ?? default,
            Status = status,            // calculado dinámicamente
            CandidateCount = candidateCount,
            VoteCount = voteCount,
            IsActive = isActive
        };
    }

    // ----------------- Endpoints -----------------

    // POST: /api/elections
    [HttpPost]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateElectionDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre de la elección es requerido." });

        // Normaliza desde el cliente conservando offset
        var sClient = NormalizeFromClient(dto.StartDateUtc);
        var eClient = NormalizeFromClient(dto.EndDateUtc);

        var dateError = ValidateDates(sClient, eClient);
        if (dateError is not null) return BadRequest(new { message = dateError });

        // Nombre único
        var exists = await _db.Elections.AnyAsync(e => e.Name == name, ct);
        if (exists) return Conflict(new { message = "Ya existe una elección con ese nombre." });

        var entity = new Election
        {
            Name = name,
            StartDate = sClient, // guardamos con offset
            EndDate = eClient    // guardamos con offset
            // SIN columna Status en BD
        };

        _db.Elections.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Auditoría: elección creada
        await _audit.LogAsync(
            action: AuditActions.ElectionCreated,
            details: $"Elección creada (ID={entity.ElectionId}, Nombre='{entity.Name}')",
            ct: ct
        );

        return CreatedAtAction(nameof(GetById), new { id = entity.ElectionId }, ToDto(entity, 0, 0));
    }

    // GET: /api/elections (paginado)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1,
                                            [FromQuery] int pageSize = 20,
                                            CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var baseQuery = _db.Elections.AsNoTracking().OrderBy(e => e.Name);

        var total = await baseQuery.CountAsync(ct);

        var items = await (from e in baseQuery
                           join c in _db.Candidates on e.ElectionId equals c.ElectionId into gc
                           from c in gc.DefaultIfEmpty()
                           join v in _db.Votes on e.ElectionId equals v.ElectionId into gv
                           from v in gv.DefaultIfEmpty()
                           group new { e, c, v } by e into g
                           select new
                           {
                               Election = g.Key,
                               CandidateCount = g.Count(x => x.c != null),
                               VoteCount = g.Count(x => x.v != null)
                           })
                          .Skip((page - 1) * pageSize)
                          .Take(pageSize)
                          .ToListAsync(ct);

        var dtoItems = items.Select(x => ToDto(x.Election, x.CandidateCount, x.VoteCount)).ToList();

        return Ok(new { page, pageSize, total, items = dtoItems });
    }

    // GET: /api/elections/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var e = await _db.Elections.AsNoTracking()
                                   .FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var candidateCount = await _db.Candidates.CountAsync(c => c.ElectionId == id, ct);
        var voteCount = await _db.Votes.CountAsync(v => v.ElectionId == id, ct);

        return Ok(ToDto(e, candidateCount, voteCount));
    }

    // PUT: /api/elections/{id}
    // Permite cambiar fechas y nombre, validando rango y nombre único.
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateElectionDto dto, CancellationToken ct)
    {
        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre de la elección es requerido." });

        var dup = await _db.Elections.AnyAsync(x => x.ElectionId != id && x.Name == name, ct);
        if (dup) return Conflict(new { message = "Ya existe otra elección con ese nombre." });

        var sClient = NormalizeFromClient(dto.StartDateUtc);
        var eClient = NormalizeFromClient(dto.EndDateUtc);

        var dateError = ValidateDates(sClient, eClient);
        if (dateError is not null) return BadRequest(new { message = dateError });

        e.Name = name;
        e.StartDate = sClient; // conservar offset
        e.EndDate = eClient;   // conservar offset

        await _db.SaveChangesAsync(ct);

        // Auditoría: elección actualizada
        await _audit.LogAsync(
            action: AuditActions.ElectionUpdated,
            details: $"Elección actualizada (ID={e.ElectionId}, Nombre='{e.Name}')",
            ct: ct
        );

        var candidateCount = await _db.Candidates.CountAsync(c => c.ElectionId == id, ct);
        var voteCount = await _db.Votes.CountAsync(v => v.ElectionId == id, ct);

        return Ok(ToDto(e, candidateCount, voteCount));
    }

    // DELETE: /api/elections/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var hasVotes = await _db.Votes.AnyAsync(v => v.ElectionId == id, ct);
        if (hasVotes)
            return BadRequest(new { message = "No se puede eliminar: la elección ya tiene votos." });

        var hasCandidates = await _db.Candidates.AnyAsync(c => c.ElectionId == id, ct);
        if (hasCandidates)
            return BadRequest(new { message = "No se puede eliminar: remueva o reasigne los candidatos primero." });

        var deletedName = e.Name;
        var deletedId = e.ElectionId;

        _db.Elections.Remove(e);
        await _db.SaveChangesAsync(ct);

        // Auditoría: elección eliminada
        await _audit.LogAsync(
            action: AuditActions.ElectionDeleted,
            details: $"Elección eliminada (ID={deletedId}, Nombre='{deletedName}')",
            ct: ct
        );

        return Ok(new { message = "La elección fue eliminada con éxito." });
    }
}
