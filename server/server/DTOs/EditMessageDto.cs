namespace server.DTOs;

public class EditMessageDto
{
    public string Content { get; set; } = null!;
    public string[] Attachments { get; set; }
}