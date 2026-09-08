namespace server.Models;

public class PostRepost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; }

    public Guid PostId { get; set; }
    public Post Post { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}