namespace OrderService.Application.TableSessions.Commands;

public class OpenSessionCommand : MediatR.IRequest<OpenSessionResponse>
{
    public Guid TableId { get; set; }
}

public class OpenSessionResponse
{
    public Guid SessionId { get; set; }
    public string GroupCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
