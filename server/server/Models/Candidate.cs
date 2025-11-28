namespace Server.Models;

public class Candidate
{
    public int CandidateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Party { get; set; }

    // Foreign Key
    public int ElectionId { get; set; }

    // Navigation Property
    public Election? Election { get; set; }
}