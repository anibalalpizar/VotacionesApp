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
        base.OnModelCreating(b);

        //Users 
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).ValueGeneratedOnAdd();

            e.HasIndex(x => x.Identification).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();

            e.Property(x => x.Identification).HasMaxLength(50).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();

            // PasswordHash requerido
            e.Property(x => x.PasswordHash).IsRequired();

            e.Property(x => x.Role)
             .HasConversion<string>()
             .HasMaxLength(20)
             .IsRequired();
        });

        //Elections
        b.Entity<Election>(e =>
        {
            e.ToTable("Elections");
            e.HasKey(x => x.ElectionId);

            e.Property(x => x.Name).HasMaxLength(200).IsRequired();

            // Nombre de elección único
            e.HasIndex(x => x.Name).IsUnique();

            // Campos de periodo 
            // Estado con tamaño controlado
            e.Property(x => x.Status).HasMaxLength(20);
        });

        // Candidates (FK -> Elections) 
        // - Agrupación-partido requerido (Group)
        // - Índice único (ElectionId, Name) para evitar duplicados por elección
        b.Entity<Candidate>(e =>
        {
            e.ToTable("Candidates");
            e.HasKey(x => x.CandidateId);

            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Group).HasMaxLength(200).IsRequired();

            e.HasOne(x => x.Election)
             .WithMany()
             .HasForeignKey(x => x.ElectionId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasIndex(x => new { x.ElectionId, x.Name }).IsUnique();
        });

        //Votes (FKs -> Elections, Users, Candidates) 
        b.Entity<Vote>(e =>
        {
            e.ToTable("Votes");
            e.HasKey(x => x.VoteId);

            e.HasOne(x => x.Voter)
             .WithMany()
             .HasForeignKey(x => x.VoterId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(x => x.Election)
             .WithMany()
             .HasForeignKey(x => x.ElectionId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(x => x.Candidate)
             .WithMany()
             .HasForeignKey(x => x.CandidateId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        //AuditLog (FK -> Users) 
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

        foreach (var fk in b.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}
