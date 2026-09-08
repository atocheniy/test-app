using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddReposts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RepostOfPostId",
                table: "Post",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RepostsCount",
                table: "Post",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Post_RepostOfPostId",
                table: "Post",
                column: "RepostOfPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post",
                column: "RepostOfPostId",
                principalTable: "Post",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post");

            migrationBuilder.DropIndex(
                name: "IX_Post_RepostOfPostId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "RepostOfPostId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "RepostsCount",
                table: "Post");
        }
    }
}
