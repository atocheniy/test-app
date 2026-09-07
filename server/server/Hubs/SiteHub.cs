using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using server.Models;

namespace server.Hubs;

    [Authorize]
    public class ChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, ApplicationUser> _connectedUsers = new();
        
        public async Task JoinSite(string roomName, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
        
            _connectedUsers[Context.ConnectionId] = new ApplicationUser()
            {
                UserName = userName,
                Room = roomName,
                ConnectedAt = DateTime.UtcNow
            };
        
            await Clients.Group(roomName).SendAsync("userJoined", new
            {
                userName,
                timestamp = DateTime.UtcNow,
                activeUsers = GetUsersInRoom(roomName)
            });
        }
        
        public async Task LeaveRoom(string roomName)
        {
            if (_connectedUsers.TryRemove(Context.ConnectionId, out var user))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
                await Clients.Group(roomName).SendAsync("userLeft", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers = GetUsersInRoom(roomName)
                });
            }
        }
        
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connectedUsers.TryRemove(Context.ConnectionId, out var user))
            {
                await Clients.Group(user.Room).SendAsync("userLeft", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers = GetUsersInRoom(user.Room)
                });
            }

            await base.OnDisconnectedAsync(exception);
        }
        
        public async Task JoinChat(string chatId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
        }

        public async Task LeaveChat(string chatId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        }

        public async Task SendTyping(string chatId, string userName)
        {
            await Clients.OthersInGroup(chatId).SendAsync("UserTyping", new { chatId, userName });
        }
        
        private List<string> GetUsersInRoom(string room)
        {
            return _connectedUsers.Values
                .Where(u => u.Room == room)
                .Select(u => u.UserName)
                .Distinct()
                .ToList();
        }
    }