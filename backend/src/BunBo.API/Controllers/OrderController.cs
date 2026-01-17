using BunBo.Application.DTOs.Order;
using BunBo.Application.Interfaces;
using BunBo.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace BunBo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderRequestDto request)
        {
            try
            {
                // Map DTO to Domain Entities
                var items = request.Items.Select(x => new OrderItem
                {
                    FoodId = x.FoodId,
                    Quantity = x.Quantity,
                    Note = x.Note
                }).ToList();

                var order = await _orderService.CreateOrderAsync(request.TableSessionId, items);

                return Ok(new OrderResponseDto
                {
                    Id = order.Id,
                    TableSessionId = order.TableSessionId,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    CreatedAt = order.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(Guid id)
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null) return NotFound();

            return Ok(new OrderResponseDto
            {
                Id = order.Id,
                TableSessionId = order.TableSessionId,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt
            });
        }
    }
}
