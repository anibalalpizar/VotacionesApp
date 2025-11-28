namespace Server.Models;

public class Election
{
    public int ElectionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Navigation properties
    public ICollection<Candidate> Candidates { get; set; } = new List<Candidate>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}