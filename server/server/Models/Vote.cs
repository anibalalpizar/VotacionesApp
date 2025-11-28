namespace Server.Models;

public class Vote
{
    public int VoteId { get; set; }
    public int ElectionId { get; set; }
    public int VoterId { get; set; }
    public int CandidateId { get; set; }
    public DateTime CastedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Election? Election { get; set; }
    public User? Voter { get; set; }
    public Candidate? Candidate { get; set; }
}