namespace server.DTOs;

public class TrendingTopicDto
{
    public string Tag { get; set; } = string.Empty;
    public string DisplayTag { get; set; } = string.Empty;
    public string Category { get; set; } = "Tech";
    public int PostCount { get; set; }
    public string PostsFormatted { get; set; } = string.Empty;
    public double Score { get; set; }
}
