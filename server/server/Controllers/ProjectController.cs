using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProjectController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProjectController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Project/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var project = await _context.UserProjects
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound("Проект не найден");

        bool isStarred = false;
        if (!string.IsNullOrEmpty(currentUserId))
        {
            isStarred = await _context.ProjectStars
                .AnyAsync(ps => ps.ProjectId == id && ps.UserId == currentUserId);
        }

        var dto = new ProjectDetailsDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            ImageUrl = project.ImageUrl,
            BannerUrl = project.BannerUrl,
            Images = project.Images ?? Array.Empty<string>(),
            GithubUrl = project.GithubUrl,
            LiveUrl = project.LiveUrl,
            Technologies = project.Technologies ?? Array.Empty<string>(),
            Status = project.Status,
            StarsCount = project.StarsCount,
            PostsCount = project.PostsCount,
            CreatedAt = project.CreatedAt,

            UserId = project.UserId,
            AuthorName = project.User?.FullName ?? "Разработчик",
            AuthorUsername = project.User?.UserName ?? "user",
            AuthorAvatar = project.User?.Avatar,

            IsStarredByMe = isStarred,
            IsMyProject = !string.IsNullOrEmpty(currentUserId) && project.UserId == currentUserId
        };

        return Ok(dto);
    }

    // PUT: api/Project/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var project = await _context.UserProjects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == currentUserId);
        if (project == null) return NotFound("Проект не найден или у вас нет прав на редактирование");

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();
        if (dto.BannerUrl != null) project.BannerUrl = dto.BannerUrl.Trim();
        if (dto.Status.HasValue) project.Status = dto.Status.Value;

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
            BannerUrl = project.BannerUrl,
            Images = project.Images,
            GithubUrl = project.GithubUrl,
            LiveUrl = project.LiveUrl,
            Technologies = project.Technologies,
            Status = project.Status,
            StarsCount = project.StarsCount,
            PostsCount = project.PostsCount,
            CreatedAt = project.CreatedAt
        });
    }

    // POST: api/Project/{id}/star
    [HttpPost("{id}/star")]
    [Authorize]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var project = await _context.UserProjects.FindAsync(id);
        if (project == null) return NotFound("Проект не найден");

        var star = await _context.ProjectStars
            .FirstOrDefaultAsync(ps => ps.ProjectId == id && ps.UserId == currentUserId);

        bool isStarred;
        if (star != null)
        {
            _context.ProjectStars.Remove(star);
            project.StarsCount = Math.Max(0, project.StarsCount - 1);
            isStarred = false;
        }
        else
        {
            _context.ProjectStars.Add(new ProjectStar
            {
                ProjectId = id,
                UserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            });
            project.StarsCount++;
            isStarred = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            isStarred,
            starsCount = project.StarsCount
        });
    }

    // GET: api/Project/{id}/posts
    [HttpGet("{id}/posts")]
    public async Task<IActionResult> GetProjectPosts(Guid id, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 30);

        var query = _context.Post
            .Include(p => p.User)
            .Include(p => p.Project)
            .Include(p => p.Community)
            .Include(p => p.RepostOfPost)
                .ThenInclude(ro => ro.User)
            .Include(p => p.Comments)
                .ThenInclude(c => c.User)
            .Where(p => p.ProjectId == id)
            .OrderByDescending(p => p.Created);

        var total = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new
            {
                id = p.Id,
                content = p.Content,
                created = p.Created,
                attachments = p.Attachments,
                likesCount = p.LikesCount,
                isLikedByMe = !string.IsNullOrEmpty(currentUserId) && _context.PostLikes.Any(pl => pl.PostId == p.Id && pl.UserId == currentUserId),
                commentsCount = p.CommentsCount,
                repostsCount = p.RepostsCount,
                authorName = p.User.FullName,
                authorUsername = p.User.UserName,
                authorAvatar = p.User.Avatar,

                projectId = p.ProjectId,
                project = p.Project == null ? null : new
                {
                    id = p.Project.Id,
                    name = p.Project.Name,
                    imageUrl = p.Project.ImageUrl,
                    status = (int)p.Project.Status
                },

                community = p.Community == null ? null : new
                {
                    id = p.Community.Id,
                    name = p.Community.Name,
                    slug = p.Community.Slug,
                    avatar = p.Community.Avatar
                },

                repostOfPost = p.RepostOfPost == null ? null : new
                {
                    id = p.RepostOfPost.Id,
                    content = p.RepostOfPost.Content,
                    created = p.RepostOfPost.Created,
                    attachments = p.RepostOfPost.Attachments,
                    authorName = p.RepostOfPost.User.FullName,
                    authorUsername = p.RepostOfPost.User.UserName,
                    authorAvatar = p.RepostOfPost.User.Avatar
                },

                commentsList = p.Comments
                    .OrderByDescending(c => c.Created)
                    .Take(3)
                    .Select(c => new
                    {
                        id = c.Id,
                        content = c.Content,
                        created = c.Created,
                        authorName = c.User.FullName,
                        authorUsername = c.User.UserName,
                        authorAvatar = c.User.Avatar
                    })
            })
            .ToListAsync();

        return Ok(new
        {
            items = posts,
            total,
            page,
            limit,
            hasMore = (page * limit) < total
        });
    }
}
