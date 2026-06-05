using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInsuranceCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InsuranceCards_CardNumber",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "InsurerCode",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "InsurerName",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "ValidFrom",
                table: "InsuranceCards");

            migrationBuilder.RenameColumn(
                name: "ValidUntil",
                table: "InsuranceCards",
                newName: "ExpiryDate");

            migrationBuilder.RenameColumn(
                name: "CardNumber",
                table: "InsuranceCards",
                newName: "LastName");

            migrationBuilder.AddColumn<string>(
                name: "DocumentNumber",
                table: "InsuranceCards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "InsuranceCards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InsuredCode",
                table: "InsuranceCards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceCards_DocumentNumber",
                table: "InsuranceCards",
                column: "DocumentNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InsuranceCards_DocumentNumber",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "DocumentNumber",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "InsuranceCards");

            migrationBuilder.DropColumn(
                name: "InsuredCode",
                table: "InsuranceCards");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "InsuranceCards",
                newName: "CardNumber");

            migrationBuilder.RenameColumn(
                name: "ExpiryDate",
                table: "InsuranceCards",
                newName: "ValidUntil");

            migrationBuilder.AddColumn<string>(
                name: "InsurerCode",
                table: "InsuranceCards",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InsurerName",
                table: "InsuranceCards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "ValidFrom",
                table: "InsuranceCards",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateIndex(
                name: "IX_InsuranceCards_CardNumber",
                table: "InsuranceCards",
                column: "CardNumber",
                unique: true);
        }
    }
}
