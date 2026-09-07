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
using server.DTOs;
using Microsoft.AspNetCore.SignalR;
using server.Hubs;
using server.Models;

namespace server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessageController(ApplicationDbContext context,  IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext; 
        }

        // GET: api/Message
        [HttpGet("chat/{chatId}")]
        public async Task<IActionResult> GetChatMessages(Guid chatId, [FromQuery] int page = 1)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var isParticipant = await _context.ChatParticipant
                .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == currentUserId);

            if (!isParticipant)
                return Forbid();

            int pageSize = 30;

            var messages = await _context.Message
                .Where(m => m.ChatId == chatId)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    Content = m.Content,
                    Attachments = m.Attachments,
                    Time = m.SentAt.ToString("HH:mm"),
                    IsMine = m.SenderId == currentUserId,
                    IsRead = m.IsRead,
                    
                    ReplyTo = m.ReplyTo == null ? null : new {
                        id = m.ReplyTo.Id,
                        content = m.ReplyTo.Content,
                        authorName = m.ReplyTo.Sender != null 
                            ? (m.ReplyTo.Sender.FullName ?? m.ReplyTo.Sender.UserName) 
                            : "User",
                        attachments = m.ReplyTo.Attachments
                    }
                })
                .ToListAsync();

            return Ok(messages);
        }

        // PUT: api/Message/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMessage(Guid id, [FromBody] EditMessageDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var message = await _context.Message.FindAsync(id);
            if (message == null)
                return NotFound();
            
            if (message.SenderId != currentUserId)
                return Forbid();

            message.Content = dto.Content;
            message.Attachments = dto.Attachments;
            await _context.SaveChangesAsync();
            
            await _hubContext.Clients.Group(message.ChatId.ToString().ToLower()).SendAsync("MessageEdited", new
            {
                Id = message.Id,
                ChatId = message.ChatId,
                Content = message.Content,
                Attachments = message.Attachments
            });

            return NoContent();
        }

        // POST: api/Message
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<IActionResult> PostMessage([FromBody] SendMessageDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                                ?? User.FindFirstValue("sub") 
                                ?? User.FindFirstValue("id")
                                ?? User.Identity?.Name;
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();
            
            var chat = await _context.Chat
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == dto.ChatId);

            if (chat == null || !chat.Participants.Any(p => p.UserId == currentUserId))
                return Forbid();

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ChatId = dto.ChatId,
                SenderId = currentUserId,
                Content = dto.Content ?? string.Empty,
                Attachments = dto.Attachments ?? Array.Empty<string>(),
                ReplyToId = dto.ReplyToId, 
                SentAt = DateTime.UtcNow
            };
            
            chat.UpdatedAt = DateTime.UtcNow;

            _context.Message.Add(message);
            await _context.SaveChangesAsync();
            
            object? replyToData = null;
            if (dto.ReplyToId.HasValue)
            {
                var replyMsg = await _context.Message
                    .Include(m => m.Sender)
                    .FirstOrDefaultAsync(m => m.Id == dto.ReplyToId.Value);

                if (replyMsg != null)
                {
                    replyToData = new
                    {
                        id = replyMsg.Id,
                        content = replyMsg.Content,
                        authorName = replyMsg.Sender?.FullName ?? replyMsg.Sender?.UserName ?? "User",
                        attachments = replyMsg.Attachments
                    };
                }
            }
            
            var messageResponse = new
            {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                Content = message.Content,
                Attachments = message.Attachments,
                Time = message.SentAt.ToString("HH:mm"),
                replyTo = replyToData,
            };

            var participantIds = chat.Participants.Select(p => p.UserId).ToList();
            
            await _hubContext.Clients.Users(participantIds).SendAsync("ReceiveMessage", messageResponse);
            await _hubContext.Clients.Group(dto.ChatId.ToString().ToLower()).SendAsync("ReceiveMessage", messageResponse);

            
            return Ok(new
            {
                messageResponse.Id,
                messageResponse.ChatId,
                messageResponse.SenderId,
                messageResponse.Content,
                messageResponse.Attachments,
                messageResponse.Time,
                replyTo = replyToData,
                IsMine = true
            });
        }

        // DELETE: api/Message/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var message = await _context.Message.FindAsync(id);
            if (message == null)
                return NotFound();
            
            if (message.SenderId != currentUserId)
                return Forbid();
            
            var chatId = message.ChatId;
            
            var replies = await _context.Message
                .Where(m => m.ReplyToId == id)
                .ToListAsync();

            foreach (var reply in replies)
            {
                reply.ReplyToId = null;
            }

            _context.Message.Remove(message);
            await _context.SaveChangesAsync();
            
            await _hubContext.Clients.Group(chatId.ToString().ToLower()).SendAsync("MessageDeleted", new
            {
                Id = id,
                ChatId = chatId
            });

            return NoContent();
        }
        
        // POST: api/Message/read/{chatId}
        [HttpPost("read/{chatId}")]
        public async Task<IActionResult> MarkAsRead(Guid chatId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var unreadMessages = await _context.Message
                .Where(m => m.ChatId == chatId && m.SenderId != currentUserId && !m.IsRead)
                .ToListAsync();

            if (unreadMessages.Count != 0)
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }

                await _context.SaveChangesAsync();
                
                await _hubContext.Clients.Group(chatId.ToString().ToLower()).SendAsync("MessagesRead", new
                {
                    ChatId = chatId,
                    ReaderId = currentUserId
                });
            }

            return NoContent();
        }

        private bool MessageExists(Guid id)
        {
            return _context.Message.Any(e => e.Id == id);
        }
    }
}
