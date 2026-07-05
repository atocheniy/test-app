namespace server.Models;

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Content { get; set; } = string.Empty;
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public Guid PostId { get; set; }
    public Post Post { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; }
}