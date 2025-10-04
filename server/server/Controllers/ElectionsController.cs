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

    private static string NormalizeStatus(string? s)
        => string.IsNullOrWhiteSpace(s) ? "Draft" : s.Trim();

    private static bool IsValidStatus(string s)
        => s is "Draft" or "Active" or "Closed";

    private static ElectionDto ToDto(Election e, int candidateCount, int voteCount)
        => new()
        {
            ElectionId = e.ElectionId,
            Name = e.Name,
            StartDateUtc = e.StartDate ?? DateTime.MinValue,
            EndDateUtc = e.EndDate ?? DateTime.MinValue,
            Status = e.Status ?? "Draft",
            CandidateCount = candidateCount,
            VoteCount = voteCount
        };

    private static string? ValidateDates(DateTime startUtc, DateTime endUtc)
    {
        if (startUtc.Kind == DateTimeKind.Unspecified || endUtc.Kind == DateTimeKind.Unspecified)
            return "Las fechas deben venir en UTC (DateTime.Kind=Utc).";
        if (startUtc >= endUtc)
            return "La fecha de inicio debe ser menor a la fecha de fin.";
        return null;
    }

    //POST: crear elección
    [HttpPost]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateElectionDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var dateError = ValidateDates(dto.StartDateUtc, dto.EndDateUtc);
        if (dateError is not null)
            return BadRequest(new { message = dateError });

        // Nombre único
        var name = dto.Name.Trim();
        var exists = await _db.Elections.AnyAsync(e => e.Name == name, ct);
        if (exists)
            return Conflict(new { message = "Ya existe una elección con ese nombre." });

        var entity = new Election
        {
            ElectionId = Guid.NewGuid(),
            Name = name,
            StartDate = dto.StartDateUtc,
            EndDate = dto.EndDateUtc,
            Status = "Draft"
        };

        _db.Elections.Add(entity);
        await _db.SaveChangesAsync(ct);

        var dtoOut = ToDto(entity, 0, 0);
        return CreatedAtAction(nameof(GetById), new { id = entity.ElectionId }, dtoOut);
    }

    //GET: listar 
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
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
                           select new ElectionDto
                           {
                               ElectionId = g.Key.ElectionId,
                               Name = g.Key.Name,
                               StartDateUtc = g.Key.StartDate ?? DateTime.MinValue,
                               EndDateUtc = g.Key.EndDate ?? DateTime.MinValue,
                               Status = g.Key.Status ?? "Draft",
                               CandidateCount = g.Count(x => x.c != null),
                               VoteCount = g.Count(x => x.v != null)
                           })
                          .Skip((page - 1) * pageSize)
                          .Take(pageSize)
                          .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    //GET: por id
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var e = await _db.Elections.AsNoTracking().FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var candidateCount = await _db.Candidates.CountAsync(c => c.ElectionId == id, ct);
        var voteCount = await _db.Votes.CountAsync(v => v.ElectionId == id, ct);

        return Ok(ToDto(e, candidateCount, voteCount));
    }

    //PUT: actualizar (nombre/fechas/estado)
    // Reglas:
    // - Solo se permite editar fechas si Status = "Draft".
    // - Status permitido: Draft | Active | Closed
    // - No se puede pasar a Active si las fechas son inválidas o si Start>=End.
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ElectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateElectionDto dto, CancellationToken ct)
    {
        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var name = dto.Name.Trim();
        // Verificar duplicado de nombre 
        var dup = await _db.Elections.AnyAsync(x => x.ElectionId != id && x.Name == name, ct);
        if (dup)
            return Conflict(new { message = "Ya existe otra elección con ese nombre." });

        var newStatus = NormalizeStatus(dto.Status ?? e.Status ?? "Draft");
        if (!IsValidStatus(newStatus))
            return BadRequest(new { message = "Estado inválido. Use 'Draft', 'Active' o 'Closed'." });

        // Si estamos en Draft, se pueden alterar fechas; si no, las dejamos igual.
        if ((e.Status ?? "Draft") == "Draft")
        {
            var dateError = ValidateDates(dto.StartDateUtc, dto.EndDateUtc);
            if (dateError is not null)
                return BadRequest(new { message = dateError });

            e.StartDate = dto.StartDateUtc;
            e.EndDate = dto.EndDateUtc;
        }

        e.Name = name;

        // Reglas simples de transición
        // - Para pasar a Active, las fechas deben ser válidas y hoy estar <= End
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

    //DELETE: eliminar (solo si no tiene votos) 
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var e = await _db.Elections.FirstOrDefaultAsync(x => x.ElectionId == id, ct);
        if (e is null) return NotFound();

        var votes = await _db.Votes.AnyAsync(v => v.ElectionId == id, ct);
        if (votes)
            return BadRequest(new { message = "No se puede eliminar: la elección ya tiene votos." });

        // Si tienes FK de Candidate se debe de borrar primero candidatos
        var hasCandidates = await _db.Candidates.AnyAsync(c => c.ElectionId == id, ct);
        if (hasCandidates)
            return BadRequest(new { message = "No se puede eliminar: remueva o reasigne los candidatos primero." });

        _db.Remove(e);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "La elección fue eliminada con éxito." });
    }
}
