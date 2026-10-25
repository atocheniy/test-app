using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.Entity<ChatParticipant>()
            .HasKey(cp => new { cp.ChatId, cp.UserId });
        
        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.Chat)
            .WithMany(c => c.Participants)
            .HasForeignKey(cp => cp.ChatId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.User)
            .WithMany(u => u.Chats)
            .HasForeignKey(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.Entity<CommunityMember>()
            .HasKey(cm => new { cm.CommunityId, cm.UserId });
        
        builder.Entity<Community>()
            .HasIndex(c => c.Slug)
            .IsUnique();
        
        builder.Entity<Community>()
            .HasOne(c => c.Creator)
            .WithMany()
            .HasForeignKey(c => c.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.Entity<Post>()
            .HasOne(p => p.Community)
            .WithMany(c => c.Posts)
            .HasForeignKey(p => p.CommunityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CommunityWatcher>()
            .HasKey(cw => new { cw.CommunityId, cw.UserId });

        builder.Entity<CommunityWatcher>()
            .HasOne(cw => cw.Community)
            .WithMany(c => c.Watchers)
            .HasForeignKey(cw => cw.CommunityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CommunityWatcher>()
            .HasOne(cw => cw.User)
            .WithMany()
            .HasForeignKey(cw => cw.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserWatcher>()
            .HasKey(uw => new { uw.WatcherId, uw.TargetUserId });

        builder.Entity<UserWatcher>()
            .HasOne(uw => uw.Watcher)
            .WithMany()
            .HasForeignKey(uw => uw.WatcherId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserWatcher>()
            .HasOne(uw => uw.TargetUser)
            .WithMany()
            .HasForeignKey(uw => uw.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Vacancy>()
            .HasOne(v => v.Company)
            .WithMany(c => c.Vacancies)
            .HasForeignKey(v => v.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Vacancy>()
            .HasOne(v => v.CreatedBy)
            .WithMany()
            .HasForeignKey(v => v.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<UserProject>()
            .HasOne(p => p.User)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserExperience>()
            .HasOne(e => e.User)
            .WithMany(u => u.Experiences)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ProjectStar>()
            .HasKey(ps => new { ps.ProjectId, ps.UserId });

        builder.Entity<ProjectStar>()
            .HasOne(ps => ps.Project)
            .WithMany()
            .HasForeignKey(ps => ps.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ProjectStar>()
            .HasOne(ps => ps.User)
            .WithMany()
            .HasForeignKey(ps => ps.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Post>()
            .HasOne(p => p.Project)
            .WithMany(pr => pr.Posts)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }

public DbSet<server.Models.Post> Post { get; set; } = default!;

public DbSet<server.Models.Comment> Comment { get; set; } = default!;

public DbSet<server.Models.Message> Message { get; set; } = default!;

public DbSet<server.Models.Chat> Chat { get; set; } = default!;

public DbSet<server.Models.ChatParticipant> ChatParticipant { get; set; } = default!;

public DbSet<server.Models.PostLike> PostLikes { get; set; } = default!;

public DbSet<server.Models.Community> Communities { get; set; } = default!;

public DbSet<server.Models.CommunityMember> CommunityMembers { get; set; } = default!;

public DbSet<server.Models.CommunityWatcher> CommunityWatchers { get; set; } = default!;

public DbSet<server.Models.UserWatcher> UserWatchers { get; set; } = default!;

public DbSet<server.Models.Vacancy> Vacancies { get; set; } = default!;

public DbSet<server.Models.UserProject> UserProjects { get; set; } = default!;

public DbSet<server.Models.UserExperience> UserExperiences { get; set; } = default!;

public DbSet<server.Models.ProjectStar> ProjectStars { get; set; } = default!;
}

