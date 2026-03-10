namespace OrderService.Application.Dtos;

public class CartItemDto
{
    public Guid FoodId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public class CartDto
{
    public string CartOwnerId { get; set; } = string.Empty;
    public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
}
