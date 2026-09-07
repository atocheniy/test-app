namespace server.Models;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ChatId { get; set; }
    public virtual Chat Chat { get; set; } = null!;
    
    public string SenderId { get; set; } = null!;
    public virtual ApplicationUser Sender { get; set; } = null!;
    
    public string Content { get; set; } = null!;
    public string[] Attachments { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    
    public Guid? ReplyToId { get; set; }
    public Message? ReplyTo { get; set; }
}