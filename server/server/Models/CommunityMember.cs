namespace server.Models;

public class CommunityMember
{
    public Guid CommunityId { get; set; }
    public Community Community { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; }

    public CommunityRole Role { get; set; } = CommunityRole.Member;
    public MemberStatus Status { get; set; } = MemberStatus.Active;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}