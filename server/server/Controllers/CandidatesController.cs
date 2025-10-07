using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Server.Data;
using Server.Models;
using Server.DTOs;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class CandidatesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CandidatesController(AppDbContext db)
    {
        _db = db;
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
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sql &&
                                           (sql.Number == 2601 || sql.Number == 2627))
        {
            return Conflict(new { message = "Ya existe un candidato con ese nombre en esta elección." });
        }

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
        var entity = await _db.Candidates
            .Include(c => c.Election) // para ElectionName en la respuesta
            .FirstOrDefaultAsync(c => c.CandidateId == id, ct);

        if (entity is null)
            return NotFound(new { message = "El candidato no existe." });

        var name = (dto.Name ?? string.Empty).Trim();
        var party = (dto.Party ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre del candidato es requerido." });

        if (string.IsNullOrWhiteSpace(party))
            return BadRequest(new { message = "La agrupación/partido es requerida." });

        var duplicate = await _db.Candidates.AnyAsync(c =>
            c.ElectionId == entity.ElectionId &&
            c.CandidateId != id &&
            c.Name.ToLower() == name.ToLower(), ct);

        if (duplicate)
            return Conflict(new { message = "Ya existe otro candidato con ese nombre en esta elección." });

        entity.Name = name;
        entity.Party = party;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sql &&
                                           (sql.Number == 2601 || sql.Number == 2627))
        {
            return Conflict(new { message = "Ya existe otro candidato con ese nombre en esta elección." });
        }

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

        _db.Candidates.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "El candidato se ha eliminado con éxito." });
    }
}
