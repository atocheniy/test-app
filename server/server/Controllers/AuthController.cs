using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Data;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context)
    {
        _userManager = userManager;
        _config = config;
        _context = context;
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterInfo model)
    {
        var user = new ApplicationUser { UserName = model.UserName, Email = model.Email, FullName = model.FullName,   Room = string.IsNullOrEmpty(model.Room) ? "general" : model.Room,  ConnectedAt = DateTime.UtcNow};
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded) return Ok(new { message = "Регистрация успешна" });

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginInfo model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) user = await _userManager.FindByNameAsync(model.Email);

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
                bio_FirstLine = u.Bio_FirstLine,
                followers = u.Followers
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("recommended")]
    public async Task<IActionResult> GetRecommendedUsers([FromQuery] int limit = 5)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        limit = Math.Clamp(limit, 1, 20);

        List<string> watchedUserIds = new();
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

            watchedUserIds = await _context.UserWatchers
                .Where(w => w.WatcherId == currentUserId)
                .Select(w => w.TargetUserId)
                .ToListAsync();

            if (watchedUserIds.Any())
            {
                mutualWatchers = await _context.UserWatchers
                    .Where(w => watchedUserIds.Contains(w.WatcherId)
                                && w.TargetUserId != currentUserId
                                && !watchedUserIds.Contains(w.TargetUserId))
                    .GroupBy(w => w.TargetUserId)
                    .Select(g => new { UserId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.UserId, x => x.Count);
            }
        }

        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(currentUserId))
        {
            query = query.Where(u => u.Id != currentUserId);
            if (watchedUserIds.Any())
            {
                query = query.Where(u => !watchedUserIds.Contains(u.Id));
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

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == user.Id);

        var watchingCount = await _context.UserWatchers
            .CountAsync(uw => uw.WatcherId == user.Id);

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
            projects = projects,
            experiences = experiences,
            preferredLanguage = user.PreferredLanguage ?? "ru"
        });
    }
    
    [HttpGet("profile/{username}")]
    public async Task<IActionResult> GetUserProfile(string username)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();

        var isWatching = currentUserId != null && await _context.UserWatchers
            .AnyAsync(uw => uw.WatcherId == currentUserId && uw.TargetUserId == user.Id);

        var watchersCount = await _context.UserWatchers
            .CountAsync(uw => uw.TargetUserId == user.Id);

        var watchingCount = await _context.UserWatchers
            .CountAsync(uw => uw.WatcherId == user.Id);

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
            id =  user.Id,
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
            isWatching = isWatching,
            projects = projects,
            experiences = experiences,
            preferredLanguage = user.PreferredLanguage ?? "ru"
        });
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(new { message = "Аккаунт успешно удален" });
    }

    [HttpPost("changePassword")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
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
        if (existingWatcher != null)
        {
            _context.UserWatchers.Remove(existingWatcher);
            targetUser.Followers = Math.Max(0, (targetUser.Followers ?? 1) - 1);
            currentUser.Followings = Math.Max(0, (currentUser.Followings ?? 1) - 1);
            isWatching = false;
        }
        else
        {
            var newWatcher = new UserWatcher
            {
                WatcherId = currentUserId,
                TargetUserId = targetUser.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserWatchers.Add(newWatcher);
            targetUser.Followers = (targetUser.Followers ?? 0) + 1;
            currentUser.Followings = (currentUser.Followings ?? 0) + 1;
            isWatching = true;
        }

        await _context.SaveChangesAsync();

        var watchersCount = await _context.UserWatchers.CountAsync(uw => uw.TargetUserId == targetUser.Id);

        return Ok(new 
        { 
            isWatching, 
            watchersCount, 
            followers = watchersCount 
        });
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