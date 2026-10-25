using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProfileDetailsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfileDetailsController(ApplicationDbContext context)
    {
        _context = context;
    }
    
    [HttpPost("projects")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var images = dto.Images ?? (string.IsNullOrEmpty(dto.ImageUrl) ? Array.Empty<string>() : new[] { dto.ImageUrl });
        var imageUrl = dto.ImageUrl ?? images.FirstOrDefault();

        var project = new UserProject
        {
            UserId = currentUserId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            ImageUrl = imageUrl?.Trim(),
            Images = images,
            BannerUrl = dto.BannerUrl?.Trim(),
            Status = dto.Status,
            GithubUrl = dto.GithubUrl?.Trim(),
            LiveUrl = dto.LiveUrl?.Trim(),
            Technologies = dto.Technologies ?? Array.Empty<string>(),
            CreatedAt = DateTime.UtcNow
        };

        _context.UserProjects.Add(project);
        await _context.SaveChangesAsync();

        return Ok(new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            ImageUrl = project.ImageUrl,
            Images = project.Images,
            BannerUrl = project.BannerUrl,
            Status = project.Status,
            StarsCount = project.StarsCount,
            PostsCount = project.PostsCount,
            GithubUrl = project.GithubUrl,
            LiveUrl = project.LiveUrl,
            Technologies = project.Technologies,
            CreatedAt = project.CreatedAt
        });
    }

    [HttpPut("projects/{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var project = await _context.UserProjects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);
        if (project == null) return NotFound("Проект не найден");

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();
        if (dto.BannerUrl != null)
        {
            project.BannerUrl = dto.BannerUrl.Trim();
        }
        if (dto.Status.HasValue)
        {
            project.Status = dto.Status.Value;
        }
        if (dto.Images != null)
        {
            project.Images = dto.Images;
            project.ImageUrl = dto.ImageUrl ?? dto.Images.FirstOrDefault();
        }
        else if (dto.ImageUrl != null)
        {
            project.ImageUrl = dto.ImageUrl.Trim();
            if (project.Images == null || project.Images.Length == 0)
            {
                project.Images = new[] { project.ImageUrl };
            }
        }
        project.GithubUrl = dto.GithubUrl?.Trim();
        project.LiveUrl = dto.LiveUrl?.Trim();
        if (dto.Technologies != null) project.Technologies = dto.Technologies;

        await _context.SaveChangesAsync();

        return Ok(new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            ImageUrl = project.ImageUrl,
            Images = project.Images,
            BannerUrl = project.BannerUrl,
            Status = project.Status,
            StarsCount = project.StarsCount,
            PostsCount = project.PostsCount,
            GithubUrl = project.GithubUrl,
            LiveUrl = project.LiveUrl,
            Technologies = project.Technologies,
            CreatedAt = project.CreatedAt
        });
    }

    [HttpDelete("projects/{id}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var project = await _context.UserProjects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);
        if (project == null) return NotFound("Проект не найден");

        _context.UserProjects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    
    [HttpPost("experiences")]
    public async Task<IActionResult> CreateExperience([FromBody] CreateExperienceDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var exp = new UserExperience
        {
            UserId = currentUserId,
            CompanyName = dto.CompanyName.Trim(),
            Position = dto.Position.Trim(),
            Mode = dto.Mode?.Trim(),
            Period = dto.Period.Trim(),
            Description = dto.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.UserExperiences.Add(exp);
        await _context.SaveChangesAsync();

        return Ok(new ExperienceDto
        {
            Id = exp.Id,
            CompanyName = exp.CompanyName,
            Position = exp.Position,
            Mode = exp.Mode,
            Period = exp.Period,
            Description = exp.Description,
            CreatedAt = exp.CreatedAt
        });
    }

    [HttpPut("experiences/{id}")]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] UpdateExperienceDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var exp = await _context.UserExperiences.FirstOrDefaultAsync(e => e.Id == id && e.UserId == currentUserId);
        if (exp == null) return NotFound("Место работы не найдено");

        exp.CompanyName = dto.CompanyName.Trim();
        exp.Position = dto.Position.Trim();
        exp.Mode = dto.Mode?.Trim();
        exp.Period = dto.Period.Trim();
        exp.Description = dto.Description?.Trim();

        await _context.SaveChangesAsync();

        return Ok(new ExperienceDto
        {
            Id = exp.Id,
            CompanyName = exp.CompanyName,
            Position = exp.Position,
            Mode = exp.Mode,
            Period = exp.Period,
            Description = exp.Description,
            CreatedAt = exp.CreatedAt
        });
    }

    [HttpDelete("experiences/{id}")]
    public async Task<IActionResult> DeleteExperience(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var exp = await _context.UserExperiences.FirstOrDefaultAsync(e => e.Id == id && e.UserId == currentUserId);
        if (exp == null) return NotFound("Место работы не найдено");

        _context.UserExperiences.Remove(exp);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
