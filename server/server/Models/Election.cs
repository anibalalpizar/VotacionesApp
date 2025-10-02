namespace Server.Models;

public class Election
{
    public Guid ElectionId { get; set; } = Guid.NewGuid();  
    public string Name { get; set; } = null!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
}
