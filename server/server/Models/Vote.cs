namespace Server.Models;

public class Vote
{
    public Guid VoteId { get; set; } = Guid.NewGuid();
    public Guid ElectionId { get; set; }
    public int VoterId { get; set; }         
    public Guid CandidateId { get; set; }
    public DateTime CastedAt { get; set; } = DateTime.UtcNow;

    public Election? Election { get; set; }
    public User? Voter { get; set; }
    public Candidate? Candidate { get; set; }
}
