namespace server.DTOs;

public class MessageDto
{
    public Guid Id { get; set; }
    public string SenderId { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string[] Attachments { get; set; }
    public string Time { get; set; } = null!;
    public bool IsRead { get; set; }
    public bool IsMine { get; set; }  
}