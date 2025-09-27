namespace Server.DTOs;
public record CreateVoterRequest(string Identification, string Email, string Password);
public record VoterResponse(Guid Id, string Identification, string Email);
