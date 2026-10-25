using System;
using System.ComponentModel.DataAnnotations;
using server.Models;

namespace server.DTOs;

public class CreateProjectDto
{
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
}

public class UpdateProjectDto
{
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

    public ProjectStatus? Status { get; set; }
}

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string[]? Images { get; set; }
    public string? GithubUrl { get; set; }
    public string? LiveUrl { get; set; }
    public string[]? Technologies { get; set; }
    public ProjectStatus Status { get; set; }
    public int StarsCount { get; set; }
    public int PostsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProjectDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string[]? Images { get; set; }
    public string? GithubUrl { get; set; }
    public string? LiveUrl { get; set; }
    public string[]? Technologies { get; set; }
    public ProjectStatus Status { get; set; }
    public int StarsCount { get; set; }
    public int PostsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorUsername { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    
    public bool IsStarredByMe { get; set; } = false;
    public bool IsMyProject { get; set; } = false;
}
