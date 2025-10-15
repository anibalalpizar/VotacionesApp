namespace Server.Models;

public class Election
{
    public int ElectionId { get; set; } 
    public string Name { get; set; } = null!;
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
}
