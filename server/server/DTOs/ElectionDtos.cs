using System.ComponentModel.DataAnnotations;

namespace Server.DTOs;

public class CreateElectionDto
{
    [Required, StringLength(200)]
    public string Name { get; set; } = "";

    [Required]
    public DateTime StartDateUtc { get; set; }

    [Required]
    public DateTime EndDateUtc { get; set; }
}

public class UpdateElectionDto
{
    [Required, StringLength(200)]
    public string Name { get; set; } = "";

    [Required]
    public DateTime StartDateUtc { get; set; }

    [Required]
    public DateTime EndDateUtc { get; set; }

    public string? Status { get; set; }
}

public class ElectionDto
{
    public int ElectionId { get; set; }
    public string Name { get; set; } = "";
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public string Status { get; set; } = "Scheduled";

    public int CandidateCount { get; set; }
    public int VoteCount { get; set; }
}
