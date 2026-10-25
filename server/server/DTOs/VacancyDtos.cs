using System;
using System.ComponentModel.DataAnnotations;
using server.Models;

namespace server.DTOs;

public class CreateVacancyDto
{
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
}

public class UpdateVacancyDto
{
    [MaxLength(200)]
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? SalaryFrom { get; set; }
    public int? SalaryTo { get; set; }
    public string? Currency { get; set; }
    public WorkFormat? Format { get; set; }
    public SeniorityLevel? Level { get; set; }
    public string[]? Stack { get; set; }
    public VacancyStatus? Status { get; set; }
}

public class VacancyDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CompanySlug { get; set; } = string.Empty;
    public string? CompanyAvatar { get; set; }
    public string? CompanyLocation { get; set; }
    public bool IsCompanyVerified { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? SalaryFrom { get; set; }
    public int? SalaryTo { get; set; }
    public string? Currency { get; set; }
    public WorkFormat Format { get; set; }
    public SeniorityLevel Level { get; set; }
    public string[] Stack { get; set; } = Array.Empty<string>();
    public VacancyStatus Status { get; set; }

    public string CreatedById { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
    public string? CreatedByUsername { get; set; }
    public string? CreatedByAvatar { get; set; }

    public DateTime Created { get; set; }

    public int? MatchPercent { get; set; }
    public string? MatchReason { get; set; }
    public double? Score { get; set; }
}
