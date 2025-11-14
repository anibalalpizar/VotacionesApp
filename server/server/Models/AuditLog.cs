using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

[Table("AuditLog")]
public class AuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AuditId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }

    [MaxLength(255)]
    public string? Details { get; set; }

    // Relación con User
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}