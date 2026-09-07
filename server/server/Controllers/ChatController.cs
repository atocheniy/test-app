using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Chat
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Chat>>> GetMyChats()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var chats = await _context.Chat
                .Where(c => c.Participants.Any(p => p.UserId == currentUserId))
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new
                {
                    Id = c.Id,
                    Name = c.Participants
                        .Where(p => p.UserId != currentUserId)
                        .Select(p => p.User.FullName)
                        .FirstOrDefault() ?? c.Title ?? "Chat",
                    UserName = c.Participants
                        .Where(p => p.UserId != currentUserId)
                        .Select(p => p.User.UserName)
                        .FirstOrDefault(),
                    Avatar = c.Participants
                        .Where(p => p.UserId != currentUserId)
                        .Select(p => p.User.Avatar)
                        .FirstOrDefault(),
                    Content = c.Messages
                        .OrderByDescending(m => m.SentAt)
                        .Select(m => m.Content)
                        .FirstOrDefault(),
                    Time = c.UpdatedAt.ToString("HH:mm")
                })
                .ToListAsync();

            return Ok(chats);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetChat(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var chat = await _context.Chat
                .Where(c => c.Id == id && c.Participants.Any(p => p.UserId == currentUserId))
                .Select(c => new
                {
                    Id = c.Id,
                    Title = c.Title,
                    Participants = c.Participants.Select(p => new
                    {
                        UserId = p.UserId,
                        FullName = p.User.FullName,
                        UserName = p.User.UserName,
                        Avatar = p.User.Avatar
                    })
                })
                .FirstOrDefaultAsync();

            if (chat == null)
                return NotFound("Error");

            return Ok(chat);
        }

        // PUT: api/Chat/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutChat(Guid id, Chat chat)
        {
            if (id != chat.Id)
            {
                return BadRequest();
            }

            _context.Entry(chat).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ChatExists(id))
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

        // POST: api/Chat
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("start/{targetUserId}")]
        public async Task<IActionResult> StartChat(string targetUserId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == targetUserId)
                return BadRequest("Error");

            var existingChatId = await _context.Chat
                .Where(c => c.Participants.Count == 2 &&
                            c.Participants.Any(p => p.UserId == currentUserId) &&
                            c.Participants.Any(p => p.UserId == targetUserId))
                .Select(c => c.Id)
                .FirstOrDefaultAsync();

            if (existingChatId != Guid.Empty)
            {
                return Ok(new { chatId = existingChatId });
            }

            var newChat = new Chat();
            newChat.Participants.Add(new ChatParticipant { UserId = currentUserId });
            newChat.Participants.Add(new ChatParticipant { UserId = targetUserId });

            _context.Chat.Add(newChat);
            await _context.SaveChangesAsync();

            return Ok(new { chatId = newChat.Id });
        }

        // DELETE: api/Chat/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChat(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var chat = await _context.Chat
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == id && c.Participants.Any(p => p.UserId == currentUserId));

            if (chat == null)
                return NotFound();

            _context.Chat.Remove(chat);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ChatExists(Guid id)
        {
            return _context.Chat.Any(e => e.Id == id);
        }
    }
}
