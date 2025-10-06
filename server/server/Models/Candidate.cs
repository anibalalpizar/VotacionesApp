namespace Server.Models;

public class Candidate
{
    public int CandidateId { get; set; }
    public string Name { get; set; } = null!;
    public string? Group { get; set; }

    // FK -> Elections
    public int ElectionId { get; set; }
    public Election? Election { get; set; }
}
