using server.Models;

namespace server.DTOs;

public class CreateCommunityDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Avatar { get; set; }
    public string? Banner { get; set; }
    public CommunityType Type { get; set; } = CommunityType.Public;
    public CommunityPostingPolicy PostingPolicy { get; set; } = CommunityPostingPolicy.MembersOnly;
    public CommunityKind Kind { get; set; } = CommunityKind.Community;
    public string? WebsiteUrl { get; set; }
    public string? Location { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
}