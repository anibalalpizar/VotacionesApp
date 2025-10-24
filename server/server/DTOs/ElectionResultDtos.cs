namespace Server.DTOs;

public sealed class ElectionResultItemDto
{
    public int CandidateId { get; set; }
    public string Name { get; set; } = "";
    public string Party { get; set; } = "";
    public int Votes { get; set; }
}

public sealed class ElectionResultDto
{
    public int ElectionId { get; set; }
    public string ElectionName { get; set; } = "";
    public DateTimeOffset? StartDateUtc { get; set; }
    public DateTimeOffset? EndDateUtc { get; set; }
    public bool IsClosed { get; set; }
    public int TotalVotes { get; set; }
    public int TotalCandidates { get; set; }
    public List<ElectionResultItemDto> Items { get; set; } = new();
}
