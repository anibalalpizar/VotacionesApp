using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/elections")]
[Authorize(Roles = nameof(UserRole.ADMIN))] // Solo ADMIN
public class ResultsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ResultsController(AppDbContext db) => _db = db;


    // GET /api/elections/{electionId}/results
    [HttpGet("{electionId:int}/results")]
    [ProducesResponseType(typeof(ElectionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResults(int electionId, CancellationToken ct)
    {
        var election = await _db.Elections
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == electionId, ct);

        if (election is null)
            return NotFound(new { message = "La elección no existe." });

        // Solo cuando la elección ya cerró (now > EndDate)
        var now = DateTimeOffset.UtcNow;
        var isClosed = election.EndDate.HasValue && now > election.EndDate.Value;
        if (!isClosed)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Los resultados solo pueden consultarse cuando la elección esté cerrada." });

 
        var items = await _db.Candidates
            .AsNoTracking()
            .Where(c => c.ElectionId == electionId)
            .Select(c => new ElectionResultItemDto
            {
                CandidateId = c.CandidateId,
                Name = c.Name,
                Party = c.Party,
                Votes = _db.Votes.Count(v => v.CandidateId == c.CandidateId)
            })
            .OrderByDescending(x => x.Votes)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        var totalVotes = items.Sum(i => i.Votes);

        var dto = new ElectionResultDto
        {
            ElectionId = election.ElectionId,
            ElectionName = election.Name,
            StartDateUtc = election.StartDate,
            EndDateUtc = election.EndDate,
            IsClosed = true,
            TotalVotes = totalVotes,
            TotalCandidates = items.Count,
            Items = items
        };

        return Ok(dto);
    }


    // GET /api/elections/{electionId}/participation
    [HttpGet("{electionId:int}/participation")]
    [ProducesResponseType(typeof(ParticipationReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetParticipation(int electionId, CancellationToken ct)
    {
        var election = await _db.Elections
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == electionId, ct);

        if (election is null)
            return NotFound(new { message = "La elección no existe." });

        var now = DateTimeOffset.UtcNow;
        if (!(election.EndDate.HasValue && now > election.EndDate.Value))
            return BadRequest(new { message = "El reporte de participación está disponible solo cuando la elección ha finalizado." });

       
        var totalVoters = await _db.Users.CountAsync(u => u.Role == UserRole.VOTER, ct);

        // Distintos votantes que emitieron voto en esa elección
        var totalVoted = await _db.Votes
            .Where(v => v.ElectionId == electionId)
            .Select(v => v.VoterId)
            .Distinct()
            .CountAsync(ct);

        var notParticipated = Math.Max(0, totalVoters - totalVoted);
        double participationPct = totalVoters > 0 ? Math.Round(totalVoted * 100.0 / totalVoters, 2) : 0.0;
        double nonParticipationPct = totalVoters > 0 ? Math.Round(notParticipated * 100.0 / totalVoters, 2) : 0.0;

        var dto = new ParticipationReportDto
        {
            ElectionId = election.ElectionId,
            ElectionName = election.Name,
            TotalVoters = totalVoters,
            TotalVoted = totalVoted,
            NotParticipated = notParticipated,
            ParticipationPercent = participationPct,
            NonParticipationPercent = nonParticipationPct,
            StartDateUtc = election.StartDate?.ToUniversalTime(),
            EndDateUtc = election.EndDate?.ToUniversalTime(),
            IsClosed = true
        };

        return Ok(dto);
    }
}
