using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsReadCreatedAtCompositeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Orders_IsRead_CreatedAt",
                table: "Orders",
                columns: new[] { "IsRead", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_IsRead_CreatedAt",
                table: "Orders");
        }
    }
}
