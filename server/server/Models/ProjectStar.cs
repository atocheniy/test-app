using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class ProjectStar
{
    public Guid ProjectId { get; set; }
    [ForeignKey(nameof(ProjectId))]
    public virtual UserProject? Project { get; set; }

    public string UserId { get; set; } = string.Empty;
    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
