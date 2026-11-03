using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public class ChangePasswordDto
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Пароль должен содержать минимум 6 символов")]
    public string NewPassword { get; set; } = string.Empty;
}
