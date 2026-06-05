using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWaitingListSlotFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "NotifiedSlotDate",
                table: "WaitingList",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "NotifiedSlotTime",
                table: "WaitingList",
                type: "time without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotifiedSlotDate",
                table: "WaitingList");

            migrationBuilder.DropColumn(
                name: "NotifiedSlotTime",
                table: "WaitingList");
        }
    }
}
