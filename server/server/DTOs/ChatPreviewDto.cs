namespace server.DTOs;

public class ChatPreviewDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string? Avatar { get; set; }
    public string Content { get; set; } = null!;
    public string Time { get; set; } = null!;
    public int UnreadCount { get; set; } 
}