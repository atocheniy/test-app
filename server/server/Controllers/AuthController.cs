using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Data;
using server.DTOs;
using server.Hubs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context, IHubContext<ChatHub> hubContext)
    {
        _userManager = userManager;
        _config = config;
        _context = context;
        _hubContext = hubContext;
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterInfo model)
    {
        var cleanUserName = (model.UserName ?? string.Empty).Trim().TrimStart('@');
        var cleanEmail = (model.Email ?? string.Empty).Trim();
        var cleanFullName = (model.FullName ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(cleanFullName) || string.IsNullOrWhiteSpace(cleanUserName) || string.IsNullOrWhiteSpace(cleanEmail))
        {
            return BadRequest(new { code = "MissingFields", message = "Заполните все обязательные поля" });
        }

        if (string.IsNullOrEmpty(model.Password) || model.Password.Length < 6)
        {
            return BadRequest(new { code = "PasswordTooShort", message = "Пароль должен содержать минимум 6 символов" });
        }

        if (!Regex.IsMatch(cleanUserName, @"^[a-zA-Z0-9_.-]{3,32}$"))
        {
            return BadRequest(new { code = "InvalidUserName", message = "Имя пользователя должно быть от 3 до 32 символов и содержать только латинские буквы, цифры, точку, дефис или подчёркивание" });
        }

        var normalizedUserName = _userManager.NormalizeName(cleanUserName);
        if (await _userManager.Users.AnyAsync(u => u.NormalizedUserName == normalizedUserName))
        {
            return BadRequest(new { code = "DuplicateUserName", message = "Это имя пользователя уже занято" });
        }

        var normalizedEmail = _userManager.NormalizeEmail(cleanEmail);
        if (await _userManager.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail))
        {
            return BadRequest(new { code = "DuplicateEmail", message = "Этот Email уже зарегистрирован" });
        }

        var user = new ApplicationUser
        {
            UserName = cleanUserName,
            Email = cleanEmail,
            FullName = cleanFullName,
            Room = string.IsNullOrEmpty(model.Room) ? "general" : model.Room,
            ConnectedAt = DateTime.UtcNow
        };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded) return Ok(new { message = "Регистрация успешна" });

        var firstError = result.Errors.FirstOrDefault();
        return BadRequest(new
        {
            code = firstError?.Code ?? "RegistrationFailed",
            message = firstError?.Description ?? "Ошибка регистрации",
            errors = result.Errors
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginInfo model)
    {
        var identifier = (model.Email ?? string.Empty).Trim();
        var cleanIdentifier = identifier.TrimStart('@');
        var normalizedEmail = _userManager.NormalizeEmail(identifier);
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
        if (user == null) user = await _userManager.FindByNameAsync(cleanIdentifier);

        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return Ok(new { 
                token = GenerateJwtToken(user),
            });
        }

        return Unauthorized("Неверный логин или пароль");
    }
    
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(new List<object>());
        }
        
        var cleanQuery = query.Trim().Replace("@", "").ToLower();
        var collapsed = Regex.Replace(cleanQuery, @"[\s\-_]+", "");

        var users = await _userManager.Users
            .Where(u => (u.UserName != null && (
                            u.UserName.ToLower().Contains(cleanQuery) ||
                            (!string.IsNullOrEmpty(collapsed) && u.UserName.ToLower().Replace("-", "").Replace("_", "").Contains(collapsed))
                        )) ||
                        (u.FullName != null && (
                            u.FullName.ToLower().Contains(cleanQuery) ||
                            (!string.IsNullOrEmpty(collapsed) && u.FullName.ToLower().Replace(" ", "").Replace("-", "").Replace("_", "").Contains(collapsed))
                        )))
            .Take(15) 
            .Select(u => new {
                id = u.Id,
                userName = u.UserName,
                fullName = u.FullName,
                avatar = u.Avatar,
                bio_FirstLine = u.IsPrivate ? null : u.Bio_FirstLine,
                isPrivate = u.IsPrivate,
                followers = _context.UserWatchers.Count(uw => uw.TargetUserId == u.Id && uw.Status == MemberStatus.Active)
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("recommended")]
    public async Task<IActionResult> GetRecommendedUsers([FromQuery] int limit = 5)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        limit = Math.Clamp(limit, 1, 20);

        List<string> excludedUserIds = new();
        List<string> activeWatchedUserIds = new();
        List<string> userTechs = new();
        Dictionary<string, int> mutualWatchers = new();

        if (!string.IsNullOrEmpty(currentUserId))
        {
            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser?.Technologies != null)
            {
                userTechs = currentUser.Technologies
                    .Where(t => !string.IsNullOrWhiteSpace(t))
                    .Select(t => t.Trim().ToLower())
                    .ToList();
            }

            var myWatchRecords = await _context.UserWatchers
                .Where(w => w.WatcherId == currentUserId)
                .Select(w => new { w.TargetUserId, w.Status })
                .ToListAsync();

            excludedUserIds = myWatchRecords.Select(w => w.TargetUserId).ToList();
            activeWatchedUserIds = myWatchRecords
                .Where(w => w.Status == MemberStatus.Active)
                .Select(w => w.TargetUserId)
                .ToList();

            if (activeWatchedUserIds.Any())
            {
                mutualWatchers = await _context.UserWatchers
                    .Where(w => w.Status == MemberStatus.Active
                                && activeWatchedUserIds.Contains(w.WatcherId)
                                && w.TargetUserId != currentUserId
                                && !excludedUserIds.Contains(w.TargetUserId))
                    .GroupBy(w => w.TargetUserId)
                    .Select(g => new { UserId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.UserId, x => x.Count);
            }
        }

        var query = _userManager.Users.Where(u => !u.IsPrivate);

        if (!string.IsNullOrEmpty(currentUserId))
        {
            query = query.Where(u => u.Id != currentUserId);
            if (excludedUserIds.Any())
            {
                query = query.Where(u => !excludedUserIds.Contains(u.Id));
            }
        }

        var recentCutoff = DateTime.UtcNow.AddDays(-30);
        var activePosters = await _context.Post
            .Where(p => p.Created >= recentCutoff)
            .GroupBy(p => p.UserId)
            .Select(g => new { UserId = g.Key, PostCount = g.Count(), LastPost = g.Max(p => p.Created) })
            .ToDictionaryAsync(x => x.UserId, x => x);

        var candidates = await query
            .Take(50)
            .Select(u => new
            {
                id = u.Id,
                userName = u.UserName,
                fullName = u.FullName,
                avatar = u.Avatar,
                bio_FirstLine = u.Bio_FirstLine,
                technologies = u.Technologies,
                followers = u.Followers ?? 0,
                connectedAt = u.ConnectedAt
            })
            .ToListAsync();

        var scored = candidates
            .Select(c =>
            {
                double score = 0;
                
                if (userTechs.Any() && c.technologies != null)
                {
                    var matches = c.technologies.Count(t => !string.IsNullOrWhiteSpace(t) && userTechs.Contains(t.Trim().ToLower()));
                    score += matches * 25.0;
                }
                
                if (mutualWatchers.TryGetValue(c.id, out int mutualCount))
                {
                    score += mutualCount * 30.0;
                }
                
                if (activePosters.TryGetValue(c.id, out var activity))
                {
                    score += Math.Min(activity.PostCount * 5.0, 30.0);
                    var daysSinceLastPost = (DateTime.UtcNow - activity.LastPost).TotalDays;
                    if (daysSinceLastPost <= 3) score += 20.0;
                    else if (daysSinceLastPost <= 7) score += 10.0;
                }
                
                if (!string.IsNullOrWhiteSpace(c.avatar)) score += 15.0;
                if (!string.IsNullOrWhiteSpace(c.bio_FirstLine)) score += 10.0;
                if (c.technologies != null && c.technologies.Length > 0) score += 10.0;
                
                score += Math.Log10(c.followers + 1) * 5.0;

                return new
                {
                    candidate = c,
                    score,
                    mutualCount = mutualWatchers.GetValueOrDefault(c.id, 0),
                    sharedTechCount = (c.technologies != null && userTechs.Any())
                        ? c.technologies.Count(t => !string.IsNullOrWhiteSpace(t) && userTechs.Contains(t.Trim().ToLower()))
                        : 0
                };
            })
            .OrderByDescending(x => x.score)
            .Take(limit)
            .Select(x => new
            {
                id = x.candidate.id,
                userName = x.candidate.userName,
                fullName = x.candidate.fullName,
                avatar = x.candidate.avatar,
                bio_FirstLine = x.candidate.bio_FirstLine,
                technologies = x.candidate.technologies,
                followers = x.candidate.followers,
                isWatching = false,
                mutualCount = x.mutualCount,
                sharedTechCount = x.sharedTechCount
            })
            .ToList();

        return Ok(scored);
    }
    
    [HttpPatch("updateBio")]
    [Authorize]
    public async Task<IActionResult> UpdateBio([FromBody] UpdateBioDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
    
        if (user == null) return NotFound();

        user.Bio_FirstLine = model.FirstLine;
        user.Bio_SecondLine = model.SecondLine;

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPatch("updateDetails")]
    [Authorize]
    public async Task<IActionResult> UpdateDetails([FromBody] UpdateDetailsDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.Location = model.Location;
        user.WorkStatus = model.WorkStatus;
        user.GithubUrl = model.GithubUrl;
        user.TelegramUrl = model.TelegramUrl;
        user.VKUrl = model.VKUrl;
        user.XUrl = model.XUrl;
        user.DiscordUrl = model.DiscordUrl;
        user.WebsiteUrl = model.WebsiteUrl;
        user.Focus = model.Focus;
        if (model.Technologies != null)
        {
            user.Technologies = model.Technologies;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPatch("updateName")]
    [Authorize]
    public async Task<IActionResult> UpdateName([FromBody] UpdateNameDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
    
        if (user == null) return NotFound();

        user.FullName = model.FullName;

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPatch("updateUserName")]
    [Authorize]
    public async Task<IActionResult> UpdateUserName([FromBody] UpdateUserNameDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();
        
        var existingUser = await _userManager.FindByNameAsync(model.UserName);
        if (existingUser != null && existingUser.Id != userId)
        {
            return BadRequest(new { message = "Этот никнейм уже занят" });
        }

        var result = await _userManager.SetUserNameAsync(user, model.UserName);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }
        
        return Ok();
    }
    
    [HttpPatch("updateAvatar")]
    [Authorize]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
    
        if (user == null) return NotFound();

        user.Avatar = model.Avatar;

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPatch("updateBanner")]
    [Authorize]
    public async Task<IActionResult> UpdateBanner([FromBody] UpdateBannerDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
    
        if (user == null) return NotFound();

        user.Banner = model.Banner;

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPatch("updateLanguage")]
    [Authorize]
    public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        var lang = (model.Language ?? "ru").Trim().ToLower();
        user.PreferredLanguage = lang == "en" ? "en" : "ru";

        await _context.SaveChangesAsync();
        return Ok(new { language = user.PreferredLanguage });
    }

    [HttpPatch("updatePrivacySettings")]
    [Authorize]
    public async Task<IActionResult> UpdatePrivacySettings([FromBody] UpdatePrivacySettingsDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (model.ShowOnlineStatus.HasValue)
        {
            user.ShowOnlineStatus = model.ShowOnlineStatus.Value;
        }

        if (model.AllowDirectMessages.HasValue)
        {
            user.AllowDirectMessages = model.AllowDirectMessages.Value;
        }

        if (model.IsPrivate.HasValue)
        {
            user.IsPrivate = model.IsPrivate.Value;

            if (!user.IsPrivate && !string.IsNullOrEmpty(userId))
            {
                var pendingRequests = await _context.UserWatchers
                    .Include(uw => uw.Watcher)
                    .Where(uw => uw.TargetUserId == userId && uw.Status == MemberStatus.Pending)
                    .ToListAsync();

                foreach (var req in pendingRequests)
                {
                    req.Status = MemberStatus.Active;
                    user.Followers = (user.Followers ?? 0) + 1;
                    if (req.Watcher != null)
                    {
                        req.Watcher.Followings = (req.Watcher.Followings ?? 0) + 1;
                    }
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            showOnlineStatus = user.ShowOnlineStatus,
            allowDirectMessages = user.AllowDirectMessages,
            isPrivate = user.IsPrivate
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == user.Id && uw.Status == MemberStatus.Active);

        var watchingCount = await _context.UserWatchers
            .CountAsync(uw => uw.WatcherId == user.Id && uw.Status == MemberStatus.Active);

        var pendingWatchRequestsCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == user.Id && uw.Status == MemberStatus.Pending);

        var projects = await _context.UserProjects
            .Where(p => p.UserId == user.Id)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new {
                id = p.Id,
                name = p.Name,
                description = p.Description,
                imageUrl = p.ImageUrl,
                images = p.Images,
                bannerUrl = p.BannerUrl,
                status = (int)p.Status,
                starsCount = p.StarsCount,
                postsCount = p.PostsCount,
                githubUrl = p.GithubUrl,
                liveUrl = p.LiveUrl,
                technologies = p.Technologies,
                createdAt = p.CreatedAt
            })
            .ToListAsync();

        var experiences = await _context.UserExperiences
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new {
                id = e.Id,
                companyName = e.CompanyName,
                position = e.Position,
                mode = e.Mode,
                period = e.Period,
                description = e.Description,
                createdAt = e.CreatedAt
            })
            .ToListAsync();

        return Ok(new { 
            id = user.Id,
            email = user.Email, 
            fullName = user.FullName,
            userName = user.UserName,
            bio_FirstLine = user.Bio_FirstLine,
            bio_SecondLine = user.Bio_SecondLine,
            location = user.Location,
            workStatus = user.WorkStatus,
            focus = user.Focus,
            technologies = user.Technologies ?? Array.Empty<string>(),
            githubUrl = user.GithubUrl,
            telegramUrl = user.TelegramUrl,
            vkUrl = user.VKUrl,
            xUrl = user.XUrl,
            discordUrl = user.DiscordUrl,
            websiteUrl = user.WebsiteUrl,
            avatar = user.Avatar,
            banner = user.Banner,
            followers = watchersCount,
            followings = watchingCount,
            watchersCount = watchersCount,
            watchingCount = watchingCount,
            pendingWatchRequestsCount = pendingWatchRequestsCount,
            projects = projects,
            experiences = experiences,
            preferredLanguage = user.PreferredLanguage ?? "ru",
            showOnlineStatus = user.ShowOnlineStatus,
            allowDirectMessages = user.AllowDirectMessages,
            isPrivate = user.IsPrivate,
            isLocked = false
        });
    }
    
    [HttpGet("profile/{username}")]
    public async Task<IActionResult> GetUserProfile(string username)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();

        var watchRecord = currentUserId != null
            ? await _context.UserWatchers.FirstOrDefaultAsync(uw => uw.WatcherId == currentUserId && uw.TargetUserId == user.Id)
            : null;

        var isWatching = watchRecord != null && watchRecord.Status == MemberStatus.Active;
        var isWatchPending = watchRecord != null && watchRecord.Status == MemberStatus.Pending;

        var isOwn = currentUserId != null && currentUserId == user.Id;
        var isLocked = user.IsPrivate && !isOwn && !isWatching;

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == user.Id && uw.Status == MemberStatus.Active);

        var watchingCount = await _context.UserWatchers
            .CountAsync(uw => uw.WatcherId == user.Id && uw.Status == MemberStatus.Active);

        var projects = isLocked ? (object)Array.Empty<object>() : await _context.UserProjects
            .Where(p => p.UserId == user.Id)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new {
                id = p.Id,
                name = p.Name,
                description = p.Description,
                imageUrl = p.ImageUrl,
                images = p.Images,
                bannerUrl = p.BannerUrl,
                status = (int)p.Status,
                starsCount = p.StarsCount,
                postsCount = p.PostsCount,
                githubUrl = p.GithubUrl,
                liveUrl = p.LiveUrl,
                technologies = p.Technologies,
                createdAt = p.CreatedAt
            })
            .ToListAsync();

        var experiences = isLocked ? (object)Array.Empty<object>() : await _context.UserExperiences
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new {
                id = e.Id,
                companyName = e.CompanyName,
                position = e.Position,
                mode = e.Mode,
                period = e.Period,
                description = e.Description,
                createdAt = e.CreatedAt
            })
            .ToListAsync();
            
        return Ok(new { 
            id = user.Id,
            fullName = user.FullName,
            userName = user.UserName,
            bio_FirstLine = isLocked ? null : user.Bio_FirstLine,
            bio_SecondLine = isLocked ? null : user.Bio_SecondLine,
            location = isLocked ? null : user.Location,
            workStatus = isLocked ? null : user.WorkStatus,
            focus = isLocked ? null : user.Focus,
            technologies = isLocked ? Array.Empty<string>() : (user.Technologies ?? Array.Empty<string>()),
            githubUrl = isLocked ? null : user.GithubUrl,
            telegramUrl = isLocked ? null : user.TelegramUrl,
            vkUrl = isLocked ? null : user.VKUrl,
            xUrl = isLocked ? null : user.XUrl,
            discordUrl = isLocked ? null : user.DiscordUrl,
            websiteUrl = isLocked ? null : user.WebsiteUrl,
            avatar = user.Avatar,
            banner = user.Banner,
            followers = watchersCount,
            followings = watchingCount,
            watchersCount = watchersCount,
            watchingCount = watchingCount,
            isWatching = isWatching,
            isWatchPending = isWatchPending,
            projects = projects,
            experiences = experiences,
            preferredLanguage = user.PreferredLanguage ?? "ru",
            showOnlineStatus = user.ShowOnlineStatus,
            allowDirectMessages = user.AllowDirectMessages,
            isPrivate = user.IsPrivate,
            isLocked = isLocked
        });
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var userPosts = await _context.Post.Where(p => p.UserId == userId).ToListAsync();
            var userPostIds = userPosts.Select(p => p.Id).ToList();

            if (userPostIds.Any())
            {
                var repostsOfUserPosts = await _context.Post
                    .Where(p => p.RepostOfPostId.HasValue && userPostIds.Contains(p.RepostOfPostId.Value))
                    .ToListAsync();
                foreach (var r in repostsOfUserPosts)
                {
                    r.RepostOfPostId = null;
                }

                var likesOnUserPosts = await _context.PostLikes
                    .Where(l => userPostIds.Contains(l.PostId))
                    .ToListAsync();
                _context.PostLikes.RemoveRange(likesOnUserPosts);

                var commentsOnUserPosts = await _context.Comment
                    .Where(c => userPostIds.Contains(c.PostId))
                    .ToListAsync();
                _context.Comment.RemoveRange(commentsOnUserPosts);
            }

            var userCreatedCommunities = await _context.Communities.Where(c => c.CreatorId == userId).ToListAsync();
            var communityIds = userCreatedCommunities.Select(c => c.Id).ToList();

            if (communityIds.Any())
            {
                var communityPosts = await _context.Post.Where(p => p.CommunityId.HasValue && communityIds.Contains(p.CommunityId.Value)).ToListAsync();
                var commPostIds = communityPosts.Select(p => p.Id).ToList();

                if (commPostIds.Any())
                {
                    var repostsOfCommPosts = await _context.Post
                        .Where(p => p.RepostOfPostId.HasValue && commPostIds.Contains(p.RepostOfPostId.Value))
                        .ToListAsync();
                    foreach (var r in repostsOfCommPosts)
                    {
                        r.RepostOfPostId = null;
                    }

                    var commPostLikes = await _context.PostLikes.Where(l => commPostIds.Contains(l.PostId)).ToListAsync();
                    _context.PostLikes.RemoveRange(commPostLikes);

                    var commPostComments = await _context.Comment.Where(c => commPostIds.Contains(c.PostId)).ToListAsync();
                    _context.Comment.RemoveRange(commPostComments);

                    _context.Post.RemoveRange(communityPosts);
                }

                var commVacancies = await _context.Vacancies.Where(v => communityIds.Contains(v.CompanyId)).ToListAsync();
                _context.Vacancies.RemoveRange(commVacancies);

                var commWatchers = await _context.CommunityWatchers.Where(cw => communityIds.Contains(cw.CommunityId)).ToListAsync();
                _context.CommunityWatchers.RemoveRange(commWatchers);

                var commMembers = await _context.CommunityMembers.Where(cm => communityIds.Contains(cm.CommunityId)).ToListAsync();
                _context.CommunityMembers.RemoveRange(commMembers);

                _context.Communities.RemoveRange(userCreatedCommunities);
            }

            var userLikes = await _context.PostLikes.Where(l => l.UserId == userId).ToListAsync();
            _context.PostLikes.RemoveRange(userLikes);

            var userComments = await _context.Comment.Where(c => c.UserId == userId).ToListAsync();
            _context.Comment.RemoveRange(userComments);

            _context.Post.RemoveRange(userPosts);

            var userVacancies = await _context.Vacancies.Where(v => v.CreatedById == userId).ToListAsync();
            _context.Vacancies.RemoveRange(userVacancies);

            var userWatchers = await _context.UserWatchers
                .Where(uw => uw.WatcherId == userId || uw.TargetUserId == userId)
                .ToListAsync();
            _context.UserWatchers.RemoveRange(userWatchers);

            var userCommWatchers = await _context.CommunityWatchers.Where(cw => cw.UserId == userId).ToListAsync();
            _context.CommunityWatchers.RemoveRange(userCommWatchers);

            var userCommMembers = await _context.CommunityMembers.Where(cm => cm.UserId == userId).ToListAsync();
            _context.CommunityMembers.RemoveRange(userCommMembers);

            var userProjects = await _context.UserProjects.Where(p => p.UserId == userId).ToListAsync();
            _context.UserProjects.RemoveRange(userProjects);

            var userExperiences = await _context.UserExperiences.Where(e => e.UserId == userId).ToListAsync();
            _context.UserExperiences.RemoveRange(userExperiences);

            var projectStars = await _context.ProjectStars.Where(ps => ps.UserId == userId).ToListAsync();
            _context.ProjectStars.RemoveRange(projectStars);

            var userMessages = await _context.Message.Where(m => m.SenderId == userId).ToListAsync();
            var userMessageIds = userMessages.Select(m => m.Id).ToList();

            if (userMessageIds.Any())
            {
                var repliesToUserMessages = await _context.Message
                    .Where(m => m.ReplyToId.HasValue && userMessageIds.Contains(m.ReplyToId.Value))
                    .ToListAsync();
                foreach (var reply in repliesToUserMessages)
                {
                    reply.ReplyToId = null;
                }
            }

            _context.Message.RemoveRange(userMessages);

            var chatParticipants = await _context.ChatParticipant.Where(cp => cp.UserId == userId).ToListAsync();
            _context.ChatParticipant.RemoveRange(chatParticipants);

            await _context.SaveChangesAsync();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                await transaction.RollbackAsync();
                return BadRequest(result.Errors);
            }

            await transaction.CommitAsync();
            return Ok(new { message = "Аккаунт успешно удален" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Не удалось удалить аккаунт: " + ex.Message });
        }
    }

    [HttpPost("changePassword")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (string.IsNullOrEmpty(model.NewPassword) || model.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "Пароль должен содержать минимум 6 символов" });
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(new { message = "Пароль успешно изменен" });
    }

    [HttpPost("toggleWatchUser/{username}")]
    [Authorize]
    public async Task<IActionResult> ToggleWatchUser(string username)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var targetUser = await _userManager.FindByNameAsync(username);
        if (targetUser == null) return NotFound("Пользователь не найден");

        if (targetUser.Id == currentUserId)
        {
            return BadRequest(new { message = "Вы не можете отслеживать самого себя" });
        }

        var currentUser = await _userManager.FindByIdAsync(currentUserId);
        if (currentUser == null) return Unauthorized();

        var existingWatcher = await _context.UserWatchers
            .FirstOrDefaultAsync(uw => uw.WatcherId == currentUserId && uw.TargetUserId == targetUser.Id);

        bool isWatching;
        bool isWatchPending;
        bool notifyTarget = false;

        if (existingWatcher != null)
        {
            if (existingWatcher.Status == MemberStatus.Active)
            {
                targetUser.Followers = Math.Max(0, (targetUser.Followers ?? 1) - 1);
                currentUser.Followings = Math.Max(0, (currentUser.Followings ?? 1) - 1);
            }
            else if (existingWatcher.Status == MemberStatus.Pending)
            {
                notifyTarget = true;
            }

            _context.UserWatchers.Remove(existingWatcher);
            isWatching = false;
            isWatchPending = false;
        }
        else
        {
            var initialStatus = targetUser.IsPrivate ? MemberStatus.Pending : MemberStatus.Active;
            var newWatcher = new UserWatcher
            {
                WatcherId = currentUserId,
                TargetUserId = targetUser.Id,
                Status = initialStatus,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserWatchers.Add(newWatcher);

            if (initialStatus == MemberStatus.Active)
            {
                targetUser.Followers = (targetUser.Followers ?? 0) + 1;
                currentUser.Followings = (currentUser.Followings ?? 0) + 1;
                isWatching = true;
                isWatchPending = false;
            }
            else
            {
                isWatching = false;
                isWatchPending = true;
                notifyTarget = true;
            }
        }

        await _context.SaveChangesAsync();

        if (notifyTarget)
        {
            await _hubContext.Clients.User(targetUser.Id).SendAsync("watchRequestsChanged");
        }

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == targetUser.Id && uw.Status == MemberStatus.Active);

        return Ok(new 
        { 
            isWatching, 
            isWatchPending,
            watchersCount, 
            followers = watchersCount 
        });
    }

    [HttpGet("watchRequests")]
    [Authorize]
    public async Task<IActionResult> GetWatchRequests()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var requests = await _context.UserWatchers
            .Include(uw => uw.Watcher)
            .Where(uw => uw.TargetUserId == currentUserId && uw.Status == MemberStatus.Pending)
            .OrderByDescending(uw => uw.CreatedAt)
            .Select(uw => new
            {
                id = uw.WatcherId,
                userName = uw.Watcher.UserName,
                fullName = uw.Watcher.FullName,
                avatar = uw.Watcher.Avatar,
                bio_FirstLine = uw.Watcher.Bio_FirstLine,
                createdAt = uw.CreatedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("watchRequests/{requesterId}/accept")]
    [Authorize]
    public async Task<IActionResult> AcceptWatchRequest(string requesterId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var currentUser = await _userManager.FindByIdAsync(currentUserId);
        if (currentUser == null) return Unauthorized();

        var request = await _context.UserWatchers
            .Include(uw => uw.Watcher)
            .FirstOrDefaultAsync(uw => uw.WatcherId == requesterId && uw.TargetUserId == currentUserId && uw.Status == MemberStatus.Pending);

        if (request == null) return NotFound(new { message = "Заявка не найдена" });

        request.Status = MemberStatus.Active;
        currentUser.Followers = (currentUser.Followers ?? 0) + 1;
        if (request.Watcher != null)
        {
            request.Watcher.Followings = (request.Watcher.Followings ?? 0) + 1;
        }

        await _context.SaveChangesAsync();

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == currentUserId && uw.Status == MemberStatus.Active);

        await _hubContext.Clients.User(requesterId).SendAsync("watchRequestResolved", new
        {
            username = currentUser.UserName,
            accepted = true
        });

        await _hubContext.Clients.User(currentUserId).SendAsync("watchRequestsChanged");

        return Ok(new { message = "Заявка принята", watchersCount });
    }

    [HttpPost("watchRequests/{requesterId}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectWatchRequest(string requesterId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var currentUser = await _userManager.FindByIdAsync(currentUserId);
        if (currentUser == null) return Unauthorized();

        var request = await _context.UserWatchers
            .FirstOrDefaultAsync(uw => uw.WatcherId == requesterId && uw.TargetUserId == currentUserId && uw.Status == MemberStatus.Pending);

        if (request == null) return NotFound(new { message = "Заявка не найдена" });

        _context.UserWatchers.Remove(request);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.User(requesterId).SendAsync("watchRequestResolved", new
        {
            username = currentUser.UserName,
            accepted = false
        });

        await _hubContext.Clients.User(currentUserId).SendAsync("watchRequestsChanged");

        return Ok(new { message = "Заявка отклонена" });
    }
    
    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("FullName", user.FullName ?? "")            
        };

        var keyString = _config["Jwt:SigningKey"];

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var issuer = _config["Jwt:Site"];
        var audience = _config["Jwt:Site"];

        var expiryInDays = Convert.ToDouble(_config["Jwt:ExpiryInDays"] ?? "30");
            
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryInDays),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}