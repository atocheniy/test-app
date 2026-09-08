using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using Microsoft.AspNetCore.SignalR;
using server.Hubs;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;

        private readonly IHubContext<ChatHub> _hubContext;
        
        public PostController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _userManager = userManager;
            _config = config;
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/Post
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Post>>> GetPost()
        {
            return await _context.Post.ToListAsync();
        }

        // GET: api/Post/5
        [HttpGet("getPost/{id}")]
        public async Task<ActionResult<Post>> GetPost(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var post = await _context.Post
                .Include(p => p.User)
                .Where(p => p.Id == id)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    commentsList = p.Comments
                        .OrderBy(c => c.Created)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .FirstOrDefaultAsync();

            if (post == null)
            {
                return NotFound();
            }

            return Ok(post);
        }

        // PUT: api/Post/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("updatePost/{id}")]
        [Authorize]
        public async Task<IActionResult> PutPost(Guid id, [FromBody] UpdatePostDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var post = await _context.Post.FindAsync(id);

            if (post == null) return NotFound();
            
            if (post.UserId != userId)
            {
                return Forbid();
            }

            post.Content = model.Content;
            post.Attachments = model.Attachments;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/Post
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("createPost")]
        [Authorize]
        public async Task<IActionResult> PostPost([FromBody] CreatePostDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();
            
            if (string.IsNullOrEmpty(model.Content) && 
                (model.Attachments == null || model.Attachments.Length == 0) && 
                !model.RepostOfPostId.HasValue)
            {
                return BadRequest("Пост не может быть пустым.");
            }

            object? repostInfo = null;
            
            if (model.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == model.RepostOfPostId.Value);

                if (originalPost != null)
                {
                    originalPost.RepostsCount++;
                    repostInfo = new {
                        id = originalPost.Id,
                        content = originalPost.Content,
                        created = originalPost.Created,
                        attachments = originalPost.Attachments,
                        authorName = originalPost.User?.FullName,
                        authorUsername = originalPost.User?.UserName,
                        authorAvatar = originalPost.User?.Avatar
                    };
                }
            }
            
            var post = new Post
            {
                Content = model.Content,
                Attachments = model.Attachments,
                UserId = userId,
                RepostOfPostId = model.RepostOfPostId
            };
            
            _context.Post.Add(post);
            await _context.SaveChangesAsync();
            
            if (model.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post.FindAsync(model.RepostOfPostId.Value);
                if (originalPost != null)
                {
                    await _hubContext.Clients.All.SendAsync("postReposted", new
                    {
                        postId = originalPost.Id,
                        repostsCount = originalPost.RepostsCount
                    });
                }
            }

            await _hubContext.Clients.All.SendAsync("postCreated", new {
                id = post.Id,
                content = post.Content,
                created = post.Created,
                attachments = post.Attachments,
                likesCount = post.LikesCount,
                isLikedByMe = false,
                commentsCount = post.CommentsCount,
                
                authorName = user.FullName,
                authorUsername = user.UserName,
                authorAvatar = user.Avatar,
                repostOfPost = repostInfo,
                
                commentsList = post.Comments
                    .OrderByDescending(c => c.Created)
                    .Take(3)
                    .Select(c => new {
                        id = c.Id,
                        content = c.Content,
                        created = c.Created,
                        authorName = c.User.FullName,
                        authorUsername = c.User.UserName,
                        authorAvatar = c.User.Avatar
                    })
            });
            
            return CreatedAtAction("GetPost", new { id = post.Id }, post);
        }

        // DELETE: api/Post/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var post = await _context.Post.FindAsync(id);
    
            if (post == null) return NotFound();
            if (post.UserId != userId) return Forbid();
            
            if (post.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post.FindAsync(post.RepostOfPostId.Value);
                if (originalPost != null)
                {
                    originalPost.RepostsCount = Math.Max(0, originalPost.RepostsCount - 1);
            
                    await _hubContext.Clients.All.SendAsync("postReposted", new
                    {
                        postId = originalPost.Id,
                        repostsCount = originalPost.RepostsCount
                    });
                }
            }

            _context.Post.Remove(post);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PostExists(Guid id)
        {
            return _context.Post.Any(e => e.Id == id);
        }
        
        [HttpGet("getAllPosts")]
        public async Task<IActionResult> GetFeed()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var posts = await _context.Post
                .Include(p => p.User)
                .OrderByDescending(p => p.Created)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpPost("likePost/{id}")]
        [Authorize]
        public async Task<IActionResult> LikePost(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var post = await _context.Post.FindAsync(id);
            if (post == null) return NotFound();
            
            var existingLike = await _context.PostLikes
                .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);
            
            bool isLiked;
            
            if (existingLike != null)
            {
                _context.PostLikes.Remove(existingLike);
                post.LikesCount = Math.Max(0, post.LikesCount - 1);
                isLiked = false;
            }
            else
            {
                _context.PostLikes.Add(new PostLike
                {
                    PostId = id,
                    UserId = userId
                });
                post.LikesCount++;
                isLiked = true;
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("postLiked", new 
            {
                postId = post.Id,
                likesCount = post.LikesCount,
                userId = userId,
                isLiked = isLiked
            });
            
            return Ok(new 
            { 
                isLiked = isLiked, 
                likesCount = post.LikesCount 
            });
        }
        
        [HttpGet("getUserPosts")]
        [Authorize]
        public async Task<IActionResult> GetUserPosts()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var posts = await _context.Post
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Created)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == userId),
                    commentsCount = p.CommentsCount,
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            return Ok(posts);
        }
        
        [HttpGet("getOtherUserPosts/{username}")]
        public async Task<IActionResult> GetPostsByUsername(string username)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound();

            var posts = await _context.Post
                .Include(p => p.User)
                .Where(p => p.UserId == user.Id)
                .OrderByDescending(p => p.Created)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            return Ok(posts);
        }
    }
}
