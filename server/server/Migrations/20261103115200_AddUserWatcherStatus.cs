using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    public partial class AddUserWatcherStatus : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "UserWatchers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post",
                column: "RepostOfPostId",
                principalTable: "Post",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "UserWatchers");

            migrationBuilder.AddForeignKey(
                name: "FK_Post_Post_RepostOfPostId",
                table: "Post",
                column: "RepostOfPostId",
                principalTable: "Post",
                principalColumn: "Id");
        }
    }
}
