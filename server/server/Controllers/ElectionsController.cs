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

    public ElectionsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    // ----------------- Helpers -----------------

    /// <summary>
    /// Calcula el estado de una elección basándose en las fechas actuales
    /// </summary>
    private static (string Status, bool IsActive) RuntimeStatus(DateTime? start, DateTime? end)
    {
        if (start is null || end is null)
            return ("Scheduled", false);

        var nowUtc = DateTime.UtcNow;

        if (nowUtc < start.Value)
            return ("Scheduled", false);

        if (nowUtc > end.Value)
            return ("Closed", false);

        return ("Active", true);
    }

    /// <summary>
    /// Valida que la fecha de inicio sea anterior a la fecha de fin
    /// </summary>
    private static string? ValidateDates(DateTime start, DateTime end)
    {
        if (start >= end)
            return "La fecha de inicio debe ser menor a la fecha de fin.";

        return null;
    }

    /// <summary>
    /// Convierte una entidad Election a ElectionDto
    /// </summary>
    private static ElectionDto ToDto(Election e, int candidateCount, int voteCount)
    {
        var (status, isActive) = RuntimeStatus(e.StartDate, e.EndDate);

        return new ElectionDto
        {
            ElectionId = e.ElectionId,
            Name = e.Name,
            StartDateUtc = e.StartDate.ToString("o") ?? string.Empty,
            EndDateUtc = e.EndDate.ToString("o") ?? string.Empty,
            Status = status,
            CandidateCount = candidateCount,
            VoteCount = voteCount,
            IsActive = isActive
        };
    }

    // ----------------- Endpoints -----------------

    /// <summary>
    /// POST: /api/elections - Crear una nueva elección
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateElectionDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre de la elección es requerido." });

        // Parsear fechas desde string a DateTime
        if (!DateTime.TryParse(dto.StartDateUtc, out var startDate))
            return BadRequest(new { message = "Fecha de inicio inválida." });

        if (!DateTime.TryParse(dto.EndDateUtc, out var endDate))
            return BadRequest(new { message = "Fecha de fin inválida." });

        // Asegurar que sean UTC
        startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

        // Validar que el rango de fechas sea correcto
        var dateError = ValidateDates(startDate, endDate);
        if (dateError is not null)
            return BadRequest(new { message = dateError });

        // Validar nombre único
        var exists = await _db.Elections.AnyAsync(e => e.Name == name, ct);
        if (exists)
            return Conflict(new { message = "Ya existe una elección con ese nombre." });

        // Crear entidad
        var entity = new Election
        {
            Name = name,
            StartDate = startDate,
            EndDate = endDate
        };

        _db.Elections.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Auditoría
        await _audit.LogAsync(
            action: AuditActions.ElectionCreated,
            details: $"Elección creada (ID={entity.ElectionId}, Nombre='{entity.Name}')",
            ct: ct
        );

        return CreatedAtAction(
            nameof(GetById),
            new { id = entity.ElectionId },
            ToDto(entity, 0, 0)
        );
    }

    /// <summary>
    /// GET: /api/elections - Obtener todas las elecciones (paginado)
    /// </summary>
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

        var items = await (
            from e in baseQuery
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

        return Ok(new
        {
            page,
            pageSize,
            total,
            items = dtoItems
        });
    }

    /// <summary>
    /// GET: /api/elections/{id} - Obtener una elección por ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var e = await _db.Elections.AsNoTracking()
                                   .FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null)
            return NotFound(new { message = "Elección no encontrada." });

        var candidateCount = await _db.Candidates.CountAsync(c => c.ElectionId == id, ct);
        var voteCount = await _db.Votes.CountAsync(v => v.ElectionId == id, ct);

        return Ok(ToDto(e, candidateCount, voteCount));
    }

    /// <summary>
    /// PUT: /api/elections/{id} - Actualizar una elección existente
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateElectionDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null)
            return NotFound(new { message = "Elección no encontrada." });

        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre de la elección es requerido." });

        // Validar nombre único (excluyendo la elección actual)
        var dup = await _db.Elections.AnyAsync(x => x.ElectionId != id && x.Name == name, ct);
        if (dup)
            return Conflict(new { message = "Ya existe otra elección con ese nombre." });

        // Parsear y validar fechas
        if (!DateTime.TryParse(dto.StartDateUtc, out var startDate))
            return BadRequest(new { message = "Fecha de inicio inválida." });

        if (!DateTime.TryParse(dto.EndDateUtc, out var endDate))
            return BadRequest(new { message = "Fecha de fin inválida." });

        startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

        var dateError = ValidateDates(startDate, endDate);
        if (dateError is not null)
            return BadRequest(new { message = dateError });

        // Actualizar entidad
        e.Name = name;
        e.StartDate = startDate;
        e.EndDate = endDate;

        await _db.SaveChangesAsync(ct);

        // Auditoría
        await _audit.LogAsync(
            action: AuditActions.ElectionUpdated,
            details: $"Elección actualizada (ID={e.ElectionId}, Nombre='{e.Name}')",
            ct: ct
        );

        var candidateCount = await _db.Candidates.CountAsync(c => c.ElectionId == id, ct);
        var voteCount = await _db.Votes.CountAsync(v => v.ElectionId == id, ct);

        return Ok(ToDto(e, candidateCount, voteCount));
    }

    /// <summary>
    /// DELETE: /api/elections/{id} - Eliminar una elección
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null)
            return NotFound(new { message = "Elección no encontrada." });

        // Validar que no tenga votos
        var hasVotes = await _db.Votes.AnyAsync(v => v.ElectionId == id, ct);
        if (hasVotes)
            return BadRequest(new { message = "No se puede eliminar: la elección ya tiene votos." });

        // Validar que no tenga candidatos
        var hasCandidates = await _db.Candidates.AnyAsync(c => c.ElectionId == id, ct);
        if (hasCandidates)
            return BadRequest(new { message = "No se puede eliminar: remueva o reasigne los candidatos primero." });

        var deletedName = e.Name;
        var deletedId = e.ElectionId;

        _db.Elections.Remove(e);
        await _db.SaveChangesAsync(ct);

        // Auditoría
        await _audit.LogAsync(
            action: AuditActions.ElectionDeleted,
            details: $"Elección eliminada (ID={deletedId}, Nombre='{deletedName}')",
            ct: ct
        );

        return Ok(new { message = "La elección fue eliminada con éxito." });
    }

    /// <summary>
    /// GET: /api/elections/{id}/results - Obtener resultados de una elección
    /// </summary>
    [HttpGet("{id:int}/results")]
    [ProducesResponseType(typeof(ElectionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResults(int id, CancellationToken ct)
    {
        var election = await _db.Elections.AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == id, ct);

        if (election is null)
            return NotFound(new { message = "La elección no existe." });

        // Verificar que la elección esté cerrada
        var (status, _) = RuntimeStatus(election.StartDate, election.EndDate);
        if (status != "Closed")
            return StatusCode(403, new { message = "Los resultados solo pueden consultarse cuando la elección esté cerrada." });

        // Obtener resultados
        var results = await (
            from c in _db.Candidates
            where c.ElectionId == id
            join v in _db.Votes on c.CandidateId equals v.CandidateId into votes
            select new ElectionResultItemDto
            {
                CandidateId = c.CandidateId,
                Name = c.Name,
                Party = c.Party,
                Votes = votes.Count()
            })
            .OrderByDescending(r => r.Votes)
            .ToListAsync(ct);

        var totalVotes = results.Sum(r => r.Votes);
        var totalCandidates = results.Count;

        var resultDto = new ElectionResultDto
        {
            ElectionId = election.ElectionId,
            ElectionName = election.Name,
            StartDateUtc = election.StartDate.ToString("o"),
            EndDateUtc = election.EndDate.ToString("o"),
            IsClosed = true,
            TotalVotes = totalVotes,
            TotalCandidates = totalCandidates,
            Items = results
        };

        return Ok(resultDto);
    }
}