namespace Server.Models.DTOs;

public class ChangePasswordRequest
{
    public int UserId { get; set; }                
    public string TemporalPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}
