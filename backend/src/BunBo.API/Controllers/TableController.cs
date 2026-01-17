using BunBo.Application.DTOs.Table;
using BunBo.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BunBo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TableController : ControllerBase
    {
        private readonly ITableService _tableService;

        public TableController(ITableService tableService)
        {
            _tableService = tableService;
        }

        [HttpGet("verify/{code}")]
        public async Task<ActionResult<TableResponseDto>> VerifyTable(string code)
        {
            try
            {
                var table = await _tableService.VerifyTableAsync(code);
                return Ok(new TableResponseDto
                {
                    Id = table.Id,
                    TableCode = table.TableCode,
                    Name = table.Name,
                    BranchName = table.Branch?.Name ?? "Unknown Branch"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("session")]
        public async Task<ActionResult<TableSessionResponseDto>> OpenSession([FromBody] StartSessionRequestDto request)
        {
            try
            {
                var session = await _tableService.OpenSessionAsync(request.TableId);
                return Ok(new TableSessionResponseDto
                {
                    Id = session.Id,
                    TableId = session.TableId,
                    StartTime = session.StartTime,
                    IsClosed = session.IsClosed
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpGet("session/{id}")]
        public async Task<ActionResult<TableSessionResponseDto>> GetSession(Guid id)
        {
            var session = await _tableService.GetSessionByIdAsync(id);
            if (session == null) return NotFound();
            
            return Ok(new TableSessionResponseDto
            {
                Id = session.Id,
                TableId = session.TableId,
                StartTime = session.StartTime,
                IsClosed = session.IsClosed
            });
        }
    }
}
