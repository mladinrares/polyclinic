using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeReferralServiceRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots");

            migrationBuilder.AlterColumn<Guid>(
                name: "ReferredServiceId",
                table: "Referrals",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots",
                column: "ServiceId",
                principalTable: "MedicalServices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots");

            migrationBuilder.AlterColumn<Guid>(
                name: "ReferredServiceId",
                table: "Referrals",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_MedicalServices_ServiceId",
                table: "TimeSlots",
                column: "ServiceId",
                principalTable: "MedicalServices",
                principalColumn: "Id");
        }
    }
}
