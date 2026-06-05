using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;

namespace System.E2ETests;

public class RewardPointsFlowTests
{
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;
    private const string BaseUrl = "http://localhost:8000/api";
    private const string SepayApiKey = "Apikey Bunbopaymentsupersecret16032004@";

    public RewardPointsFlowTests(ITestOutputHelper output)
    {
        _output = output;
        _client = new HttpClient();
    }

    [Fact]
    public async Task CompleteFlow_ScanToPayment_ShouldAccumulatePoints()
    {
        // ==========================================
        // ARRANGE: Login as Member
        // ==========================================
        _output.WriteLine("1. Logging in as admin...");
        var loginPayload = new { username = "admin", password = "Admin@123" };
        var loginRes = await _client.PostAsJsonAsync($"{BaseUrl}/identity/login", loginPayload);
        loginRes.EnsureSuccessStatusCode();
        var loginData = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        var token = loginData!.Token;
        
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Get initial points
        _output.WriteLine("2. Fetching initial loyalty points...");
        var initialPointsRes = await _client.GetAsync($"{BaseUrl}/promotion/points");
        int initialPoints = 0;
        if (initialPointsRes.IsSuccessStatusCode)
        {
            var initialPointsData = await initialPointsRes.Content.ReadFromJsonAsync<LoyaltyPointResponse>();
            initialPoints = initialPointsData?.Balance ?? 0;
        }
        _output.WriteLine($"Initial Points: {initialPoints}");

        _output.WriteLine("3. Fetching available tables...");
        var tablesRes = await _client.GetAsync($"{BaseUrl}/orders/tables");
        tablesRes.EnsureSuccessStatusCode();
        var tables = await tablesRes.Content.ReadFromJsonAsync<List<TableResponse>>();
        var tableId = tables?.FirstOrDefault()?.Id.ToString() ?? throw new Exception("No tables found.");

        _output.WriteLine($"3.1 Scanning table {tableId} to create session...");
        var scanRes = await _client.PostAsync($"{BaseUrl}/orders/tables/{tableId}/scan", null);
        if (!scanRes.IsSuccessStatusCode)
        {
            var error = await scanRes.Content.ReadAsStringAsync();
            throw new Exception($"Scan failed: {scanRes.StatusCode}. Body: {error}");
        }
        var scanData = await scanRes.Content.ReadFromJsonAsync<ScanResponse>();
        var tableSessionId = scanData!.SessionId;

        // ==========================================
        // ACT 2: Add to Cart
        // ==========================================
        _output.WriteLine("4. Fetching available foods...");
        var foodsRes = await _client.GetAsync($"{BaseUrl}/catalog/foods");
        foodsRes.EnsureSuccessStatusCode();
        var foodsData = await foodsRes.Content.ReadFromJsonAsync<FoodListResponse>();
        var foodId = foodsData?.Items?.FirstOrDefault()?.Id.ToString() ?? throw new Exception("No foods found.");
        var foodPrice = foodsData?.Items?.FirstOrDefault()?.Price ?? 0;

        _output.WriteLine($"4.1 Adding food {foodId} to cart...");
        var cartPayload = new
        {
            cart = new
            {
                cartOwnerId = tableSessionId,
                items = new[] { new { foodId = foodId, quantity = 2 } }
            }
        };
        var cartRes = await _client.PostAsJsonAsync($"{BaseUrl}/cart", cartPayload);
        cartRes.EnsureSuccessStatusCode();

        // ==========================================
        // ACT 3: Create Order
        // ==========================================
        _output.WriteLine("5. Creating order...");
        var orderPayload = new
        {
            tableSessionId = tableSessionId,
            paymentMethod = "Transfer",
            note = "E2E Workflow Test Order"
        };
        var orderRes = await _client.PostAsJsonAsync($"{BaseUrl}/orders", orderPayload);
        orderRes.EnsureSuccessStatusCode();
        var rawOrderStr = await orderRes.Content.ReadAsStringAsync();
        _output.WriteLine($"Raw Order Response: {rawOrderStr}");
        var orderData = await orderRes.Content.ReadFromJsonAsync<OrderResponse>();
        var orderId = orderData!.Id;
        
        // Calculate the final amount manually because the POST /orders only returns the new Order ID
        var finalAmount = foodPrice * 2;
        _output.WriteLine($"Calculated Final Amount: {finalAmount}");

        // ==========================================
        // ACT 4: Initialize Payment
        // ==========================================
        _output.WriteLine("6. Initializing payment...");
        var paymentPayload = new
        {
            orderId = orderId,
            amount = finalAmount,
            tableSessionId = tableSessionId,
            tableNumber = "TEST-TABLE",
            note = "E2E Payment Init"
        };
        var payRes = await _client.PostAsJsonAsync($"{BaseUrl}/payments", paymentPayload);
        payRes.EnsureSuccessStatusCode();

        // ==========================================
        // ACT 5: Simulate Webhook Payment Success
        // ==========================================
        _output.WriteLine("7. Sending simulated Sepay Webhook...");
        var webhookPayload = new
        {
            id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + new Random().Next(1000),
            gateway = "VietQR",
            transactionDate = DateTime.UtcNow.ToString("O"),
            accountNumber = "123456789",
            code = "00",
            content = $"SEVQR {orderId}",
            transferType = "in",
            transferAmount = finalAmount,
            accumulated = 100000,
            subAccount = "Sub1",
            referenceCode = orderId.ToString(),
            description = "Payment successful via E2E test"
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/payments/webhook/sepay");
        request.Content = JsonContent.Create(webhookPayload);
        request.Headers.Add("Authorization", SepayApiKey);

        var webhookRes = await _client.SendAsync(request);
        webhookRes.EnsureSuccessStatusCode();

        // ==========================================
        // ACT 5: Assert Loyalty Points
        // ==========================================
        _output.WriteLine("8. Polling for points update (up to 20s)...");
        int finalPoints = 0;
        for (int i = 0; i < 10; i++)
        {
            await Task.Delay(2000);
            var pointsRes = await _client.GetAsync($"{BaseUrl}/promotion/points");
            if (pointsRes.IsSuccessStatusCode)
            {
                var finalPointsData = await pointsRes.Content.ReadFromJsonAsync<LoyaltyPointResponse>();
                if (finalPointsData != null && finalPointsData.Balance > initialPoints)
                {
                    finalPoints = finalPointsData.Balance;
                    break;
                }
                else
                {
                    finalPoints = finalPointsData?.Balance ?? 0;
                }
            }
        }
        _output.WriteLine($"Final Points: {finalPoints}");

        // ASSERT
        // Based on PromotionService logic: 1 point per 10,000 VND
        int expectedEarnedPoints = (int)(finalAmount / 10000);
        finalPoints.Should().Be(initialPoints + expectedEarnedPoints, $"an order of {finalAmount} VND should yield {expectedEarnedPoints} points.");
    }

    // Helper Response Classes to deserialize JSON
    private class LoginResponse { public string Token { get; set; } = string.Empty; }
    private class LoyaltyPointResponse
    {
        public int Balance { get; set; }
    }
    private class ScanResponse { public string SessionId { get; set; } = string.Empty; }
    private class OrderResponse { public Guid Id { get; set; } public decimal FinalAmount { get; set; } }
    private class TableResponse { public Guid Id { get; set; } }
    private class FoodListResponse { public List<FoodResponse>? Items { get; set; } }
    private class FoodResponse { public Guid Id { get; set; } public decimal Price { get; set; } }
}
