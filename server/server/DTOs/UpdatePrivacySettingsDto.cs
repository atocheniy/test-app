namespace server.DTOs;

public class UpdatePrivacySettingsDto
{
    public bool? ShowOnlineStatus { get; set; }
    public bool? AllowDirectMessages { get; set; }
    public bool? IsPrivate { get; set; }
}
