using Microsoft.AspNetCore.Identity;

namespace server.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    
    public string? Bio_FirstLine { get; set; }
    public string? Bio_SecondLine { get; set; }
    
    public string? Avatar { get; set; }
    public string? Banner { get; set; }
    
    public string? Location { get; set; }
    public string? WorkStatus { get; set; }
    
    public string? GithubUrl { get; set; }
    public string? TelegramUrl { get; set; }
    public string? VKUrl { get; set; }
    public string? XUrl { get; set; }
    public string? DiscordUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    
    public int? Followers { get; set; } = 0;
    public int? Followings { get; set; } = 0;
    
    public string[]? Technologies { get; set; }
    
    public string? Focus { get; set; }
    
    public bool IsActive { get; set; } = true;
    public string? Room { get; set; }
    public string PreferredLanguage { get; set; } = "ru";
    
    public virtual ICollection<ChatParticipant> Chats { get; set; } = new List<ChatParticipant>();
    public virtual ICollection<UserProject> Projects { get; set; } = new List<UserProject>();
    public virtual ICollection<UserExperience> Experiences { get; set; } = new List<UserExperience>();
    
    public DateTime ConnectedAt { get; set; }
}