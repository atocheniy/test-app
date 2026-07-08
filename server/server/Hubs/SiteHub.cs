using Microsoft.AspNetCore.SignalR;
using server.Models;

namespace server.Hubs;

public class SiteHub : Hub
{
    private static readonly Dictionary<string, ApplicationUser> _connectedUsers = new();
    private static readonly object _lock = new();

    public SiteHub()
    {
    }
    
    public async Task JoinSite(string roomName, string userName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
        
        lock (_lock)
        {
            _connectedUsers[Context.ConnectionId] = new ApplicationUser()
            {
                UserName = userName,
                Room = roomName,
                ConnectedAt = DateTime.UtcNow
            };
        }
        
        await Clients.Group(roomName).SendAsync("userJoined", new
        {
            userName,
            timestamp = DateTime.UtcNow,
            activeUsers = GetUsersInRoom(roomName)
        });
    }
    
    public async Task LeaveRoom(string roomName)
    {
        string userName;
        string joinedRoom;
        lock (_lock)
        {
            if (_connectedUsers.TryGetValue(Context.ConnectionId, out var user))
            {
                userName = user.UserName;
                joinedRoom = user.Room;
                _connectedUsers.Remove(Context.ConnectionId);
            }
            else
            {
                return;
            }
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, joinedRoom);
        await Clients.Group(joinedRoom).SendAsync("userLeft", new
        {
            userName,
            timestamp = DateTime.UtcNow,
            activeUsers = GetUsersInRoom(joinedRoom)
        });
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        ApplicationUser user;
        lock (_lock)
        {
            if (_connectedUsers.TryGetValue(Context.ConnectionId, out user))
            {
                _connectedUsers.Remove(Context.ConnectionId);
            }
            else
            {
                return;
            }
        }

        await Clients.Group(user.Room).SendAsync("userLeft", new
        {
            userName = user.UserName,
            timestamp = DateTime.UtcNow,
            activeUsers = GetUsersInRoom(user.Room)
        });

        await base.OnDisconnectedAsync(exception);
    }
    
    private List<string> GetUsersInRoom(string room)
    {
        lock (_lock)
        {
            return _connectedUsers.Values
                .Where(u => u.Room == room)
                .Select(u => u.UserName)
                .Distinct()
                .ToList();
        }
    }
}