using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace RealtimeService.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"[Hub] Connection established: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogError(exception, $"[Hub] Connection lost: {Context.ConnectionId}");
        }
        else
        {
            _logger.LogInformation($"[Hub] Connection lost: {Context.ConnectionId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
    
    // Clients can call this from Frontend to join a specific table group
    public async Task JoinTableGroup(string sessionId)
    {
        if (Guid.TryParse(sessionId, out var tableSessionId))
        {
            var groupName = HubConstants.TableGroup(tableSessionId.ToString());
            _logger.LogInformation($"[Hub] Client {Context.ConnectionId} joining group: {groupName}");
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Caller.SendAsync(HubConstants.Events.JoinedGroup, groupName);
        }
        else
        {
            _logger.LogWarning($"[Hub] Invalid tableSessionId format: {sessionId}");
        }
    }

    // Clients can call this from Frontend to leave the table group
    public async Task LeaveTableGroup(string sessionId)
    {
        if (Guid.TryParse(sessionId, out var tableSessionId))
        {
            var groupName = HubConstants.TableGroup(tableSessionId.ToString());
            _logger.LogInformation($"[Hub] Client {Context.ConnectionId} leaving group: {groupName}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }
    }

    // Kitchen/Admin clients can join a global kitchen group
    [Authorize(Policy = "Admin")]
    public async Task JoinKitchenGroup()
    {
        _logger.LogInformation($"[Hub] Client {Context.ConnectionId} joining group: {HubConstants.KitchenGroup}");
        await Groups.AddToGroupAsync(Context.ConnectionId, HubConstants.KitchenGroup);
        await Clients.Caller.SendAsync(HubConstants.Events.JoinedGroup, HubConstants.KitchenGroup);
    }
}
