namespace Server.Models;

public class Candidate
{
    public Guid CandidateId { get; set; } = Guid.NewGuid(); 
    public string Name { get; set; } = null!;
    public string? Party { get; set; }

    // FK -> Elections
    public Guid ElectionId { get; set; }
    public Election? Election { get; set; }
}
