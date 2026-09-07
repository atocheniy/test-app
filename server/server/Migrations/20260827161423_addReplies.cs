using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class addReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReplyToId",
                table: "Message",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Message_ReplyToId",
                table: "Message",
                column: "ReplyToId");

            migrationBuilder.AddForeignKey(
                name: "FK_Message_Message_ReplyToId",
                table: "Message",
                column: "ReplyToId",
                principalTable: "Message",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Message_Message_ReplyToId",
                table: "Message");

            migrationBuilder.DropIndex(
                name: "IX_Message_ReplyToId",
                table: "Message");

            migrationBuilder.DropColumn(
                name: "ReplyToId",
                table: "Message");
        }
    }
}
