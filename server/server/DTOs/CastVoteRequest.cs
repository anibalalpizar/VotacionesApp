namespace Server.DTOs

{
    public class CastVoteRequest
    {
        public int ElectionId { get; set; }
        public int CandidateId { get; set; }
    }
}
