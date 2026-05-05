using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTableIdIndexToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TableSessions_CreatedAt",
                table: "TableSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantTables_CreatedAt",
                table: "RestaurantTables",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TableSessions_CreatedAt",
                table: "TableSessions");

            migrationBuilder.DropIndex(
                name: "IX_RestaurantTables_CreatedAt",
                table: "RestaurantTables");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders");
        }
    }
}
