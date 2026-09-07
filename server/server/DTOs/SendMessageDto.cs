namespace server.DTOs;

public class SendMessageDto
{
    public Guid ChatId { get; set; }
    public string Content { get; set; } = null!;
    public string[]? Attachments { get; set; }
    
    public Guid? ReplyToId { get; set; }
}