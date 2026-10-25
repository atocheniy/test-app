using System;

namespace server.DTOs;

public class CreatePostDto
{
    public string? Content { get; set; }
    public string[]? Attachments { get; set; }
    public Guid? RepostOfPostId { get; set; } 
    public Guid? CommunityId { get; set; } 
    public Guid? ProjectId { get; set; }
    public bool ShowInGeneralFeed { get; set; } = true;
}