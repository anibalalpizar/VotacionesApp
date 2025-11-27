using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Utils;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class CandidatesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public CandidatesController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    // GET: /api/candidates
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? electionId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = _db.Candidates
            .Include(c => c.Election)
            .AsNoTracking()
            .AsQueryable();

        if (electionId is not null)
            query = query.Where(c => c.ElectionId == electionId.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                CandidateId = c.CandidateId,
                Name = c.Name,
                Party = c.Party,
                ElectionName = c.Election != null ? c.Election.Name : "(Sin elección)"
            })
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    // GET: /api/candidates/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var c = await _db.Candidates
            .Include(x => x.Election)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.CandidateId == id, ct);

        if (c is null)
            return NotFound(new { message = "El candidato no existe." });

        return Ok(new
        {
            CandidateId = c.CandidateId,
            Name = c.Name,
            Party = c.Party,
            ElectionId = c.ElectionId,
            ElectionName = c.Election != null ? c.Election.Name : "(Sin elección)"
        });
    }

    // POST: /api/candidates
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CandidateCreateDto dto, CancellationToken ct)
    {
        if (dto.ElectionId <= 0)
            return BadRequest(new { message = "ElectionId es requerido y debe ser mayor a 0." });

        var name = (dto.Name ?? string.Empty).Trim();
        var party = (dto.Party ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre del candidato es requerido." });

        if (string.IsNullOrWhiteSpace(party))
            return BadRequest(new { message = "La agrupación/partido es requerida." });

        var election = await _db.Elections
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == dto.ElectionId, ct);

        if (election is null)
            return NotFound(new { message = $"No existe la elección con id {dto.ElectionId}." });

        var duplicate = await _db.Candidates.AnyAsync(c =>
            c.ElectionId == dto.ElectionId &&
            c.Name.ToLower() == name.ToLower(), ct);

        if (duplicate)
            return Conflict(new { message = "Ya existe un candidato con ese nombre en esta elección." });

        var entity = new Candidate
        {
            ElectionId = dto.ElectionId,
            Name = name,
            Party = party
        };

        try
        {
            _db.Candidates.Add(entity);
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
                                           (pg.SqlState == "23505" || pg.SqlState == "23514"))
        {
            return Conflict(new { message = "Ya existe un candidato con ese nombre en esta elección." });
        }

        // Auditoría: candidato creado
        await _audit.LogAsync(
            action: AuditActions.CandidateCreated,
            details: $"Candidato creado (ID={entity.CandidateId}, Nombre='{entity.Name}', ElectionId={entity.ElectionId})",
            ct: ct
        );

        var response = new
        {
            CandidateId = entity.CandidateId,
            Name = entity.Name,
            Party = entity.Party,
            ElectionName = election.Name
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.CandidateId }, response);
    }

    // PUT: /api/candidates/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] CandidateUpdateDto dto, CancellationToken ct)
    {
        // Traemos el candidato con su elección actual (para ElectionName en la respuesta)
        var entity = await _db.Candidates
            .Include(c => c.Election)
            .FirstOrDefaultAsync(c => c.CandidateId == id, ct);

        if (entity is null)
            return NotFound(new { message = "El candidato no existe." });

        var name = (dto.Name ?? string.Empty).Trim();
        var party = (dto.Party ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre del candidato es requerido." });

        if (string.IsNullOrWhiteSpace(party))
            return BadRequest(new { message = "La agrupación/partido es requerida." });

        // Si el DTO trae ElectionId y es > 0, usamos ese; si no, usamos el actual
        var targetElectionId = (dto.ElectionId.HasValue && dto.ElectionId.Value > 0)
            ? dto.ElectionId.Value
            : entity.ElectionId;

        // Si el ElectionId cambia, validamos que exista la nueva elección
        if (targetElectionId != entity.ElectionId)
        {
            var exists = await _db.Elections.AnyAsync(e => e.ElectionId == targetElectionId, ct);
            if (!exists)
                return NotFound(new { message = $"No existe la elección con id {targetElectionId}." });
        }

        // Validar duplicado de nombre dentro de la elección destino
        var duplicate = await _db.Candidates.AnyAsync(c =>
            c.ElectionId == targetElectionId &&
            c.CandidateId != id &&
            c.Name.ToLower() == name.ToLower(), ct);

        if (duplicate)
            return Conflict(new { message = "Ya existe otro candidato con ese nombre en esa elección." });

        // Valores anteriores (para detalle de auditoría)
        var oldName = entity.Name;
        var oldParty = entity.Party;
        var oldElectionId = entity.ElectionId;

        // Aplicar cambios
        entity.Name = name;
        entity.Party = party;
        entity.ElectionId = targetElectionId;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
                                           (pg.SqlState == "23505" || pg.SqlState == "23514"))
        {
            // Índice único (ElectionId, Name) violado
            return Conflict(new { message = "Ya existe otro candidato con ese nombre en esa elección." });
        }

        // Auditoría: candidato actualizado
        await _audit.LogAsync(
            action: AuditActions.CandidateUpdated,
            details: $"Candidato actualizado (ID={entity.CandidateId}, " +
                     $"NombreAntes='{oldName}', NombreDespues='{entity.Name}', " +
                     $"ElectionIdAntes={oldElectionId}, ElectionIdDespues={entity.ElectionId})",
            ct: ct
        );

        // Aseguramos tener el nombre de la elección (si cambió, recargamos la referencia)
        if (entity.Election == null || entity.Election.ElectionId != entity.ElectionId)
            await _db.Entry(entity).Reference(c => c.Election).LoadAsync(ct);

        return Ok(new
        {
            message = "El candidato se ha editado con éxito.",
            item = new
            {
                CandidateId = entity.CandidateId,
                Name = entity.Name,
                Party = entity.Party,
                ElectionName = entity.Election != null ? entity.Election.Name : "(Sin elección)"
            }
        });
    }

    // DELETE: /api/candidates/{id}
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (entity is null)
            return NotFound(new { message = "El candidato no existe." });

        var deletedId = entity.CandidateId;
        var deletedName = entity.Name;
        var deletedElectionId = entity.ElectionId;

        _db.Candidates.Remove(entity);
        await _db.SaveChangesAsync(ct);

        // Auditoría: candidato eliminado
        await _audit.LogAsync(
            action: AuditActions.CandidateDeleted,
            details: $"Candidato eliminado (ID={deletedId}, Nombre='{deletedName}', ElectionId={deletedElectionId})",
            ct: ct
        );

        return Ok(new { message = "El candidato se ha eliminado con éxito." });
    }
}
