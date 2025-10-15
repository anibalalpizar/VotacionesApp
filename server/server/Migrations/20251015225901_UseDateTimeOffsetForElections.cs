using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class UseDateTimeOffsetForElections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Elections_Name",
                table: "Elections");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Elections_Dates",
                table: "Elections");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "StartDate",
                table: "Elections",
                type: "datetimeoffset(7)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "EndDate",
                table: "Elections",
                type: "datetimeoffset(7)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "Elections",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(7)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "Elections",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(7)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Elections_Name",
                table: "Elections",
                column: "Name",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Elections_Dates",
                table: "Elections",
                sql: "[StartDate] IS NULL OR [EndDate] IS NULL OR [StartDate] <= [EndDate]");
        }
    }
}
