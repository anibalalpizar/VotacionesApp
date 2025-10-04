using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

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

    // DTOs locales para requests/responses
    public record CandidateCreateDto(Guid ElectionId, string Name, string Group);
    public record CandidateUpdateDto(string Name, string Group);
    public record CandidateDto(Guid CandidateId, Guid ElectionId, string Name, string Group);

    // GET: api/candidates
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? electionId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = _db.Candidates.AsNoTracking().AsQueryable();

        if (electionId is not null && electionId != Guid.Empty)
            query = query.Where(c => c.ElectionId == electionId);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CandidateDto(c.CandidateId, c.ElectionId, c.Name, c.Group))
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    // GET: api/candidates/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var c = await _db.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.CandidateId == id, ct);

        if (c is null) return NotFound();

        return Ok(new CandidateDto(c.CandidateId, c.ElectionId, c.Name, c.Group));
    }

    // POST: api/candidates
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CandidateCreateDto dto, CancellationToken ct)
    {
        if (dto.ElectionId == Guid.Empty)
            return BadRequest(new { message = "ElectionId es requerido." });

        var name = (dto.Name ?? "").Trim();
        var party = (dto.Group ?? "").Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre del candidato es requerido." });

        if (string.IsNullOrWhiteSpace(party))
            return BadRequest(new { message = "La agrupación/partido es requerida." });

        var electionExists = await _db.Elections.AnyAsync(e => e.ElectionId == dto.ElectionId, ct);
        if (!electionExists)
            return NotFound(new { message = "La elección indicada no existe." });

        var duplicate = await _db.Candidates.AnyAsync(c =>
            c.ElectionId == dto.ElectionId &&
            c.Name.ToLower() == name.ToLower(), ct);

        if (duplicate)
            return Conflict(new { message = "Ya existe un candidato con ese nombre en esta elección." });

        var entity = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            ElectionId = dto.ElectionId,
            Name = name,
            Group = party
        };

        _db.Candidates.Add(entity);
        await _db.SaveChangesAsync(ct);

        var response = new CandidateDto(entity.CandidateId, entity.ElectionId, entity.Name, entity.Group);
        return CreatedAtAction(nameof(GetById), new { id = entity.CandidateId }, response);
    }

    // PUT: api/candidates/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CandidateUpdateDto dto, CancellationToken ct)
    {
        var entity = await _db.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (entity is null) return NotFound(new { message = "El candidato no existe." });

        var name = (dto.Name ?? "").Trim();
        var group = (dto.Group ?? "").Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "El nombre del candidato es requerido." });

        if (string.IsNullOrWhiteSpace(group))
            return BadRequest(new { message = "La agrupación/partido es requerida." });

        var duplicate = await _db.Candidates.AnyAsync(c =>
            c.ElectionId == entity.ElectionId &&
            c.CandidateId != id &&
            c.Name.ToLower() == name.ToLower(), ct);

        if (duplicate)
            return Conflict(new { message = "Ya existe otro candidato con ese nombre en esta elección." });

        entity.Name = name;
        entity.Group = group;

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "El candidato se ha editado con éxito.",
            item = new CandidateDto(entity.CandidateId, entity.ElectionId, entity.Name, entity.Group)
        });
    }

    // DELETE: api/candidates/{id}
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var entity = await _db.Candidates.FirstOrDefaultAsync(c => c.CandidateId == id, ct);
        if (entity is null) return NotFound(new { message = "El candidato no existe." });

        _db.Candidates.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "El candidato se ha eliminado con éxito." });
    }
}
