using Microsoft.AspNetCore.SignalR;

namespace RealtimeService.Api.Hubs;

public class NotificationHub : Hub
{
    // Clients can call this from Frontend to join a specific table group
    public async Task JoinTableGroup(Guid tableSessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Table-{tableSessionId}");
        await Clients.Caller.SendAsync("JoinedGroup", $"Table-{tableSessionId}");
    }

    // Clients can call this from Frontend to leave the table group
    public async Task LeaveTableGroup(Guid tableSessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Table-{tableSessionId}");
    }

    // Kitchen/Admin clients can join a global kitchen group
    public async Task JoinKitchenGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "KitchenGroup");
        await Clients.Caller.SendAsync("JoinedGroup", "KitchenGroup");
    }
}
