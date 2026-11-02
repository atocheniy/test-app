using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, ApplicationUser> _connectedUsers = new();
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task JoinSite(string roomName, string userName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

        var dbUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserName == userName);
        var showOnline = dbUser?.ShowOnlineStatus ?? true;

        _connectedUsers[Context.ConnectionId] = new ApplicationUser()
        {
            Id = dbUser?.Id ?? Context.ConnectionId,
            UserName = userName,
            Room = roomName,
            ShowOnlineStatus = showOnline,
            ConnectedAt = DateTime.UtcNow
        };

        var activeUsers = GetUsersInRoom(roomName);

        if (showOnline)
        {
            await Clients.Group(roomName).SendAsync("userJoined", new
            {
                userName,
                timestamp = DateTime.UtcNow,
                activeUsers
            });
        }
        else
        {
            await Clients.Caller.SendAsync("userJoined", new
            {
                userName,
                timestamp = DateTime.UtcNow,
                activeUsers
            });
        }
    }

    public async Task ChangeOnlineStatus(string roomName, bool showOnline)
    {
        if (_connectedUsers.TryGetValue(Context.ConnectionId, out var user))
        {
            foreach (var kvp in _connectedUsers.Where(kvp => kvp.Value.UserName == user.UserName))
            {
                kvp.Value.ShowOnlineStatus = showOnline;
            }

            var activeUsers = GetUsersInRoom(roomName);

            if (showOnline)
            {
                await Clients.Group(roomName).SendAsync("userJoined", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers
                });
            }
            else
            {
                await Clients.OthersInGroup(roomName).SendAsync("userLeft", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers
                });

                await Clients.Caller.SendAsync("userJoined", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers
                });
            }
        }
    }
    
    public async Task LeaveRoom(string roomName)
    {
        if (_connectedUsers.TryRemove(Context.ConnectionId, out var user))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);

            if (user.ShowOnlineStatus)
            {
                await Clients.Group(roomName).SendAsync("userLeft", new
                {
                    userName = user.UserName,
                    timestamp = DateTime.UtcNow,
                    activeUsers = GetUsersInRoom(roomName)
                });
            }
        }
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectedUsers.TryRemove(Context.ConnectionId, out var user))
        {
            if (user.ShowOnlineStatus && !string.IsNullOrEmpty(user.Room))
            {
                var isStillConnected = _connectedUsers.Values.Any(u => u.UserName == user.UserName && u.Room == user.Room && u.ShowOnlineStatus);
                if (!isStillConnected)
                {
                    await Clients.Group(user.Room).SendAsync("userLeft", new
                    {
                        userName = user.UserName,
                        timestamp = DateTime.UtcNow,
                        activeUsers = GetUsersInRoom(user.Room)
                    });
                }
            }
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
            .Where(u => u.Room == room && u.ShowOnlineStatus && !string.IsNullOrEmpty(u.UserName))
            .Select(u => u.UserName!)
            .Distinct()
            .ToList();
    }
}
