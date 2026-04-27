namespace CartService.Domain.Entities;

public class CartItem
{
    public Guid FoodId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
    // In a real scenario we'll update this from CatalogService via gRPC
    public decimal TotalPrice => UnitPrice * Quantity;
}

public class ShoppingCart
{
    public string CartOwnerId { get; set; } = string.Empty;
    public List<CartItem> Items { get; set; } = new List<CartItem>();

    public ShoppingCart(string cartOwnerId)
    {
        CartOwnerId = cartOwnerId;
    }
}
