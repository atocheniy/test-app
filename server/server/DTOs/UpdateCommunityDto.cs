using server.Models;

namespace server.DTOs;

public class UpdateCommunityDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public string? Avatar { get; set; }
    public string? Banner { get; set; }
    public CommunityType? Type { get; set; }
    public CommunityPostingPolicy? PostingPolicy { get; set; }
    public CommunityKind? Kind { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Location { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
}