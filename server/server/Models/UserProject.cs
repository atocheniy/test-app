using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public enum ProjectStatus
{
    InDevelopment = 0,
    Beta = 1,
    Released = 2,
    Archived = 3
}

public class UserProject
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(500)]
    public string? BannerUrl { get; set; }

    public string[]? Images { get; set; }

    [MaxLength(255)]
    public string? GithubUrl { get; set; }

    [MaxLength(255)]
    public string? LiveUrl { get; set; }

    public string[]? Technologies { get; set; }

    public ProjectStatus Status { get; set; } = ProjectStatus.InDevelopment;

    public int StarsCount { get; set; } = 0;

    public int PostsCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
}
