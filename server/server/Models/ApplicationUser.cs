using Microsoft.AspNetCore.Identity;

namespace server.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    
    public string? Bio_FirstLine { get; set; }
    public string? Bio_SecondLine { get; set; }
    
    public string? Avatar { get; set; }
    public string? Banner { get; set; }
    
    public int? Followers { get; set; } = 0;
    public int? Followings { get; set; } = 0;
    
    public string[]? Technologies { get; set; }
}