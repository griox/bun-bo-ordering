using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromotionService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandVoucherSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Conditions",
                table: "Vouchers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PointCost",
                table: "Vouchers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Vouchers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Conditions",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "PointCost",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Vouchers");
        }
    }
}
