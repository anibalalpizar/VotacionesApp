namespace Server.DTOs;

public class CandidateCreateDto
{
    public int ElectionId { get; set; }
    public string Name { get; set; } = "";
    public string Party { get; set; } = "";
}

public class CandidateUpdateDto
{
    public string Name { get; set; } = "";
    public string Party { get; set; } = "";
}

public class CandidateDto
{
    public int CandidateId { get; set; }
    public int ElectionId { get; set; }
    public string Name { get; set; } = "";
    public string Party { get; set; } = "";
}
