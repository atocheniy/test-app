
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Data;
using server.Models;
using server.Hubs;

namespace server
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			
			//============ Connections ============//

			var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
			builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
			
			builder.Services.AddSignalR();
			
			builder.Services.AddCors(options =>
			{
				options.AddPolicy("AllowReactApp", policy =>
				{
					policy.WithOrigins("http://localhost:3000", "https://test-app-xi-murex.vercel.app" )
						.AllowAnyMethod()
						.AllowAnyHeader()
						.AllowCredentials();
				});
			});
			
			// Identity
			builder.Services.AddIdentity<ApplicationUser, IdentityRole>(
					option =>
					{
						option.Password.RequireDigit = false;
						option.Password.RequireNonAlphanumeric = false;
						option.Password.RequireUppercase = false;
						option.Password.RequireLowercase = false;

						option.Password.RequiredLength = 1;
						option.Password.RequiredUniqueChars = 0;
					}
				).AddEntityFrameworkStores<ApplicationDbContext>()
				.AddDefaultTokenProviders();

			// JWT
			builder.Services.AddAuthentication(option => {
				option.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				option.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
				option.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
			}).AddJwtBearer(options => {
				options.SaveToken = true;
				options.RequireHttpsMetadata = true;
				options.TokenValidationParameters = new TokenValidationParameters()
				{
					ValidateIssuer = true,
					ValidateAudience = true,
					ValidAudience = builder.Configuration["Jwt:Site"],
					ValidIssuer = builder.Configuration["Jwt:Site"],
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SigningKey"]))
				};  
			});
			
			builder.Services.AddControllers()
				.AddJsonOptions(options =>
				{
					options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
				});
			// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddOpenApi();
			
			builder.WebHost.ConfigureKestrel(options =>
			{
				options.Limits.MaxRequestBodySize = 100 * 1024 * 1024;
			});
            
			builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
			{
				x.ValueLengthLimit = int.MaxValue;
				x.MultipartBodyLengthLimit = int.MaxValue;
			});

			var app = builder.Build();

			// Configure the HTTP request pipeline.
			if (app.Environment.IsDevelopment())
			{
				app.MapOpenApi();
			}

			// app.UseHttpsRedirection();
			app.UseRouting();

			app.UseCors("AllowReactApp");
			
			app.UseAuthentication();
			app.UseAuthorization();

			app.UseDefaultFiles();
			app.UseStaticFiles();
			app.MapHub<SiteHub>("/hub");
			
			app.MapControllers();
			app.MapGet("/", () => "API is running");
			
			app.Run();
		}
	}
}
