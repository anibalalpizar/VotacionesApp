using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class ElectionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private static TimeZoneInfo _appTz = TimeZoneInfo.Local; // zona por defecto de la app

    public ElectionsController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;

        var tzId = cfg["App:TimeZoneId"];
        if (!string.IsNullOrWhiteSpace(tzId))
        {
            try { _appTz = TimeZoneInfo.FindSystemTimeZoneById(tzId); }
            catch { _appTz = TimeZoneInfo.Local; }
        }
    }

    // Helpers

    // Lee offset del cliente (en minutos “behind UTC” que entrega JS). 
    private TimeSpan GetClientOffset()
    {
        if (Request.Headers.TryGetValue("X-Client-Offset", out var h) &&
            int.TryParse(h.ToString(), out var minutes))
        {
            // JS: UTC-6 => getTimezoneOffset() = 360 -> invertimos signo para obtener +/-
            return TimeSpan.FromMinutes(-minutes);
        }
        //zona configurada de la app
        return _appTz.GetUtcOffset(DateTime.UtcNow);
    }

    // Normaliza SIEMPRE a UTC lo que venga en el DTO (DateTimeOffset).
    // - Si trae offset/Z correcto, se respeta.
    // - Si viene “plano” (offset 0 pero el usuario digitó hora local), reconstruimos con offset del cliente.
    private DateTime NormalizeFromClient(DateTimeOffset dtoValue)
    {
        if (dtoValue.Offset != TimeSpan.Zero)
            return dtoValue.UtcDateTime; // ya tiene offset real

        var clientOffset = GetClientOffset();
        var localClock = dtoValue.DateTime;               // hora digitada (sin offset real)
        var rebuilt = new DateTimeOffset(localClock, clientOffset);
        return rebuilt.UtcDateTime;                        // guarda UTC
    }

    private static DateTime AsUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static string? ValidateDates(DateTime startUtc, DateTime endUtc)
    {
        var s = AsUtc(startUtc);
        var e = AsUtc(endUtc);
        if (s >= e) return "La fecha de inicio debe ser menor a la fecha de fin.";
        return null;
    }

    // Calcula estado “en vivo” con base en ahora (UTC) y el rango.
    private static (string Status, bool IsActive) RuntimeStatus(DateTime? start, DateTime? end)
    {
        if (start is null || end is null) return ("Scheduled", false);

        var s = AsUtc(start.Value);
        var e = AsUtc(end.Value);
        var now = DateTime.UtcNow;

        if (now < s) return ("Scheduled", false);
        if (now > e) return ("Closed", false);
        return ("Active", true);
    }

    private static ElectionDto ToDto(Election e, int candidateCount, int voteCount)
    {
        var (status, isActive) = RuntimeStatus(e.StartDate, e.EndDate);

        return new ElectionDto
        {
            ElectionId = e.ElectionId,
            Name = e.Name,
            StartDateUtc = e.StartDate is null ? DateTime.MinValue : AsUtc(e.StartDate.Value),
            EndDateUtc = e.EndDate is null ? DateTime.MinValue : AsUtc(e.EndDate.Value),
            Status = status,          // calculado dinámicamente
            IsActive = isActive,        // calculado dinámicamente
            CandidateCount = candidateCount,
            VoteCount = voteCount
        };
    }

    //Endpoints 

    // POST: /api/elections (crear)
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

        // Normalizar SIEMPRE a UTC (tolera horas locales si vienen sin offset real)
        var sUtc = NormalizeFromClient(dto.StartDateUtc);
        var eUtc = NormalizeFromClient(dto.EndDateUtc);

        var dateError = ValidateDates(sUtc, eUtc);
        if (dateError is not null)
            return BadRequest(new { message = dateError });

        // Nombre único
        var dup = await _db.Elections.AnyAsync(e => e.Name == name, ct);
        if (dup) return Conflict(new { message = "Ya existe una elección con ese nombre." });

        var entity = new Election
        {
            Name = name,
            StartDate = sUtc,
            EndDate = eUtc
        };

        _db.Elections.Add(entity);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.ElectionId }, ToDto(entity, 0, 0));
    }

    // GET: /api/elections (listar)
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var baseQuery = _db.Elections.AsNoTracking().OrderBy(e => e.Name);

        var total = await baseQuery.CountAsync(ct);

        var rows = await (from e in baseQuery
                          join c in _db.Candidates on e.ElectionId equals c.ElectionId into gc
                          from c in gc.DefaultIfEmpty()
                          join v in _db.Votes on e.ElectionId equals v.ElectionId into gv
                          from v in gv.DefaultIfEmpty()
                          group new { e, c, v } by e into g
                          select new
                          {
                              Election = g.Key,
                              C = g.Count(x => x.c != null),
                              V = g.Count(x => x.v != null)
                          })
                         .Skip((page - 1) * pageSize)
                         .Take(pageSize)
                         .ToListAsync(ct);

        var items = rows.Select(x => ToDto(x.Election, x.C, x.V)).ToList();

        return Ok(new { page, pageSize, total, items });
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

        var c = await _db.Candidates.CountAsync(x => x.ElectionId == id, ct);
        var v = await _db.Votes.CountAsync(x => x.ElectionId == id, ct);

        return Ok(ToDto(e, c, v));
    }

    // PUT: /api/elections/{id} (actualizar)
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

        // Nombre único (excluyendo la misma)
        var dup = await _db.Elections.AnyAsync(x => x.ElectionId != id && x.Name == name, ct);
        if (dup) return Conflict(new { message = "Ya existe otra elección con ese nombre." });

        // Normalizar a UTC desde el cliente (misma lógica que en Create)
        var sUtc = NormalizeFromClient(dto.StartDateUtc);
        var eUtc = NormalizeFromClient(dto.EndDateUtc);

        var dateError = ValidateDates(sUtc, eUtc);
        if (dateError is not null)
            return BadRequest(new { message = dateError });

        e.Name = name;
        e.StartDate = sUtc;
        e.EndDate = eUtc;

        await _db.SaveChangesAsync(ct);

        var c = await _db.Candidates.CountAsync(x => x.ElectionId == id, ct);
        var v = await _db.Votes.CountAsync(x => x.ElectionId == id, ct);

        return Ok(ToDto(e, c, v));
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

        _db.Elections.Remove(e);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "La elección fue eliminada con éxito." });
    }
}
