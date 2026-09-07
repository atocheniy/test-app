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
    }

public DbSet<server.Models.Post> Post { get; set; } = default!;

public DbSet<server.Models.Comment> Comment { get; set; } = default!;

public DbSet<server.Models.Message> Message { get; set; } = default!;

public DbSet<server.Models.Chat> Chat { get; set; } = default!;

public DbSet<server.Models.ChatParticipant> ChatParticipant { get; set; } = default!;

public DbSet<server.Models.PostLike> PostLikes { get; set; } = default!;
}

