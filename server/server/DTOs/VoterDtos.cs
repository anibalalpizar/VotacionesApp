namespace Server.DTOs;

public record CreateVoterRequest(string Identification, string FullName, string Email, string Password);
public record VoterResponse(int UserId, string Identification, string FullName, string Email, string Role);
