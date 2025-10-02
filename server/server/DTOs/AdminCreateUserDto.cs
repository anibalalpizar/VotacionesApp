using System.ComponentModel.DataAnnotations;

namespace Server.Models.DTOs
{
    public class AdminCreateUserDto
    {
        [Required, StringLength(50)]
        public string Identification { get; set; } = default!;

        [Required, StringLength(150)]
        public string FullName { get; set; } = default!;

        [Required, EmailAddress, StringLength(200)]
        public string Email { get; set; } = default!;
    }
}
