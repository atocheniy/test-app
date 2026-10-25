using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectMiniProfileAndDevlog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "UserProjects",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerUrl",
                table: "UserProjects",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PostsCount",
                table: "UserProjects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StarsCount",
                table: "UserProjects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "UserProjects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "Post",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowInGeneralFeed",
                table: "Post",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ProjectStars",
                columns: table => new
                {
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectStars", x => new { x.ProjectId, x.UserId });
                    table.ForeignKey(
                        name: "FK_ProjectStars_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectStars_UserProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "UserProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Post_ProjectId",
                table: "Post",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectStars_UserId",
                table: "ProjectStars",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Post_UserProjects_ProjectId",
                table: "Post",
                column: "ProjectId",
                principalTable: "UserProjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Post_UserProjects_ProjectId",
                table: "Post");

            migrationBuilder.DropTable(
                name: "ProjectStars");

            migrationBuilder.DropIndex(
                name: "IX_Post_ProjectId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "BannerUrl",
                table: "UserProjects");

            migrationBuilder.DropColumn(
                name: "PostsCount",
                table: "UserProjects");

            migrationBuilder.DropColumn(
                name: "StarsCount",
                table: "UserProjects");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "UserProjects");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "ShowInGeneralFeed",
                table: "Post");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "UserProjects",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);
        }
    }
}
