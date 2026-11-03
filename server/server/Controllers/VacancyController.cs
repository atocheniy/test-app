using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Helpers;
using server.Hubs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VacancyController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public VacancyController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private static string BuildApplicationGreeting(string title, string companyName)
    {
        return $"Здравствуйте. Я откликаюсь на вакансию «{title}» в компании {companyName}.";
    }

    private async Task<HashSet<string>> GetAppliedGreetingsAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return new HashSet<string>(StringComparer.Ordinal);

        var contents = await _context.Message
            .Where(m => m.SenderId == userId && m.Content != null && m.Content.StartsWith("Здравствуйте. Я откликаюсь на вакансию «"))
            .Select(m => m.Content!)
            .ToListAsync();

        var set = new HashSet<string>(StringComparer.Ordinal);
        foreach (var c in contents)
        {
            var lineEnd = c.IndexOf('\n');
            var firstLine = lineEnd >= 0 ? c.Substring(0, lineEnd).Trim() : c.Trim();
            set.Add(firstLine);
        }
        return set;
    }

    private async Task<VacancyRecommendationScorer.UserVacancyProfile?> BuildUserProfileAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return null;

        var user = await _context.Users
            .Include(u => u.Projects)
            .Include(u => u.Experiences)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return null;

        var watchedCompanyIds = await _context.CommunityWatchers
            .Where(w => w.UserId == userId)
            .Select(w => w.CommunityId)
            .ToListAsync();

        var profile = new VacancyRecommendationScorer.UserVacancyProfile
        {
            UserId = userId,
            Focus = user.Focus,
            Location = user.Location,
            WorkStatus = user.WorkStatus,
            WatchedCompanyIds = new HashSet<Guid>(watchedCompanyIds),
            EstimatedLevel = VacancyRecommendationScorer.EstimateUserLevel(user, user.Experiences)
        };

        if (user.Technologies != null)
        {
            foreach (var t in user.Technologies)
            {
                var norm = FeedRecommendationScorer.NormalizeTag(t);
                if (!string.IsNullOrEmpty(norm)) profile.NormalizedTechnologies.Add(norm);
            }
        }

        if (user.Projects != null)
        {
            foreach (var p in user.Projects)
            {
                if (p.Technologies != null)
                {
                    foreach (var t in p.Technologies)
                    {
                        var norm = FeedRecommendationScorer.NormalizeTag(t);
                        if (!string.IsNullOrEmpty(norm)) profile.NormalizedTechnologies.Add(norm);
                    }
                }
            }
        }

        if (user.Experiences != null)
        {
            profile.ExperiencePositions = user.Experiences
                .Where(e => !string.IsNullOrEmpty(e.Position))
                .Select(e => e.Position)
                .ToList();
        }

        return profile;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList(
        [FromQuery] string? search,
        [FromQuery] WorkFormat? format,
        [FromQuery] SeniorityLevel? level,
        [FromQuery] string? companySlug,
        [FromQuery] string? stack,
        [FromQuery] string? sort = "recommended",
        [FromQuery] bool includeAllStatuses = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var activeCommIds = string.IsNullOrEmpty(currentUserId)
            ? new List<Guid>()
            : await _context.CommunityMembers
                .Where(cm => cm.UserId == currentUserId && cm.Status == MemberStatus.Active)
                .Select(cm => cm.CommunityId)
                .ToListAsync();

        var canViewAllStatuses = false;
        if (includeAllStatuses && !string.IsNullOrWhiteSpace(companySlug) && !string.IsNullOrEmpty(currentUserId))
        {
            var targetSlug = companySlug.Trim().ToLower();
            canViewAllStatuses = await _context.CommunityMembers.AnyAsync(cm =>
                cm.Community.Slug.ToLower() == targetSlug
                && cm.UserId == currentUserId
                && cm.Status == MemberStatus.Active
                && (cm.Role == CommunityRole.Owner || cm.Role == CommunityRole.Admin));
        }

        var query = _context.Vacancies
            .Include(v => v.Company)
            .Include(v => v.CreatedBy)
            .Where(v => v.Company.Kind == CommunityKind.Company
                && (canViewAllStatuses || v.Status == VacancyStatus.Open)
                && (v.Company.Type != CommunityType.Private || (currentUserId != null && activeCommIds.Contains(v.CompanyId))))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(companySlug))
        {
            var cleanSlug = companySlug.Trim().ToLower();
            query = query.Where(v => v.Company.Slug.ToLower() == cleanSlug);
        }

        if (format.HasValue)
        {
            query = query.Where(v => v.Format == format.Value);
        }

        if (level.HasValue)
        {
            query = query.Where(v => v.Level == level.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(v => v.Title.ToLower().Contains(s) || 
                                     v.Description.ToLower().Contains(s) || 
                                     v.Company.Name.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(stack))
        {
            var st = stack.Trim().ToLower();
            query = query.Where(v => v.Stack.Any(x => x.ToLower().Contains(st)));
        }

        var total = await query.CountAsync();
        var allFiltered = await query.ToListAsync();

        var profile = await BuildUserProfileAsync(currentUserId);
        var appliedGreetings = await GetAppliedGreetingsAsync(currentUserId);
        var ranked = VacancyRecommendationScorer.RankVacancies(allFiltered, profile);

        IEnumerable<VacancyRecommendationScorer.ScoredVacancy> ordered = ranked;
        if (string.Equals(sort, "created", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(sort, "date", StringComparison.OrdinalIgnoreCase))
        {
            ordered = ranked.OrderByDescending(r => r.Vacancy.Created);
        }
        else if (string.Equals(sort, "salary", StringComparison.OrdinalIgnoreCase))
        {
            ordered = ranked.OrderByDescending(r => r.Vacancy.SalaryTo ?? r.Vacancy.SalaryFrom ?? 0);
        }

        var pagedItems = ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new VacancyDto
            {
                Id = x.Vacancy.Id,
                CompanyId = x.Vacancy.CompanyId,
                CompanyName = x.Vacancy.Company.Name,
                CompanySlug = x.Vacancy.Company.Slug,
                CompanyAvatar = x.Vacancy.Company.Avatar,
                CompanyLocation = x.Vacancy.Company.Location,
                IsCompanyVerified = x.Vacancy.Company.IsVerified,
                Title = x.Vacancy.Title,
                Description = x.Vacancy.Description,
                SalaryFrom = x.Vacancy.SalaryFrom,
                SalaryTo = x.Vacancy.SalaryTo,
                Currency = x.Vacancy.Currency,
                Format = x.Vacancy.Format,
                Level = x.Vacancy.Level,
                Stack = x.Vacancy.Stack,
                Status = x.Vacancy.Status,
                CreatedById = x.Vacancy.CreatedById,
                CreatedByName = x.Vacancy.CreatedBy.FullName,
                CreatedByUsername = x.Vacancy.CreatedBy.UserName,
                CreatedByAvatar = x.Vacancy.CreatedBy.Avatar,
                Created = x.Vacancy.Created,
                HasApplied = appliedGreetings.Contains(BuildApplicationGreeting(x.Vacancy.Title, x.Vacancy.Company.Name)),
                MatchPercent = x.MatchPercent,
                MatchReason = x.MatchReason,
                Score = x.Score
            })
            .ToList();

        return Ok(new { total, page, pageSize, items = pagedItems });
    }

    [HttpGet("recommended")]
    public async Task<IActionResult> GetRecommended(
        [FromQuery] int limit = 5,
        [FromQuery] int skip = 0)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        limit = Math.Clamp(limit, 1, 20);
        skip = Math.Max(0, skip);

        var profile = await BuildUserProfileAsync(currentUserId);

        var activeCommIds = string.IsNullOrEmpty(currentUserId)
            ? new List<Guid>()
            : await _context.CommunityMembers
                .Where(cm => cm.UserId == currentUserId && cm.Status == MemberStatus.Active)
                .Select(cm => cm.CommunityId)
                .ToListAsync();

        var openVacancies = await _context.Vacancies
            .Include(v => v.Company)
            .Include(v => v.CreatedBy)
            .Where(v => v.Company.Kind == CommunityKind.Company
                && v.Status == VacancyStatus.Open
                && (v.Company.Type != CommunityType.Private || (currentUserId != null && activeCommIds.Contains(v.CompanyId))))
            .ToListAsync();

        if (openVacancies.Count == 0)
        {
            return Ok(Array.Empty<VacancyDto>());
        }

        var appliedGreetings = await GetAppliedGreetingsAsync(currentUserId);
        var ranked = VacancyRecommendationScorer.RankVacancies(openVacancies, profile);
        
        List<VacancyRecommendationScorer.ScoredVacancy> paged;
        if (ranked.Count <= limit)
        {
            paged = ranked;
        }
        else
        {
            int startIndex = skip % ranked.Count;
            paged = ranked.Skip(startIndex).Take(limit).ToList();
            if (paged.Count < limit)
            {
                paged.AddRange(ranked.Take(limit - paged.Count));
            }
        }

        var result = paged.Select(x => new VacancyDto
        {
            Id = x.Vacancy.Id,
            CompanyId = x.Vacancy.CompanyId,
            CompanyName = x.Vacancy.Company.Name,
            CompanySlug = x.Vacancy.Company.Slug,
            CompanyAvatar = x.Vacancy.Company.Avatar,
            CompanyLocation = x.Vacancy.Company.Location,
            IsCompanyVerified = x.Vacancy.Company.IsVerified,
            Title = x.Vacancy.Title,
            Description = x.Vacancy.Description,
            SalaryFrom = x.Vacancy.SalaryFrom,
            SalaryTo = x.Vacancy.SalaryTo,
            Currency = x.Vacancy.Currency,
            Format = x.Vacancy.Format,
            Level = x.Vacancy.Level,
            Stack = x.Vacancy.Stack,
            Status = x.Vacancy.Status,
            CreatedById = x.Vacancy.CreatedById,
            CreatedByName = x.Vacancy.CreatedBy.FullName,
            CreatedByUsername = x.Vacancy.CreatedBy.UserName,
            CreatedByAvatar = x.Vacancy.CreatedBy.Avatar,
            Created = x.Vacancy.Created,
            HasApplied = appliedGreetings.Contains(BuildApplicationGreeting(x.Vacancy.Title, x.Vacancy.Company.Name)),
            MatchPercent = x.MatchPercent,
            MatchReason = x.MatchReason,
            Score = x.Score
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var v = await _context.Vacancies
            .Include(v => v.Company)
            .Include(v => v.CreatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (v == null || v.Company.Kind != CommunityKind.Company) return NotFound("Вакансия не найдена");

        if (v.Company.Type == CommunityType.Private)
        {
            var isMember = !string.IsNullOrEmpty(currentUserId) && await _context.CommunityMembers
                .AnyAsync(cm => cm.CommunityId == v.CompanyId && cm.UserId == currentUserId && cm.Status == MemberStatus.Active);
            if (!isMember)
            {
                return StatusCode(403, new { message = "Доступ ограничен", isLocked = true });
            }
        }

        if (v.Status != VacancyStatus.Open)
        {
            var canManage = !string.IsNullOrEmpty(currentUserId) && await _context.CommunityMembers
                .AnyAsync(cm => cm.CommunityId == v.CompanyId
                    && cm.UserId == currentUserId
                    && cm.Status == MemberStatus.Active
                    && (cm.Role == CommunityRole.Owner || cm.Role == CommunityRole.Admin));
            if (!canManage)
            {
                return NotFound(new { message = "Вакансия закрыта или приостановлена" });
            }
        }

        var appliedGreetings = await GetAppliedGreetingsAsync(currentUserId);

        var dto = new VacancyDto
        {
            Id = v.Id,
            CompanyId = v.CompanyId,
            CompanyName = v.Company.Name,
            CompanySlug = v.Company.Slug,
            CompanyAvatar = v.Company.Avatar,
            CompanyLocation = v.Company.Location,
            IsCompanyVerified = v.Company.IsVerified,
            Title = v.Title,
            Description = v.Description,
            SalaryFrom = v.SalaryFrom,
            SalaryTo = v.SalaryTo,
            Currency = v.Currency,
            Format = v.Format,
            Level = v.Level,
            Stack = v.Stack,
            Status = v.Status,
            CreatedById = v.CreatedById,
            CreatedByName = v.CreatedBy.FullName,
            CreatedByUsername = v.CreatedBy.UserName,
            CreatedByAvatar = v.CreatedBy.Avatar,
            Created = v.Created,
            HasApplied = appliedGreetings.Contains(BuildApplicationGreeting(v.Title, v.Company.Name))
        };

        return Ok(dto);
    }

    [HttpPost("create/{companySlug}")]
    [Authorize]
    public async Task<IActionResult> Create(string companySlug, [FromBody] CreateVacancyDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(model.Title))
        {
            return BadRequest(new { message = "Укажите название должности" });
        }

        var cleanSlug = companySlug.Trim().ToLower();
        var company = await _context.Communities
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Slug == cleanSlug);

        if (company == null) return NotFound(new { message = "Компания не найдена" });

        if (company.Kind != CommunityKind.Company)
        {
            return BadRequest(new { message = "Публиковать вакансии могут только страницы компаний" });
        }

        var member = company.Members.FirstOrDefault(m => m.UserId == userId && m.Status == MemberStatus.Active);
        if (member == null || (member.Role != CommunityRole.Owner && member.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        if ((model.SalaryFrom.HasValue && model.SalaryFrom.Value < 0) || (model.SalaryTo.HasValue && model.SalaryTo.Value < 0))
        {
            return BadRequest(new { message = "Зарплата не может быть отрицательной" });
        }

        int? salaryFrom = model.SalaryFrom.HasValue && model.SalaryFrom.Value > 0 ? model.SalaryFrom.Value : null;
        int? salaryTo = model.SalaryTo.HasValue && model.SalaryTo.Value > 0 ? model.SalaryTo.Value : null;

        if (salaryFrom.HasValue && salaryTo.HasValue && salaryFrom.Value > salaryTo.Value)
        {
            return BadRequest(new { message = "Минимальная зарплата не может превышать максимальную" });
        }

        var vacancy = new Vacancy
        {
            CompanyId = company.Id,
            Title = model.Title.Trim(),
            Description = model.Description ?? string.Empty,
            SalaryFrom = salaryFrom,
            SalaryTo = salaryTo,
            Currency = string.IsNullOrWhiteSpace(model.Currency) ? "USD" : model.Currency.Trim(),
            Format = model.Format,
            Level = model.Level,
            Stack = model.Stack ?? Array.Empty<string>(),
            Status = VacancyStatus.Open,
            CreatedById = userId,
            Created = DateTime.UtcNow
        };

        _context.Vacancies.Add(vacancy);
        await _context.SaveChangesAsync();

        return Ok(new { id = vacancy.Id, message = "Вакансия успешно опубликована" });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVacancyDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var vacancy = await _context.Vacancies
            .Include(v => v.Company)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vacancy == null) return NotFound(new { message = "Вакансия не найдена" });

        if (vacancy.Company.Kind != CommunityKind.Company)
        {
            return BadRequest(new { message = "Редактирование вакансий доступно только для страниц компаний" });
        }

        var member = vacancy.Company.Members.FirstOrDefault(m => m.UserId == userId && m.Status == MemberStatus.Active);
        if (member == null || (member.Role != CommunityRole.Owner && member.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        if ((model.SalaryFromSpecified && model.SalaryFrom.HasValue && model.SalaryFrom.Value < 0)
            || (model.SalaryToSpecified && model.SalaryTo.HasValue && model.SalaryTo.Value < 0))
        {
            return BadRequest(new { message = "Зарплата не может быть отрицательной" });
        }

        var nextSalaryFrom = model.SalaryFromSpecified
            ? (model.SalaryFrom.HasValue && model.SalaryFrom.Value > 0 ? model.SalaryFrom.Value : null)
            : vacancy.SalaryFrom;

        var nextSalaryTo = model.SalaryToSpecified
            ? (model.SalaryTo.HasValue && model.SalaryTo.Value > 0 ? model.SalaryTo.Value : null)
            : vacancy.SalaryTo;

        if (nextSalaryFrom.HasValue && nextSalaryTo.HasValue && nextSalaryFrom.Value > nextSalaryTo.Value)
        {
            return BadRequest(new { message = "Минимальная зарплата не может превышать максимальную" });
        }

        if (!string.IsNullOrWhiteSpace(model.Title)) vacancy.Title = model.Title.Trim();
        if (model.Description != null) vacancy.Description = model.Description;
        vacancy.SalaryFrom = nextSalaryFrom;
        vacancy.SalaryTo = nextSalaryTo;
        if (!string.IsNullOrWhiteSpace(model.Currency)) vacancy.Currency = model.Currency.Trim();
        if (model.Format.HasValue) vacancy.Format = model.Format.Value;
        if (model.Level.HasValue) vacancy.Level = model.Level.Value;
        if (model.Stack != null) vacancy.Stack = model.Stack;
        if (model.Status.HasValue) vacancy.Status = model.Status.Value;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Вакансия успешно обновлена" });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var vacancy = await _context.Vacancies
            .Include(v => v.Company)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vacancy == null) return NotFound(new { message = "Вакансия не найдена" });

        var member = vacancy.Company.Members.FirstOrDefault(m => m.UserId == userId && m.Status == MemberStatus.Active);
        if (member == null || (member.Role != CommunityRole.Owner && member.Role != CommunityRole.Admin))
        {
            return Forbid();
        }

        _context.Vacancies.Remove(vacancy);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Вакансия удалена" });
    }

    [HttpPost("apply/{id}")]
    [Authorize]
    public async Task<IActionResult> Apply(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var vacancy = await _context.Vacancies
            .Include(v => v.Company)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vacancy == null) return NotFound(new { message = "Вакансия не найдена" });

        if (vacancy.Company.Kind != CommunityKind.Company || vacancy.Status != VacancyStatus.Open)
        {
            return BadRequest(new { message = "Отклик невозможен: вакансия закрыта или приостановлена" });
        }

        if (vacancy.Company.Type == CommunityType.Private)
        {
            var isMember = await _context.CommunityMembers
                .AnyAsync(cm => cm.CommunityId == vacancy.CompanyId && cm.UserId == currentUserId && cm.Status == MemberStatus.Active);
            if (!isMember)
            {
                return Forbid();
            }
        }

        var recruiterId = !string.IsNullOrEmpty(vacancy.CreatedById) 
            ? vacancy.CreatedById 
            : vacancy.Company.CreatorId;

        if (currentUserId == recruiterId)
        {
            return BadRequest(new { message = "Вы не можете откликнуться на собственную вакансию" });
        }

        var recruiter = await _context.Users.FindAsync(recruiterId);
        if (recruiter == null)
        {
            return NotFound(new { message = "Автор вакансии не найден" });
        }

        if (!recruiter.AllowDirectMessages)
        {
            return BadRequest(new { message = "Автор вакансии ограничил приём личных сообщений", code = "DM_DISABLED" });
        }
        
        var chat = await _context.Chat
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Participants.Count == 2 &&
                                      c.Participants.Any(p => p.UserId == currentUserId) &&
                                      c.Participants.Any(p => p.UserId == recruiterId));

        var greeting = BuildApplicationGreeting(vacancy.Title, vacancy.Company.Name);

        if (chat != null)
        {
            var alreadyApplied = await _context.Message.AnyAsync(m =>
                m.ChatId == chat.Id &&
                m.SenderId == currentUserId &&
                m.Content != null &&
                m.Content.StartsWith(greeting));

            if (alreadyApplied)
            {
                return BadRequest(new { chatId = chat.Id, alreadyApplied = true, message = "Вы уже откликались на эту вакансию" });
            }
        }
        else
        {
            chat = new Chat
            {
                UpdatedAt = DateTime.UtcNow
            };
            chat.Participants.Add(new ChatParticipant { UserId = currentUserId });
            chat.Participants.Add(new ChatParticipant { UserId = recruiterId });
            _context.Chat.Add(chat);
            await _context.SaveChangesAsync();
        }

        var candidate = await _context.Users.FindAsync(currentUserId);
        var appMsgContent = greeting;
        
        if (candidate != null)
        {
            var extraInfo = new List<string>();
            if (!string.IsNullOrWhiteSpace(candidate.WorkStatus))
                extraInfo.Add($"Статус поиска: {candidate.WorkStatus}");
            if (candidate.Technologies != null && candidate.Technologies.Length > 0)
                extraInfo.Add($"Стек технологий: {string.Join(", ", candidate.Technologies)}");
            if (!string.IsNullOrWhiteSpace(candidate.GithubUrl))
                extraInfo.Add($"GitHub: {candidate.GithubUrl}");
            if (!string.IsNullOrWhiteSpace(candidate.Bio_FirstLine))
                extraInfo.Add($"О себе: {candidate.Bio_FirstLine}");

            if (extraInfo.Count > 0)
            {
                appMsgContent += "\n\nИнформация обо мне:\n• " + string.Join("\n• ", extraInfo);
            }
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatId = chat.Id,
            SenderId = currentUserId,
            Content = appMsgContent,
            Attachments = Array.Empty<string>(),
            SentAt = DateTime.UtcNow
        };
        _context.Message.Add(message);
        chat.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var messageResponse = new
        {
            Id = message.Id,
            ChatId = message.ChatId,
            SenderId = message.SenderId,
            Content = message.Content,
            Attachments = message.Attachments,
            Time = message.SentAt.ToString("HH:mm"),
            replyTo = (object?)null
        };

        var participantIds = chat.Participants.Select(p => p.UserId).ToList();
        await _hubContext.Clients.Users(participantIds).SendAsync("ReceiveMessage", messageResponse);
        await _hubContext.Clients.Group(chat.Id.ToString().ToLower()).SendAsync("ReceiveMessage", messageResponse);

        return Ok(new 
        { 
            chatId = chat.Id, 
            message = "Отклик отправлен! Начат диалог с автором вакансии." 
        });
    }
}
