using System;
using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class Vacancy
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CompanyId { get; set; }
    public Community Company { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int? SalaryFrom { get; set; }
    public int? SalaryTo { get; set; }
    public string? Currency { get; set; } = "USD";

    public WorkFormat Format { get; set; } = WorkFormat.Remote;
    public SeniorityLevel Level { get; set; } = SeniorityLevel.Middle;

    public string[] Stack { get; set; } = Array.Empty<string>();

    public VacancyStatus Status { get; set; } = VacancyStatus.Open;

    public string CreatedById { get; set; } = string.Empty;
    public ApplicationUser CreatedBy { get; set; } = null!;

    public DateTime Created { get; set; } = DateTime.UtcNow;
}
