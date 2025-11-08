namespace Server.DTOs;

public class ParticipationReportDto
{
    public int ElectionId { get; set; }
    public string ElectionName { get; set; } = string.Empty;

    public int TotalVoters { get; set; }
    public int TotalVoted { get; set; }
    public int NotParticipated { get; set; }

    public double ParticipationPercent { get; set; }      
    public double NonParticipationPercent { get; set; }  

    public DateTimeOffset? StartDateUtc { get; set; }
    public DateTimeOffset? EndDateUtc { get; set; }
    public bool IsClosed { get; set; }
}
