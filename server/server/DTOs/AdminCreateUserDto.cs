using System.ComponentModel.DataAnnotations;

namespace Server.Models.DTOs
{
    public class AdminCreateUserDto
    {
        [Required(ErrorMessage = "La identificación es requerida. Por favor, complete el campo de 'Identificación'")]
        public string Identification { get; set; } = default!;

        [Required(ErrorMessage = "El nombre es requerido. Por favor, complete el campo de 'Nombre Completo'")]
        public string FullName { get; set; } = default!;

        [Required(ErrorMessage = "El email es requerido. Por favor, complete el campo de 'Correo Electrónico'")]
        [EmailAddress(ErrorMessage = "El correo ingresado no tiene un formato válido.")]
        public string Email { get; set; } = default!;
    }
}
