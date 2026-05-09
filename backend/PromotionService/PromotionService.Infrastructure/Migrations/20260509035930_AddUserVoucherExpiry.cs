using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromotionService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserVoucherExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "UserVouchers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "UserVouchers");
        }
    }
}
