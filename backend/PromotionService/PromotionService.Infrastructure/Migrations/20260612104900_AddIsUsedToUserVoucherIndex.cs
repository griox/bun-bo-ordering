using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromotionService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsUsedToUserVoucherIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserVouchers_UserId_VoucherId",
                table: "UserVouchers");

            migrationBuilder.CreateIndex(
                name: "IX_UserVouchers_UserId_VoucherId_IsUsed",
                table: "UserVouchers",
                columns: new[] { "UserId", "VoucherId", "IsUsed" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserVouchers_UserId_VoucherId_IsUsed",
                table: "UserVouchers");

            migrationBuilder.CreateIndex(
                name: "IX_UserVouchers_UserId_VoucherId",
                table: "UserVouchers",
                columns: new[] { "UserId", "VoucherId" });
        }
    }
}
