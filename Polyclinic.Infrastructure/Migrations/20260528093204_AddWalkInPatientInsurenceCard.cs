using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWalkInPatientInsurenceCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "InsuranceCards",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "WalkInPatientId",
                table: "InsuranceCards",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceCards_WalkInPatientId",
                table: "InsuranceCards",
                column: "WalkInPatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_InsuranceCards_WalkInPatients_WalkInPatientId",
                table: "InsuranceCards",
                column: "WalkInPatientId",
                principalTable: "WalkInPatients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InsuranceCards_WalkInPatients_WalkInPatientId",
                table: "InsuranceCards");

            migrationBuilder.DropIndex(
                name: "IX_InsuranceCards_WalkInPatientId",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "WalkInPatientId",
                table: "InsuranceCards");

            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "InsuranceCards",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
