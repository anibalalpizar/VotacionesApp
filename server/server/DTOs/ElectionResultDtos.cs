public class ElectionResultItemDto
{
    public int CandidateId { get; set; }
    public string Name { get; set; } = "";
    public string Party { get; set; } = "";
    public int Votes { get; set; }
}

public class ElectionResultDto
{
    public int ElectionId { get; set; }
    public string ElectionName { get; set; } = "";
    public string? StartDateUtc { get; set; }
    public string? EndDateUtc { get; set; }
    public bool IsClosed { get; set; }
    public int TotalVotes { get; set; }
    public int TotalCandidates { get; set; }
    public List<ElectionResultItemDto> Items { get; set; } = new();
}