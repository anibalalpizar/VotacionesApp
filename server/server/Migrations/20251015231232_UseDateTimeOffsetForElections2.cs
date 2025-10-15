using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class UseDateTimeOffsetForElections2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "StartDate",
                table: "Elections",
                type: "datetimeoffset(0)",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(7)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "EndDate",
                table: "Elections",
                type: "datetimeoffset(0)",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(7)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "StartDate",
                table: "Elections",
                type: "datetimeoffset(7)",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(0)");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "EndDate",
                table: "Elections",
                type: "datetimeoffset(7)",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset(0)");
        }
    }
}
