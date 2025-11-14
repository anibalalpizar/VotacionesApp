using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Utils; // AuditActions

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.VOTER))] // Solo votantes emiten voto
public class VotesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMailSender _mail;   // Confirmación por correo
    private readonly IAuditService _audit;

    public VotesController(AppDbContext db, IMailSender mail, IAuditService audit)
    {
        _db = db;
        _mail = mail;
        _audit = audit;
    }

    // Lee el id de usuario desde varios posibles claims
    private int? GetUserId()
    {
        string? raw = null;
        var keys = new[]
        {
            ClaimTypes.NameIdentifier,
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
            "sub", "uid", "userId", "userid", "id"
        };

        foreach (var k in keys)
        {
            raw = User.FindFirst(k)?.Value;
            if (!string.IsNullOrWhiteSpace(raw) && int.TryParse(raw, out var id))
                return id;
        }
        return null;
    }

    private static bool IsActiveNow(DateTimeOffset? start, DateTimeOffset? end)
    {
        if (start is null || end is null) return false;
        var nowUtc = DateTimeOffset.UtcNow;
        return start.Value.ToUniversalTime() <= nowUtc
            && nowUtc <= end.Value.ToUniversalTime();
    }

    /// POST: /api/votes
    /// Emite un voto para la elección indicada. Solo 1 por elección.
    [HttpPost]
    [ProducesResponseType(typeof(CastVoteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cast([FromBody] CastVoteRequest req, CancellationToken ct)
    {
        // 1) Usuario autenticado
        var voterId = GetUserId();
        if (voterId is null)
            return Unauthorized(new { message = "No se pudo identificar el usuario." });

        if (req.ElectionId <= 0 || req.CandidateId <= 0)
            return BadRequest(new { message = "ElectionId y CandidateId deben ser mayores a 0." });

        // Logueamos el intento de voto (sin contenido específico del voto)
        await _audit.LogAsync(
            userId: voterId.Value,
            action: AuditActions.VoteAttempt,
            details: $"Intento de voto en elección {req.ElectionId}"
        );

        // 2) Validar elección existente y ACTIVA por fechas (dinámico)
        var election = await _db.Elections
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == req.ElectionId, ct);

        if (election is null)
            return NotFound(new { message = "La elección no existe." });

        if (!IsActiveNow(election.StartDate, election.EndDate))
        {
            await _audit.LogAsync(
                userId: voterId.Value,
                action: AuditActions.VoteAttempt,
                details: $"Intento de voto en elección inactiva {election.ElectionId}"
            );

            return BadRequest(new { message = "La elección no está activa." });
        }

        // 3) Validar candidato existente y que pertenezca a la elección
        var candidate = await _db.Candidates
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CandidateId == req.CandidateId, ct);

        if (candidate is null)
            return NotFound(new { message = "El candidato no existe." });

        if (candidate.ElectionId != election.ElectionId)
            return BadRequest(new { message = "El candidato no pertenece a la elección indicada." });

        // 4) Verificar que el usuario NO haya votado en esta elección
        var alreadyVoted = await _db.Votes.AsNoTracking()
            .AnyAsync(v => v.VoterId == voterId.Value && v.ElectionId == req.ElectionId, ct);

        if (alreadyVoted)
        {
            await _audit.LogAsync(
                userId: voterId.Value,
                action: AuditActions.VoteAttempt,
                details: $"Intento de segundo voto en elección {election.ElectionId}"
            );

            return Conflict(new { message = "Ya has emitido tu voto en esta elección." });
        }

        // 5) Registrar voto (con índice único a nivel BD como candado)
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var vote = new Vote
            {
                VoterId = voterId.Value,
                ElectionId = req.ElectionId,
                CandidateId = req.CandidateId,
                CastedAt = DateTime.UtcNow
            };

            _db.Votes.Add(vote);
            await _db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);

            // Log de voto emitido (sin guardar el contenido específico)
            await _audit.LogAsync(
                userId: voterId.Value,
                action: AuditActions.VoteCast,
                details: $"Voto emitido en elección {election.ElectionId}"
            );

            // Email de confirmación
            await SendVoteEmailConfirmationSafe(voterId.Value, election, candidate);

            var resp = new CastVoteResponse
            {
                Message = "Voto registrado con éxito.",
                ElectionId = election.ElectionId,
                ElectionName = election.Name,
                CandidateId = candidate.CandidateId,
                CandidateName = candidate.Name,
                VotedAt = vote.CastedAt
            };

            return Created($"/api/votes/{vote.VoteId}", resp);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sql &&
                                           (sql.Number == 2601 || sql.Number == 2627))
        {
            await tx.RollbackAsync(ct);

            await _audit.LogAsync(
                userId: voterId.Value,
                action: AuditActions.VoteAttempt,
                details: $"Colisión por índice único en elección {election.ElectionId}"
            );

            return Conflict(new { message = "Ya has emitido tu voto en esta elección." });
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    private async Task SendVoteEmailConfirmationSafe(int voterId, Election election, Candidate candidate)
    {
        try
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == voterId);
            if (user is null || string.IsNullOrWhiteSpace(user.Email)) return;

            var body = $@"
                <p>Hola {user.FullName},</p>
                <p>Tu voto fue registrado correctamente en la elección <b>{election.Name}</b>.</p>
                <p>Candidato seleccionado: <b>{candidate.Name}</b> ({candidate.Party})</p>
                <p>Gracias por participar.</p>";
            await _mail.SendAsync(user.Email, "Confirmación de voto", body);
        }
        catch
        {
            // No romper si falla el correo
        }
    }
}
