namespace RealtimeService.Api.Hubs;

public static class HubConstants
{
    public const string KitchenGroup = "KitchenGroup";
    public const string AdminGroup = "Admin";

    public static string TableGroup(string sessionId) => $"Table-{sessionId}";

    public static class Events
    {
        public const string JoinedGroup = "JoinedGroup";
        public const string ReceiveNewOrder = "ReceiveNewOrder";
        public const string PaymentSuccess = "PaymentSuccess";
        public const string OrderUpdated = "OrderUpdated";
        public const string OrderConfirmed = "OrderConfirmed";
    }
}
