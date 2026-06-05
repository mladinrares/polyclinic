using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWalkInPatient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "Appointments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "CancelledByRole",
                table: "Appointments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WalkInPatientId",
                table: "Appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WalkInPatients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CNP = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    County = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalkInPatients", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WalkInPatientId",
                table: "Appointments",
                column: "WalkInPatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_WalkInPatients_WalkInPatientId",
                table: "Appointments",
                column: "WalkInPatientId",
                principalTable: "WalkInPatients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_WalkInPatients_WalkInPatientId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "WalkInPatients");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_WalkInPatientId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "CancelledByRole",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "WalkInPatientId",
                table: "Appointments");

            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "Appointments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
