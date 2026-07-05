namespace server.Models;

public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public string? Content { get; set; }
    
    public string[] Attachments { get; set; }
    
    public int LikesCount { get; set; } = 0;
    public int CommentsCount { get; set; } = 0;
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; }
}