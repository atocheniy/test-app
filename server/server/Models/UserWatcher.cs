namespace server.Models;

public class UserWatcher
{
    public string WatcherId { get; set; } = string.Empty;
    public ApplicationUser Watcher { get; set; }

    public string TargetUserId { get; set; } = string.Empty;
    public ApplicationUser TargetUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
