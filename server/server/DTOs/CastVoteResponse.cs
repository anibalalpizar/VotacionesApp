namespace Server.DTOs

{
    public class CastVoteResponse
    {
        public string Message { get; set; } = "";
        public int ElectionId { get; set; }
        public string ElectionName { get; set; } = "";
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = "";
        public DateTime VotedAt { get; set; }
    }
}
