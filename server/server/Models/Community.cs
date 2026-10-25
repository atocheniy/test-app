namespace server.Models;

public class Community
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;   
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Rules { get; set; }
    
    public string? Avatar { get; set; }
    public string? Banner { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public CommunityType Type { get; set; } = CommunityType.Public;
    public CommunityPostingPolicy PostingPolicy { get; set; } = CommunityPostingPolicy.MembersOnly;
    public CommunityKind Kind { get; set; } = CommunityKind.Community;
    
    public string? WebsiteUrl { get; set; }
    public string? Location { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public bool IsVerified { get; set; } = false;
    
    public string CreatorId { get; set; } = string.Empty;
    public ApplicationUser Creator { get; set; }
    
    public int MembersCount { get; set; } = 1;
    public int PostsCount { get; set; } = 0;
    public int WatchersCount { get; set; } = 0;
    
    public ICollection<CommunityMember> Members { get; set; } = new List<CommunityMember>();
    public ICollection<CommunityWatcher> Watchers { get; set; } = new List<CommunityWatcher>();
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<Vacancy> Vacancies { get; set; } = new List<Vacancy>();
}