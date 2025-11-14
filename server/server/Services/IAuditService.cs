namespace Server.Services;

/// <summary>
/// Servicio para registrar acciones de auditoría en el sistema
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Registra una acción de auditoría
    /// </summary>
    /// <param name="userId">ID del usuario que ejecuta la acción</param>
    /// <param name="action">Descripción de la acción realizada</param>
    /// <param name="details">Detalles adicionales opcionales (máx 255 caracteres)</param>
    /// <param name="ct">Token de cancelación</param>
    Task LogAsync(int userId, string action, string? details = null, CancellationToken ct = default);

    /// <summary>
    /// Registra una acción de auditoría usando el HttpContext para obtener el userId del token JWT
    /// </summary>
    /// <param name="action">Descripción de la acción realizada</param>
    /// <param name="details">Detalles adicionales opcionales (máx 255 caracteres)</param>
    /// <param name="ct">Token de cancelación</param>
    Task LogAsync(string action, string? details = null, CancellationToken ct = default);
}