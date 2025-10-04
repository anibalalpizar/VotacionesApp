namespace Server.DTOs;

public class CreateCandidateDto
{
    public int ElectionId { get; set; }
    public string Name { get; set; } = "";
    public string GroupName { get; set; } = ""; // agrupación - partido
}

public class UpdateCandidateDto
{
    public string Name { get; set; } = "";
    public string GroupName { get; set; } = "";
}
