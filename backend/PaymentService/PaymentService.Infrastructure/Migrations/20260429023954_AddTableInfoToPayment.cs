using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTableInfoToPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TableNumber",
                table: "PaymentTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TableSessionId",
                table: "PaymentTransactions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "TableSessionId",
                table: "PaymentTransactions");
        }
    }
}
