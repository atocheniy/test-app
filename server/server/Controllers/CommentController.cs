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

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;

        public CommentController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context)
        {
            _userManager = userManager;
            _config = config;
            _context = context;
        }

        // GET: api/Comment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComment()
        {
            return await _context.Comment.ToListAsync();
        }

        // GET: api/Comment/5
        [HttpGet("getComment/{id}")]
        public async Task<ActionResult<Comment>> GetComment(Guid id)
        {
            var comment = await _context.Comment
                .Include(p => p.User)
                .Where(p => p.Id == id)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar
                })
                .FirstOrDefaultAsync();

            if (comment == null)
            {
                return NotFound();
            }

            return Ok(comment);
        }

        // PUT: api/Comment/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutComment(Guid id, Comment comment)
        {
            if (id != comment.Id)
            {
                return BadRequest();
            }

            _context.Entry(comment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CommentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
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
            
            var comment = new Comment
            {
                Content = model.Content,
                PostId = model.PostId,
                UserId = userId
            };
            
            _context.Comment.Add(comment);
            
            var post = await _context.Post.FindAsync(model.PostId);
            if (post != null)
            {
                post.CommentsCount++;
            }
            
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetComment", new { id = comment.Id }, new { id = comment.Id, message = "Комментарий успешно добавлен" });
        }

        // DELETE: api/Comment/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(Guid id)
        {
            var comment = await _context.Comment.FindAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            _context.Comment.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CommentExists(Guid id)
        {
            return _context.Comment.Any(e => e.Id == id);
        }
        
        [HttpGet("getAllCommentsToPost/{id}")]
        public async Task<IActionResult> GetCommentsForPost(Guid id)
        {
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
