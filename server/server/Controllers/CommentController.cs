using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Hubs;
using server.Models;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;

        private readonly IHubContext<ChatHub> _hubContext;

        public CommentController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context,  IHubContext<ChatHub> hubContext)
        {
            _userManager = userManager;
            _config = config;
            _context = context;
            _hubContext = hubContext;
        }

        private async Task<bool> CanUserViewPostAsync(Post post, string? currentUserId)
        {
            if (post.CommunityId.HasValue && post.Community != null && post.Community.Type == CommunityType.Private)
            {
                if (string.IsNullOrEmpty(currentUserId)) return false;
                var isActiveMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == post.CommunityId.Value && m.UserId == currentUserId && m.Status == MemberStatus.Active);
                if (!isActiveMember) return false;
            }

            if (post.User != null && post.User.IsPrivate && !post.IsPostedAsCommunity)
            {
                if (string.IsNullOrEmpty(currentUserId)) return false;
                if (post.UserId != currentUserId)
                {
                    var isApprovedWatcher = await _context.UserWatchers
                        .AnyAsync(uw => uw.WatcherId == currentUserId && uw.TargetUserId == post.UserId && uw.Status == MemberStatus.Active);
                    if (!isApprovedWatcher) return false;
                }
            }

            return true;
        }

        private async Task<List<string>?> GetAllowedRecipientIdsForPostAsync(Post post)
        {
            bool restrictByAuthor = post.User != null && post.User.IsPrivate && !post.IsPostedAsCommunity;
            bool restrictByCommunity = post.CommunityId.HasValue && post.Community != null && post.Community.Type == CommunityType.Private;

            if (!restrictByAuthor && !restrictByCommunity)
            {
                return null;
            }

            HashSet<string>? allowed = null;

            if (restrictByCommunity)
            {
                var memberIds = await _context.CommunityMembers
                    .Where(m => m.CommunityId == post.CommunityId!.Value && m.Status == MemberStatus.Active)
                    .Select(m => m.UserId)
                    .ToListAsync();
                allowed = new HashSet<string>(memberIds);
            }

            if (restrictByAuthor)
            {
                var watcherIds = await _context.UserWatchers
                    .Where(uw => uw.TargetUserId == post.UserId && uw.Status == MemberStatus.Active)
                    .Select(uw => uw.WatcherId)
                    .ToListAsync();
                watcherIds.Add(post.UserId);

                if (allowed == null)
                {
                    allowed = new HashSet<string>(watcherIds);
                }
                else
                {
                    allowed.IntersectWith(watcherIds);
                }
            }

            return allowed!.ToList();
        }

        // GET: api/Comment/5
        [HttpGet("getComment/{id}")]
        public async Task<ActionResult<Comment>> GetComment(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var commentEntity = await _context.Comment
                .Include(c => c.User)
                .Include(c => c.Post)
                    .ThenInclude(p => p.User)
                .Include(c => c.Post)
                    .ThenInclude(p => p.Community)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (commentEntity == null)
            {
                return NotFound();
            }

            if (commentEntity.Post != null && !await CanUserViewPostAsync(commentEntity.Post, currentUserId))
            {
                return StatusCode(403, new { message = "Доступ ограничен", isLocked = true });
            }

            return Ok(new {
                id = commentEntity.Id,
                content = commentEntity.Content,
                created = commentEntity.Created,
                authorName = commentEntity.User?.FullName,
                authorUsername = commentEntity.User?.UserName,
                authorAvatar = commentEntity.User?.Avatar
            });
        }

        // PUT: api/Comment/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("updateComment/{id}")]
        [Authorize]
        public async Task<IActionResult> PutComment(Guid id, [FromBody] UpdateCommentDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(model.Content))
            {
                return BadRequest();
            }

            var comment = await _context.Comment
                .Include(c => c.Post)
                    .ThenInclude(p => p.User)
                .Include(c => c.Post)
                    .ThenInclude(p => p.Community)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null) return NotFound();
            if (comment.UserId != userId) return Forbid();

            comment.Content = model.Content;
            await _context.SaveChangesAsync();

            var updatePayload = new
            {
                id = comment.Id,
                postId = comment.PostId,
                content = comment.Content
            };

            var allowedRecipients = comment.Post != null
                ? await GetAllowedRecipientIdsForPostAsync(comment.Post)
                : null;

            if (allowedRecipients == null)
            {
                await _hubContext.Clients.All.SendAsync("commentUpdated", updatePayload);
            }
            else if (allowedRecipients.Count > 0)
            {
                await _hubContext.Clients.Users(allowedRecipients).SendAsync("commentUpdated", updatePayload);
            }

            return NoContent();
        }

        // POST: api/Comment
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("createComment")]
        [Authorize]
        public async Task<ActionResult<Comment>> PostComment([FromBody] CreateCommentDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (string.IsNullOrEmpty(model.Content))
            {
                return BadRequest();
            }
            
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var post = await _context.Post
                .Include(p => p.User)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == model.PostId);

            if (post == null) return NotFound();

            if (!await CanUserViewPostAsync(post, userId))
            {
                return Forbid();
            }
            
            var comment = new Comment
            {
                Content = model.Content,
                PostId = model.PostId,
                UserId = userId
            };
            
            _context.Comment.Add(comment);
            post.CommentsCount++;
            
            await _context.SaveChangesAsync();

            var commentPayload = new {
                id = comment.Id,
                postId = comment.PostId,
                content = comment.Content,
                created = comment.Created,
                    
                authorName = user.FullName,
                authorUsername = user.UserName,
                authorAvatar = user.Avatar
            };

            var allowedRecipients = await GetAllowedRecipientIdsForPostAsync(post);
            if (allowedRecipients == null)
            {
                await _hubContext.Clients.All.SendAsync("commentCreated", commentPayload);
            }
            else if (allowedRecipients.Count > 0)
            {
                await _hubContext.Clients.Users(allowedRecipients).SendAsync("commentCreated", commentPayload);
            }

            return CreatedAtAction("GetComment", new { id = comment.Id }, new { id = comment.Id, message = "Комментарий успешно добавлен" });
        }

        // DELETE: api/Comment/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var comment = await _context.Comment.FindAsync(id);

            if (comment == null) return NotFound();
            if (comment.UserId != userId) return Forbid();

            var commentId = comment.Id;
            var postId = comment.PostId;

            var post = await _context.Post
                .Include(p => p.User)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post != null)
            {
                post.CommentsCount = Math.Max(0, post.CommentsCount - 1);
            }

            _context.Comment.Remove(comment);
            await _context.SaveChangesAsync();

            var latestComments = post == null
                ? null
                : await _context.Comment
                    .Where(c => c.PostId == post.Id)
                    .OrderByDescending(c => c.Created)
                    .Take(3)
                    .Select(c => new
                    {
                        id = c.Id,
                        content = c.Content,
                        created = c.Created,
                        authorName = c.User.FullName,
                        authorUsername = c.User.UserName,
                        authorAvatar = c.User.Avatar
                    })
                    .ToListAsync();

            var deletePayload = new
            {
                id = commentId,
                postId = postId,
                commentsCount = post?.CommentsCount ?? 0,
                latestComments = latestComments
            };

            var allowedRecipients = post != null
                ? await GetAllowedRecipientIdsForPostAsync(post)
                : null;

            if (allowedRecipients == null)
            {
                await _hubContext.Clients.All.SendAsync("commentDeleted", deletePayload);
            }
            else if (allowedRecipients.Count > 0)
            {
                await _hubContext.Clients.Users(allowedRecipients).SendAsync("commentDeleted", deletePayload);
            }

            return NoContent();
        }

        private bool CommentExists(Guid id)
        {
            return _context.Comment.Any(e => e.Id == id);
        }
        
        [HttpGet("getAllCommentsToPost/{id}")]
        public async Task<IActionResult> GetCommentsForPost(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var post = await _context.Post
                .Include(p => p.User)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null) return NotFound();

            if (!await CanUserViewPostAsync(post, currentUserId))
            {
                return StatusCode(403, new { message = "Доступ ограничен", isLocked = true });
            }

            var comments = await _context.Comment
                .Include(p => p.User)
                .Where(p => p.PostId == id)
                .OrderByDescending(p => p.Created)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar
                })
                .ToListAsync();

            return Ok(comments);
        }
    }
}
