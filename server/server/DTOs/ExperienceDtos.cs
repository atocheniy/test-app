using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public class CreateExperienceDto
{
    [Required]
    [MaxLength(100)]
    public string CompanyName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Position { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Mode { get; set; }

    [Required]
    [MaxLength(50)]
    public string Period { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class UpdateExperienceDto
{
    [Required]
    [MaxLength(100)]
    public string CompanyName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Position { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Mode { get; set; }

    [Required]
    [MaxLength(50)]
    public string Period { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class ExperienceDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Mode { get; set; }
    public string Period { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
