namespace Server.Utils;

/// <summary>
/// Acciones de auditoría estandarizadas para el sistema
/// </summary>
public static class AuditActions
{
    // Autenticación
    public const string LoginSuccess = "Login exitoso";
    public const string LoginFailed = "Login fallido";
    public const string PasswordChanged = "Cambio de contraseña";
    public const string PasswordRecovery = "Recuperación de contraseña";

    // Votación
    public const string VoteCast = "Voto emitido";
    public const string VoteAttempt = "Intento de voto";

    // Consultas
    public const string ResultsViewed = "Consulta de resultados";
    public const string ElectionViewed = "Consulta de elección";

    // Administración de elecciones
    public const string ElectionCreated = "Elección creada";
    public const string ElectionUpdated = "Elección actualizada";
    public const string ElectionDeleted = "Elección eliminada";

    // Administración de candidatos
    public const string CandidateCreated = "Candidato creado";
    public const string CandidateUpdated = "Candidato actualizado";
    public const string CandidateDeleted = "Candidato eliminado";

    // Administración de usuarios
    public const string UserCreated = "Usuario creado";
    public const string UserUpdated = "Usuario actualizado";
    public const string UserDeleted = "Usuario eliminado";

    // Auditoría
    public const string AuditViewed = "Consulta de auditoría";
}