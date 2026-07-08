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

        private readonly IHubContext<SiteHub> _hubContext;
        
        public PostController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context, IHubContext<SiteHub> hubContext)
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
            var post = await _context.Post
                .Include(p => p.User)
                .Where(p => p.Id == id)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    commentsCount = p.CommentsCount,
                    
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
            
            if (string.IsNullOrEmpty(model.Content) && (model.Attachments == null || model.Attachments.Length == 0))
            {
                return BadRequest();
            }
            
            var post = new Post
            {
                Content = model.Content,
                Attachments = model.Attachments,
                UserId = userId
            };
            
            _context.Post.Add(post);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("postCreated", new {
                id = post.Id,
                content = post.Content,
                created = post.Created,
                attachments = post.Attachments,
                likesCount = post.LikesCount,
                commentsCount = post.CommentsCount,
                
                authorName = user.FullName,
                authorUsername = user.UserName,
                authorAvatar = user.Avatar,
                
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
            
            if (post == null)
            {
                return NotFound();
            }
            
            if (post.UserId != userId)
            {
                return Forbid();
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
            var posts = await _context.Post
                .Include(p => p.User)
                .OrderByDescending(p => p.Created)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    commentsCount = p.CommentsCount,
                    
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
                    commentsCount = p.CommentsCount,
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
        
        [HttpGet("getOtherUserPosts/{username}")]
        public async Task<IActionResult> GetPostsByUsername(string username)
        {
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
                    commentsCount = p.CommentsCount,
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
    }
}
