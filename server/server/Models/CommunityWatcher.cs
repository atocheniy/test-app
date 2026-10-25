namespace server.Models;

public class CommunityWatcher
{
    public Guid CommunityId { get; set; }
    public Community Community { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
