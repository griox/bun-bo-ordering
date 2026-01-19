using BunBo.Infrastructure.Data;
using BunBo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BunBo.API.Middleware;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BunBo.Application.Interfaces.IUnitOfWork, BunBo.Infrastructure.Data.UnitOfWork>();
builder.Services.AddScoped<BunBo.Application.Interfaces.ITableService, BunBo.Application.Services.TableService>();
builder.Services.AddScoped<BunBo.Application.Interfaces.IOrderService, BunBo.Application.Services.OrderService>();

builder.Services.AddValidatorsFromAssemblyContaining<BunBo.Application.DTOs.Order.CreateOrderRequestDtoValidator>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
