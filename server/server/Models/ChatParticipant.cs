namespace server.Models;

public class ChatParticipant
{
    public Guid ChatId { get; set; }
    public virtual Chat Chat { get; set; } = null!;
    
    public string UserId { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; } 
}