using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Polyclinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalReferralToAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalReferralUrl",
                table: "Appointments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalReferralUrl",
                table: "Appointments");
        }
    }
}
