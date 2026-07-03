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
        var user = new ApplicationUser { UserName = model.Email, Email = model.Email, FullName = model.FullName };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded) return Ok(new { message = "Регистрация успешна" });

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginInfo model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);

        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return Ok(new { 
                token = GenerateJwtToken(user),
            }); 
        }

        return Unauthorized("Неверный логин или пароль");
    }
    
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        return Ok(new { 
            email = user.Email, 
            fullName = user.FullName
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