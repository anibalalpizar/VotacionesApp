namespace Server.Models;

public class Election
{
    public int ElectionId { get; set; } 
    public string Name { get; set; } = null!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
