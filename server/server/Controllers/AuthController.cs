using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
        var user = new ApplicationUser { UserName = model.UserName, Email = model.Email, FullName = model.FullName };
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
    
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        return Ok(new { 
            email = user.Email, 
            fullName = user.FullName,
            userName = user.UserName,
            bio_FirstLine = user.Bio_FirstLine,
            bio_SecondLine = user.Bio_SecondLine,
            avatar = user.Avatar,
            banner = user.Banner
        });
    }
    
    [HttpGet("profile/{username}")]
    public async Task<IActionResult> GetUserProfile(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound();
            
        return Ok(new { 
            fullName = user.FullName,
            userName = user.UserName,
            bio_FirstLine = user.Bio_FirstLine,
            bio_SecondLine = user.Bio_SecondLine,
            avatar = user.Avatar,
            banner = user.Banner,
            followers = user.Followers,
            followings = user.Followings
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