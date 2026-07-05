namespace server.DTOs;

public class CreatePostDto
{
    public string? Content { get; set; }
    public string[]? Attachments { get; set; }
}