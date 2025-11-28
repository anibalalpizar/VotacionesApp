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

        // Users
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("userid").ValueGeneratedOnAdd();

            e.HasIndex(x => x.Identification).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();

            e.Property(x => x.Identification).HasColumnName("identification").HasMaxLength(50).IsRequired();
            e.Property(x => x.FullName).HasColumnName("fullname").HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("passwordhash").HasMaxLength(255).IsRequired();
            e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("createdat").HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.TemporalPassword).HasColumnName("temporalpassword").HasMaxLength(255);
        });

        // Elections
        b.Entity<Election>(e =>
        {
            e.ToTable("elections");
            e.HasKey(x => x.ElectionId);
            e.Property(x => x.ElectionId).HasColumnName("electionid").ValueGeneratedOnAdd();
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            e.Property(x => x.StartDate).HasColumnName("startdate").IsRequired();
            e.Property(x => x.EndDate).HasColumnName("enddate").IsRequired();
        });

        // Candidates
        b.Entity<Candidate>(e =>
        {
            e.ToTable("candidates");
            e.HasKey(x => x.CandidateId);
            e.Property(x => x.CandidateId).HasColumnName("candidateid").ValueGeneratedOnAdd();
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Party).HasColumnName("party").HasMaxLength(200);
            e.Property(x => x.ElectionId).HasColumnName("electionid");

            e.HasOne(x => x.Election)
                .WithMany(el => el.Candidates)
                .HasForeignKey(x => x.ElectionId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.ElectionId, x.Name }).IsUnique();
        });

        // Votes
        b.Entity<Vote>(e =>
        {
            e.ToTable("votes");
            e.HasKey(x => x.VoteId);
            e.Property(x => x.VoteId).HasColumnName("voteid").ValueGeneratedOnAdd();
            e.Property(x => x.ElectionId).HasColumnName("electionid");
            e.Property(x => x.VoterId).HasColumnName("voterid");
            e.Property(x => x.CandidateId).HasColumnName("candidateid");
            e.Property(x => x.CastedAt).HasColumnName("castedat").HasDefaultValueSql("CURRENT_TIMESTAMP");

            e.HasOne(x => x.Voter)
                .WithMany()
                .HasForeignKey(x => x.VoterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Election)
                .WithMany(el => el.Votes)
                .HasForeignKey(x => x.ElectionId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Candidate)
                .WithMany()
                .HasForeignKey(x => x.CandidateId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.VoterId, x.ElectionId }).IsUnique();
        });

        // AuditLog
        b.Entity<AuditLog>(e =>
        {
            e.ToTable("auditlog");
            e.HasKey(x => x.AuditId);
            e.Property(x => x.AuditId).HasColumnName("auditid").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("userid");
            e.Property(x => x.Action).HasColumnName("action").HasMaxLength(50).IsRequired();
            e.Property(x => x.Details).HasColumnName("details").HasMaxLength(255);
            e.Property(x => x.Timestamp).HasColumnName("timestamp").HasDefaultValueSql("CURRENT_TIMESTAMP");

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}