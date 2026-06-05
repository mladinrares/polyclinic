using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceIdToTimeSlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ServiceId",
                table: "TimeSlots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_ServiceId",
                table: "TimeSlots",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots",
                column: "ServiceId",
                principalTable: "MedicalServices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_ServiceId",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "TimeSlots");
        }
    }
}
