using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CommunityController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommunityController(ApplicationDbContext context)
    {
        _context = context;
    }
    
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateCommunityDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        
        var cleanSlug = model.Slug.Trim().ToLower().Replace(" ", "-");
        if (await _context.Communities.AnyAsync(c => c.Slug == cleanSlug))
        {
            return BadRequest(new { message = "Этот URL (слаг) уже занят другим сообществом" });
        }

        var community = new Community
        {
            Name = model.Name.Trim(),
            Slug = cleanSlug,
            Description = model.Description,
            Avatar = model.Avatar,
            Banner = model.Banner,
            Type = model.Type,
            PostingPolicy = model.PostingPolicy,
            Kind = model.Kind,
            WebsiteUrl = model.WebsiteUrl,
            Location = model.Location,
            Industry = model.Industry,
            CompanySize = model.CompanySize,
            CreatorId = userId,
            MembersCount = 1
        };

        _context.Communities.Add(community);
        
        var member = new CommunityMember
        {
            CommunityId = community.Id,
            UserId = userId,
            Role = CommunityRole.Owner,
            Status = MemberStatus.Active
        };
        _context.CommunityMembers.Add(member);

        var watcher = new CommunityWatcher
        {
            CommunityId = community.Id,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.CommunityWatchers.Add(watcher);
        community.WatchersCount = 1;

        await _context.SaveChangesAsync();

        return Ok(new { slug = community.Slug, message = "Сообщество успешно создано" });
    }
    
    [HttpPut("update/{slug}")]
    [Authorize]
    public async Task<IActionResult> Update(string slug, [FromBody] UpdateCommunityDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var community = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == slug.ToLower());

        if (community == null) return NotFound();
        
        var member = community.Members.FirstOrDefault(m => m.UserId == userId);
        if (member == null || (member.Role != CommunityRole.Owner && member.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        if (!string.IsNullOrWhiteSpace(model.Name)) community.Name = model.Name.Trim();
        community.Description = model.Description;
        community.Rules = model.Rules;
        if (model.Type.HasValue) community.Type = model.Type.Value;
        if (model.PostingPolicy.HasValue) community.PostingPolicy = model.PostingPolicy.Value;
        if (model.Kind.HasValue) community.Kind = model.Kind.Value;
        if (model.WebsiteUrl != null) community.WebsiteUrl = model.WebsiteUrl;
        if (model.Location != null) community.Location = model.Location;
        if (model.Industry != null) community.Industry = model.Industry;
        if (model.CompanySize != null) community.CompanySize = model.CompanySize;
        if (!string.IsNullOrWhiteSpace(model.Avatar)) community.Avatar = model.Avatar;
        if (!string.IsNullOrWhiteSpace(model.Banner)) community.Banner = model.Banner;

        await _context.SaveChangesAsync();

        return Ok(new { 
            name = community.Name, 
            description = community.Description,
            rules = community.Rules,
            type = community.Type,
            postingPolicy = community.PostingPolicy,
            kind = community.Kind,
            websiteUrl = community.WebsiteUrl,
            location = community.Location,
            industry = community.Industry,
            companySize = community.CompanySize,
            avatar = community.Avatar,
            banner = community.Banner
        });
    }
    
    [HttpGet("get/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var cleanSlug = slug.Trim().ToLower();

        var community = await _context.Communities
            .Include(c => c.Creator)
            .Where(c => c.Slug == cleanSlug)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                description = c.Description,
                rules = c.Rules,
                avatar = c.Avatar,
                banner = c.Banner,
                created = c.Created,
                membersCount = c.MembersCount,
                watchersCount = c.WatchersCount,
                postsCount = c.PostsCount,
                type = c.Type,
                postingPolicy = c.PostingPolicy,
                kind = c.Kind,
                websiteUrl = c.WebsiteUrl,
                location = c.Location,
                industry = c.Industry,
                companySize = c.CompanySize,
                isVerified = c.IsVerified,
                vacanciesCount = c.Vacancies.Count(v => v.Status == VacancyStatus.Open),
                
                creatorName = c.Creator.FullName,
                creatorUsername = c.Creator.UserName,
                creatorAvatar = c.Creator.Avatar, 
                
                membersList = c.Members
                    .Where(m => m.Status == MemberStatus.Active)
                    .OrderByDescending(m => m.Role)
                    .Take(16)
                    .Select(m => new {
                        id = m.UserId,
                        name = m.User.FullName,
                        username = m.User.UserName,
                        avatar = m.User.Avatar,
                        role = m.Role
                    }),
                
                isMember = currentUserId != null && c.Members.Any(m => m.UserId == currentUserId && m.Status == MemberStatus.Active),
                isWatching = currentUserId != null && c.Watchers.Any(w => w.UserId == currentUserId),
                myRole = currentUserId != null 
                    ? c.Members.Where(m => m.UserId == currentUserId).Select(m => (CommunityRole?)m.Role).FirstOrDefault() 
                    : null,
                myMemberStatus = currentUserId != null 
                    ? c.Members.Where(m => m.UserId == currentUserId).Select(m => (MemberStatus?)m.Status).FirstOrDefault() 
                    : null
            })
            .FirstOrDefaultAsync();

        if (community == null) return NotFound("Сообщество не найдено");

        return Ok(community);
    }
    
    [HttpPost("toggleJoin/{slug}")]
    [Authorize]
    public async Task<IActionResult> ToggleJoin(string slug)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var community = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == slug.ToLower());

        if (community == null) return NotFound("Сообщество не найдено");

        var existingMember = community.Members.FirstOrDefault(m => m.UserId == userId);

        bool isJoined;
        if (existingMember != null)
        {
            if (existingMember.Role == CommunityRole.Owner)
            {
                return BadRequest(new { message = "Владелец не может покинуть сообщество" });
            }

            _context.CommunityMembers.Remove(existingMember);
            community.MembersCount = Math.Max(1, community.MembersCount - 1);
            isJoined = false;
        }
        else
        {
            var newMember = new CommunityMember
            {
                CommunityId = community.Id,
                UserId = userId,
                Role = CommunityRole.Member,
                Status = community.Type == CommunityType.Public ? MemberStatus.Active : MemberStatus.Pending
            };

            _context.CommunityMembers.Add(newMember);
            if (newMember.Status == MemberStatus.Active)
            {
                community.MembersCount++;
            }
            isJoined = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { isMember = isJoined, membersCount = community.MembersCount });
    }

    [HttpPost("toggleWatch/{slug}")]
    [Authorize]
    public async Task<IActionResult> ToggleWatch(string slug)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var cleanSlug = slug.Trim().ToLower();
        var community = await _context.Communities
            .Include(c => c.Watchers)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (community == null) return NotFound("Сообщество не найдено");

        var existingWatcher = community.Watchers.FirstOrDefault(w => w.UserId == userId);
        bool isWatching;

        if (existingWatcher != null)
        {
            _context.CommunityWatchers.Remove(existingWatcher);
            community.WatchersCount = Math.Max(0, community.WatchersCount - 1);
            isWatching = false;
        }
        else
        {
            var newWatcher = new CommunityWatcher
            {
                CommunityId = community.Id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.CommunityWatchers.Add(newWatcher);
            community.WatchersCount++;
            isWatching = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { isWatching = isWatching, watchersCount = community.WatchersCount });
    }
    
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Communities
            .OrderByDescending(c => c.MembersCount)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                description = c.Description,
                avatar = c.Avatar,
                banner = c.Banner,
                kind = c.Kind,
                isVerified = c.IsVerified,
                location = c.Location,
                industry = c.Industry,
                companySize = c.CompanySize,
                membersCount = c.MembersCount,
                watchersCount = c.WatchersCount,
                postsCount = c.PostsCount
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchCommunities([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(new List<object>());
        }

        var clean = query.Trim().ToLower().Replace("c/", "").TrimStart('#');
        var collapsed = Regex.Replace(clean, @"[\s\-_]+", "");

        var list = await _context.Communities
            .Where(c => c.Name.ToLower().Contains(clean) || 
                        c.Slug.ToLower().Contains(clean) || 
                        (!string.IsNullOrEmpty(collapsed) && (
                            c.Name.ToLower().Replace(" ", "").Replace("-", "").Replace("_", "").Contains(collapsed) ||
                            c.Slug.ToLower().Replace("-", "").Replace("_", "").Contains(collapsed)
                        )) ||
                        (c.Description != null && (
                            c.Description.ToLower().Contains(clean) ||
                            (!string.IsNullOrEmpty(collapsed) && c.Description.ToLower().Replace(" ", "").Replace("-", "").Contains(collapsed))
                        )))
            .OrderByDescending(c => c.MembersCount)
            .Take(15)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                description = c.Description,
                avatar = c.Avatar,
                banner = c.Banner,
                kind = c.Kind,
                isVerified = c.IsVerified,
                location = c.Location,
                industry = c.Industry,
                companySize = c.CompanySize,
                membersCount = c.MembersCount,
                watchersCount = c.WatchersCount,
                postsCount = c.PostsCount
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("{slug}/requestEmployee")]
    [Authorize]
    public async Task<IActionResult> RequestEmployee(string slug)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var cleanSlug = slug.Trim().ToLower();
        var community = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (community == null) return NotFound("Компания не найдена");
        if (community.Kind != CommunityKind.Company)
            return BadRequest(new { message = "Запрос на статус сотрудника можно отправить только компании" });

        var existing = community.Members.FirstOrDefault(m => m.UserId == userId);
        if (existing != null)
        {
            if (existing.Status == MemberStatus.Active)
                return BadRequest(new { message = "Вы уже являетесь сотрудником компании" });
            if (existing.Status == MemberStatus.Pending)
                return BadRequest(new { message = "Заявка уже отправлена и находится на рассмотрении" });
        }

        var member = new CommunityMember
        {
            CommunityId = community.Id,
            UserId = userId,
            Role = CommunityRole.Member,
            Status = MemberStatus.Pending
        };
        _context.CommunityMembers.Add(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Заявка отправлена на рассмотрение руководству компании" });
    }

    [HttpPost("{slug}/acceptEmployee/{targetUserId}")]
    [Authorize]
    public async Task<IActionResult> AcceptEmployee(string slug, string targetUserId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var cleanSlug = slug.Trim().ToLower();
        var community = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (community == null) return NotFound("Компания не найдена");

        var currentMember = community.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentMember == null || (currentMember.Role != CommunityRole.Owner && currentMember.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        var targetMember = community.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null) return NotFound("Заявка не найдена");

        targetMember.Status = MemberStatus.Active;
        community.MembersCount++;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Сотрудник принят в штат компании" });
    }

    [HttpPost("{slug}/rejectEmployee/{targetUserId}")]
    [Authorize]
    public async Task<IActionResult> RejectEmployee(string slug, string targetUserId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var cleanSlug = slug.Trim().ToLower();
        var community = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (community == null) return NotFound("Компания не найдена");

        var currentMember = community.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentMember == null || (currentMember.Role != CommunityRole.Owner && currentMember.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        var targetMember = community.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null) return NotFound("Сотрудник или заявка не найдены");

        if (targetMember.Role == CommunityRole.Owner)
        {
            return BadRequest(new { message = "Нельзя исключить владельца" });
        }

        if (targetMember.Status == MemberStatus.Active)
        {
            community.MembersCount = Math.Max(1, community.MembersCount - 1);
        }

        _context.CommunityMembers.Remove(targetMember);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Заявка отклонена / сотрудник удален" });
    }

    [HttpGet("{slug}/pendingEmployees")]
    [Authorize]
    public async Task<IActionResult> GetPendingEmployees(string slug)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var cleanSlug = slug.Trim().ToLower();
        var community = await _context.Communities
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (community == null) return NotFound("Компания не найдена");

        var currentMember = community.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentMember == null || (currentMember.Role != CommunityRole.Owner && currentMember.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        var pending = community.Members
            .Where(m => m.Status == MemberStatus.Pending)
            .Select(m => new
            {
                id = m.UserId,
                name = m.User.FullName,
                username = m.User.UserName,
                avatar = m.User.Avatar,
                workStatus = m.User.WorkStatus,
                technologies = m.User.Technologies
            })
            .ToList();

        return Ok(pending);
    }
}