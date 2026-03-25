using Microsoft.AspNetCore.SignalR;

namespace RealtimeService.Api.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"[Hub] Connection established: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[Hub] Connection lost: {Context.ConnectionId}. Error: {exception?.Message}");
        await base.OnDisconnectedAsync(exception);
    }
    // Clients can call this from Frontend to join a specific table group
    public async Task JoinTableGroup(string sessionId)
    {
        if (Guid.TryParse(sessionId, out var tableSessionId))
        {
            var groupName = $"Table-{tableSessionId}";
            Console.WriteLine($"[Hub] Client {Context.ConnectionId} joining group: {groupName}");
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync("JoinedGroup", groupName);
        }
        else
        {
            Console.WriteLine($"[Hub] Invalid tableSessionId format: {sessionId}");
        }
    }

    // Clients can call this from Frontend to leave the table group
    public async Task LeaveTableGroup(string sessionId)
    {
        if (Guid.TryParse(sessionId, out var tableSessionId))
        {
            Console.WriteLine($"[Hub] Client {Context.ConnectionId} leaving group: Table-{tableSessionId}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Table-{tableSessionId}");
        }
    }

    // Kitchen/Admin clients can join a global kitchen group
    public async Task JoinKitchenGroup()
    {
        Console.WriteLine($"[Hub] Client {Context.ConnectionId} joining group: KitchenGroup");
        await Groups.AddToGroupAsync(Context.ConnectionId, "KitchenGroup");
        await Clients.Caller.SendAsync("JoinedGroup", "KitchenGroup");
    }
}
