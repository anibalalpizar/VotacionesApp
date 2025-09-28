using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Election> Elections => Set<Election>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Vote> Votes => Set<Vote>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Users
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Identification).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Identification).HasMaxLength(50).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).IsRequired();
        });

        // Elections
        b.Entity<Election>(e =>
        {
            e.ToTable("Elections");
            e.HasKey(x => x.ElectionId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        // Candidates (FK -> Elections)  SIN CASCADA
        b.Entity<Candidate>(e =>
        {
            e.ToTable("Candidates");
            e.HasKey(x => x.CandidateId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Party).HasMaxLength(200);

            e.HasOne(x => x.Election)
             .WithMany()
             .HasForeignKey(x => x.ElectionId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        // Votes (FKs -> Elections, Users, Candidates)  TODAS SIN CASCADA
        b.Entity<Vote>(e =>
        {
            e.ToTable("Votes");
            e.HasKey(x => x.VoteId);

            e.HasOne(x => x.Election)
             .WithMany()
             .HasForeignKey(x => x.ElectionId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(x => x.Voter)
             .WithMany()
             .HasForeignKey(x => x.VoterId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(x => x.Candidate)
             .WithMany()
             .HasForeignKey(x => x.CandidateId)
             .OnDelete(DeleteBehavior.NoAction);

            // e.HasIndex(x => new { x.ElectionId, x.VoterId }).IsUnique();
        });

        // AuditLog (FK -> Users)  SIN CASCADA
        b.Entity<AuditLog>(e =>
        {
            e.ToTable("AuditLog");
            e.HasKey(x => x.AuditId);
            e.Property(x => x.Action).HasMaxLength(200).IsRequired();

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        // 🔒 Fuerza TODAS las FKs a Restrict (anti-cascada total)
        foreach (var fk in b.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}

// ---------- Clases mínimas para que EF cree las tablas ----------
public class Election
{
    public Guid ElectionId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
}

public class Candidate
{
    public Guid CandidateId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public string? Party { get; set; }
    public Guid ElectionId { get; set; }
    public Election? Election { get; set; }
}

public class Vote
{
    public Guid VoteId { get; set; } = Guid.NewGuid();
    public Guid ElectionId { get; set; }
    public Guid VoterId { get; set; }
    public Guid CandidateId { get; set; }
    public DateTime CastedAt { get; set; } = DateTime.UtcNow;

    public Election? Election { get; set; }
    public User? Voter { get; set; }
    public Candidate? Candidate { get; set; }
}

public class AuditLog
{
    public Guid AuditId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Action { get; set; } = null!;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }

    public User? User { get; set; }
}
