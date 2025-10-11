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

    public ElectionsController(AppDbContext db)
    {
        _db = db;
    }

    //  Helpers

    private static DateTime ToUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            DateTimeKind.Unspecified => TimeZoneInfo.ConvertTimeToUtc(
                                            DateTime.SpecifyKind(dt, DateTimeKind.Local),
                                            TimeZoneInfo.Local),
            _ => dt
        };
    }

    private static DateTime AsUtc(DateTime dt)
        => dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static string NormalizeStatus(string? s)
        => string.IsNullOrWhiteSpace(s) ? "Scheduled" : s.Trim();

    private static bool IsValidStatus(string s)
        => s is "Scheduled" or "Active" or "Closed";

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

    private static string? ValidateDates(DateTime startUtc, DateTime endUtc)
    {
        var s = AsUtc(startUtc);
        var e = AsUtc(endUtc);
        if (s >= e) return "La fecha de inicio debe ser menor a la fecha de fin.";
        return null;
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
            Status = status,
            CandidateCount = candidateCount,
            VoteCount = voteCount,
            IsActive = isActive
        };
    }

    // Endpoints

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

        // Normalizar SIEMPRE a UTC
        var sUtc = ToUtc(dto.StartDateUtc);
        var eUtc = ToUtc(dto.EndDateUtc);

        // Validar rango (ya en UTC)
        if (sUtc >= eUtc)
            return BadRequest(new { message = "La fecha de inicio debe ser menor a la fecha de fin." });

        // Nombre único
        var exists = await _db.Elections.AnyAsync(e => e.Name == name, ct);
        if (exists) return Conflict(new { message = "Ya existe una elección con ese nombre." });

        // Estado según la hora actual del servidor (UTC)
        var nowUtc = DateTime.UtcNow;
        var status = nowUtc >= sUtc && nowUtc <= eUtc ? "Active"
                   : nowUtc < sUtc ? "Scheduled"
                                                      : "Closed";

        var entity = new Election
        {
            Name = name,
            StartDate = sUtc,
            EndDate = eUtc,
            Status = status
        };

        _db.Elections.Add(entity);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.ElectionId }, new ElectionDto
        {
            ElectionId = entity.ElectionId,
            Name = entity.Name,
            StartDateUtc = entity.StartDate ?? DateTime.MinValue,
            EndDateUtc = entity.EndDate ?? DateTime.MinValue,
            Status = status,
            CandidateCount = 0,
            VoteCount = 0,
            IsActive = nowUtc >= sUtc && nowUtc <= eUtc
        });
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
        if (dup)
            return Conflict(new { message = "Ya existe otra elección con ese nombre." });

        // Normalizamos estado entrante
        var newStatus = NormalizeStatus(dto.Status ?? e.Status ?? "Scheduled");
        if (!IsValidStatus(newStatus))
            return BadRequest(new { message = "Estado inválido. Use 'Scheduled', 'Active' o 'Closed'." });

        // Si el estado actual en BD es Scheduled, permitimos cambiar fechas
        if ((e.Status ?? "Scheduled") == "Scheduled")
        {
            // <<< USAR ToUtc TAMBIÉN AQUÍ >>>
            var sUtc = ToUtc(dto.StartDateUtc);
            var eUtc = ToUtc(dto.EndDateUtc);

            var dateError = ValidateDates(sUtc, eUtc);
            if (dateError is not null)
                return BadRequest(new { message = dateError });

            e.StartDate = sUtc;
            e.EndDate = eUtc;
        }

        e.Name = name;

        // Si se intenta forzar Active, validar rango
        if (newStatus == "Active")
        {
            if (e.StartDate is null || e.EndDate is null || e.StartDate >= e.EndDate)
                return BadRequest(new { message = "No se puede activar: el rango de fechas es inválido." });
        }

        e.Status = newStatus;

        await _db.SaveChangesAsync(ct);

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

        _db.Elections.Remove(e);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "La elección fue eliminada con éxito." });
    }
}
