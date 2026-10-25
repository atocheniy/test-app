using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services, bool wipeFirst = true)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        Console.WriteLine("[DatabaseSeeder] Starting database seeding process...");

        if (wipeFirst)
        {
            Console.WriteLine("[DatabaseSeeder] Wiping existing data...");
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    TRUNCATE TABLE 
                        ""PostLikes"", ""ProjectStars"", ""Comment"", ""Post"", ""Vacancies"",
                        ""UserProjects"", ""UserExperiences"", ""CommunityWatchers"", ""CommunityMembers"", 
                        ""Communities"", ""UserWatchers"", ""Message"", ""ChatParticipant"", ""Chat"",
                        ""AspNetUserClaims"", ""AspNetUserLogins"", ""AspNetUserRoles"", ""AspNetUserTokens"", ""AspNetUsers""
                    CASCADE;
                ");
                Console.WriteLine("[DatabaseSeeder] Tables truncated successfully via CASCADE.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseSeeder] Truncate error, falling back to EF cleanup: {ex.Message}");
                context.PostLikes.RemoveRange(context.PostLikes);
                context.ProjectStars.RemoveRange(context.ProjectStars);
                context.Comment.RemoveRange(context.Comment);
                context.Post.RemoveRange(context.Post);
                context.Vacancies.RemoveRange(context.Vacancies);
                context.UserProjects.RemoveRange(context.UserProjects);
                context.UserExperiences.RemoveRange(context.UserExperiences);
                context.CommunityWatchers.RemoveRange(context.CommunityWatchers);
                context.CommunityMembers.RemoveRange(context.CommunityMembers);
                context.Communities.RemoveRange(context.Communities);
                context.UserWatchers.RemoveRange(context.UserWatchers);
                context.Message.RemoveRange(context.Message);
                context.ChatParticipant.RemoveRange(context.ChatParticipant);
                context.Chat.RemoveRange(context.Chat);
                await context.SaveChangesAsync();

                var existingUsers = await userManager.Users.ToListAsync();
                foreach (var u in existingUsers)
                {
                    await userManager.DeleteAsync(u);
                }
            }
        }

        const string DEFAULT_PASSWORD = "password";
        
        Console.WriteLine("[DatabaseSeeder] Creating users...");

        var usersData = new List<(string Username, string Email, string FullName, string Focus, string BioFirst, string BioSecond, string Location, string WorkStatus, string[] Techs, string Avatar, string Banner)>
        {
            (
                "test",
                "test@test.com",
                "Андрей",
                "Fullstack Engineer & Software Architect",
                "Создатель Compile. Разрабатываю распределённые системы и высокопроизводительные веб-приложения.",
                "C#, .NET 9, Next.js, PostgreSQL, архитектура микросервисов и UI/UX дизайн.",
                "Москва / Удалённо",
                "Открыт к предложениям",
                new[] { "C#", ".NET", "TypeScript", "Next.js", "React", "PostgreSQL", "Docker", "Tailwind CSS", "SignalR" },
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "petr_petrov",
                "petr@compileapp.ru",
                "Петр Петров",
                "Staff Frontend Architect",
                "Превращаю сложные интерфейсы в быстрые и отзывчивые веб-приложения.",
                "Автор серии статей по React Server Components, WebGL и микрофронтендам.",
                "Санкт-Петербург",
                "Работаю в Flow Digital",
                new[] { "React", "Next.js", "TypeScript", "Tailwind CSS", "WebGL", "Vite", "GraphQL" },
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "alexey_alexeev",
                "alexey@compileapp.ru",
                "Алексей Алексеев",
                "Principal .NET & Cloud Engineer",
                "Highload, распределенные транзакции, Event Sourcing и Outbox в облаках.",
                "Спикер технических конференций DotNext и организатор .NET Ru комьюнити.",
                "Москва",
                "Работаю в CyberSystems",
                new[] { "C#", ".NET", "ASP.NET Core", "Kafka", "PostgreSQL", "Docker", "Kubernetes", "Redis" },
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "anna_andreeva",
                "anna@compileapp.ru",
                "Анна Андреева",
                "AI Researcher & LLM Engineer",
                "Исследую мультимодальные модели, RAG-архитектуры и квантование нейросетей.",
                "Разрабатываю open-source решения для локального инференса открытых LLM.",
                "Новосибирск",
                "AI Lead в Nexus AI Labs",
                new[] { "Python", "PyTorch", "LangChain", "FastAPI", "Transformers", "CUDA", "VectorDB" },
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "sergey_sergeev",
                "sergey@compileapp.ru",
                "Сергей Сергеев",
                "Senior SRE / DevOps Lead",
                "Автоматизирую всё, что не приколочено. Инфраструктура как код и 99.99% uptime.",
                "Kubernetes, GitOps (ArgoCD), Prometheus, Grafana и безопасность облаков.",
                "Екатеринбург",
                "Открыт к предложениям",
                new[] { "Go", "Kubernetes", "Docker", "Terraform", "Ansible", "CI/CD", "Linux", "Prometheus" },
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "dmitry_dmitriev",
                "dmitry@compileapp.ru",
                "Дмитрий Дмитриев",
                "Mobile Lead Engineer (Flutter & iOS)",
                "Создаю кроссплатформенные мобильные приложения с 60+ млн скачиваний.",
                "Уделяю особое внимание плавности анимаций, кэшированию и offline-first архитектуре.",
                "Казань / Удалённо",
                "Ищу менторские проекты",
                new[] { "Flutter", "Dart", "Swift", "React Native", "TypeScript", "iOS", "Android" },
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "elena_vasilieva",
                "elena@compileapp.ru",
                "Елена Васильева",
                "Lead Design Systems Engineer",
                "Мост между продуктовым дизайном в Figma и чистым фронтенд-кодом.",
                "Создатель дизайн-систем с поддержкой токенов, WCAG AAA доступности и тёмной темы.",
                "Нижний Новгород / Удалённо",
                "Работаю в Flow Digital",
                new[] { "Figma", "UI/UX", "CSS", "Tailwind CSS", "React", "Design Tokens", "TypeScript" },
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80"
            ),
            (
                "mikhail_mikhailov",
                "mikhail@compileapp.ru",
                "Михаил Михайлов",
                "AppSec & Systems Engineer",
                "Безопасность веб-приложений, аудит смарт-контрактов и системное программирование на Rust.",
                "Bug bounty хантер, автор чеклистов по защите API и микросервисов.",
                "Минск",
                "Security Consultant",
                new[] { "Rust", "C++", "Linux", "AppSec", "OAuth2", "Cryptography", "Python" },
                "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80"
            )
        };

        var userMap = new Dictionary<string, ApplicationUser>();

        foreach (var data in usersData)
        {
            var user = new ApplicationUser
            {
                UserName = data.Username,
                Email = data.Email,
                FullName = data.FullName,
                Focus = data.Focus,
                Bio_FirstLine = data.BioFirst,
                Bio_SecondLine = data.BioSecond,
                Location = data.Location,
                WorkStatus = data.WorkStatus,
                Technologies = data.Techs,
                Avatar = data.Avatar,
                Banner = data.Banner,
                GithubUrl = $"https://github.com/{data.Username}",
                TelegramUrl = $"https://t.me/{data.Username}",
                WebsiteUrl = $"https://{data.Username}.dev",
                Followers = 0,
                Followings = 0,
                ConnectedAt = DateTime.UtcNow,
                IsActive = true,
                Room = "general",
                PreferredLanguage = "ru"
            };

            var createResult = await userManager.CreateAsync(user, DEFAULT_PASSWORD);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                throw new Exception($"Failed to create user {data.Username}: {errors}");
            }

            userMap[data.Username] = user;
        }

        var mainUser = userMap["test"];
        
        Console.WriteLine("[DatabaseSeeder] Creating work experiences...");

        var experiences = new List<UserExperience>
        {
            new UserExperience
            {
                UserId = mainUser.Id,
                CompanyName = "Compile Platform",
                Position = "Lead Architect & Founder",
                Mode = "Full-time",
                Period = "2024 — Настоящее время",
                Description = "Проектирование и разработка платформы для разработчиков. Стек Next.js 15, ASP.NET Core, PostgreSQL, SignalR."
            },
            new UserExperience
            {
                UserId = mainUser.Id,
                CompanyName = "CyberSystems Technologies",
                Position = "Senior Fullstack Engineer",
                Mode = "Full-time / Remote",
                Period = "2022 — 2024",
                Description = "Разработка распределенного ядра платежного шлюза, микросервисы на .NET Core, интеграции с внешними API."
            },
            new UserExperience
            {
                UserId = mainUser.Id,
                CompanyName = "Digital Dynamics Lab",
                Position = "Frontend Developer",
                Mode = "Full-time",
                Period = "2020 — 2022",
                Description = "Разработка дашбордов и дизайн-системы на React, Redux Toolkit и TypeScript."
            },
            new UserExperience
            {
                UserId = userMap["alexey_alexeev"].Id,
                CompanyName = "CyberSystems Technologies",
                Position = "Principal .NET Architect",
                Mode = "Full-time",
                Period = "2021 — Настоящее время",
                Description = "Архитектурное руководство командой платформенной инфраструктуры, внедрение Event Sourcing и Kafka."
            },
            new UserExperience
            {
                UserId = userMap["petr_petrov"].Id,
                CompanyName = "Flow Digital Studio",
                Position = "Staff Frontend Architect",
                Mode = "Remote",
                Period = "2022 — Настоящее время",
                Description = "Руководство фронтенд-гильдией, внедрение Next.js App Router, оптимизация Core Web Vitals до 99+."
            }
        };

        context.UserExperiences.AddRange(experiences);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating social follow relationships...");

        var watchersList = new List<UserWatcher>();

        void AddFollow(string watcherUsername, string targetUsername)
        {
            if (userMap.TryGetValue(watcherUsername, out var w) && userMap.TryGetValue(targetUsername, out var t))
            {
                watchersList.Add(new UserWatcher
                {
                    WatcherId = w.Id,
                    TargetUserId = t.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                });
                w.Followings = (w.Followings ?? 0) + 1;
                t.Followers = (t.Followers ?? 0) + 1;
            }
        }
        
        AddFollow("test", "petr_petrov");
        AddFollow("test", "alexey_alexeev");
        AddFollow("test", "anna_andreeva");
        AddFollow("test", "sergey_sergeev");
        AddFollow("test", "elena_vasilieva");
        
        AddFollow("petr_petrov", "test");
        AddFollow("alexey_alexeev", "test");
        AddFollow("anna_andreeva", "test");
        AddFollow("sergey_sergeev", "test");
        AddFollow("dmitry_dmitriev", "test");
        AddFollow("elena_vasilieva", "test");
        AddFollow("mikhail_mikhailov", "test");
        
        AddFollow("petr_petrov", "elena_vasilieva");
        AddFollow("elena_vasilieva", "petr_petrov");
        AddFollow("alexey_alexeev", "sergey_sergeev");
        AddFollow("sergey_sergeev", "alexey_alexeev");
        AddFollow("anna_andreeva", "alexey_alexeev");
        AddFollow("mikhail_mikhailov", "alexey_alexeev");
        AddFollow("dmitry_dmitriev", "petr_petrov");

        context.UserWatchers.AddRange(watchersList);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating communities and companies...");

        var communities = new List<Community>
        {
            new Community
            {
                Id = Guid.NewGuid(),
                Name = ".NET & C# Developers",
                Slug = "dotnet-ru",
                Description = "Главное сообщество разработчиков на .NET, ASP.NET Core и C#. Обсуждаем архитектуру, высоконагруженные системы, производительность и новые релизы платформы.",
                Rules = "1. Уважайте участников.\n2. Форматируйте код в markdown.\n3. Конструктивная критика приветствуется.",
                Kind = CommunityKind.Community,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.MembersOnly,
                Industry = "Backend & Cloud",
                Avatar = "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["alexey_alexeev"].Id,
                MembersCount = 428,
                PostsCount = 0,
                WatchersCount = 312,
                Created = DateTime.UtcNow.AddMonths(-3)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "Frontend Architecture",
                Slug = "frontend-hub",
                Description = "Сообщество для обсуждения современного фронтенда: React 19, Next.js, TypeScript, Server Actions, микрофронтенды, CSS трюки и производительность интерфейсов.",
                Rules = "Делитесь реальным опытом, бенчмарками и полезными сниппетами.",
                Kind = CommunityKind.Community,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.MembersOnly,
                Industry = "Frontend & UI",
                Avatar = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["petr_petrov"].Id,
                MembersCount = 684,
                PostsCount = 0,
                WatchersCount = 520,
                Created = DateTime.UtcNow.AddMonths(-4)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "AI & Machine Learning Hub",
                Slug = "ai-engineering",
                Description = "Практическое применение LLM, нейросетей, RAG-архитектур, оптимизация инференса моделей и работа с GPU кластерами.",
                Kind = CommunityKind.Community,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.MembersOnly,
                Industry = "Artificial Intelligence",
                Avatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["anna_andreeva"].Id,
                MembersCount = 356,
                PostsCount = 0,
                WatchersCount = 280,
                Created = DateTime.UtcNow.AddMonths(-2)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "DevOps & Cloud Systems",
                Slug = "devops-cloud",
                Description = "Kubernetes, GitOps, CI/CD пайплайны, мониторинг, отказоустойчивость и облачная инфраструктура.",
                Kind = CommunityKind.Community,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.MembersOnly,
                Industry = "DevOps & SRE",
                Avatar = "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["sergey_sergeev"].Id,
                MembersCount = 295,
                PostsCount = 0,
                WatchersCount = 210,
                Created = DateTime.UtcNow.AddMonths(-2)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "CyberSystems Technologies",
                Slug = "cybersystems",
                Description = "Разрабатываем высоконадежные распределенные финтех-платформы, процессинг платежей и облачные сервисы корпоративного уровня.",
                Kind = CommunityKind.Company,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.AdminsAndModerators,
                Industry = "FinTech & Cloud",
                CompanySize = "100-250",
                IsVerified = true,
                WebsiteUrl = "https://cybersystems.tech",
                Location = "Москва / Кипр",
                Avatar = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["alexey_alexeev"].Id,
                MembersCount = 142,
                PostsCount = 0,
                WatchersCount = 890,
                Created = DateTime.UtcNow.AddMonths(-5)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "Flow Digital Studio",
                Slug = "flow-digital",
                Description = "Создаем премиальные веб-продукты, сложные дизайн-системы и масштабируемые SaaS-сервисы.",
                Kind = CommunityKind.Company,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.AdminsAndModerators,
                Industry = "Software Development",
                CompanySize = "20-50",
                IsVerified = true,
                WebsiteUrl = "https://flowdigital.studio",
                Location = "Санкт-Петербург / Удалённо",
                Avatar = "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["petr_petrov"].Id,
                MembersCount = 58,
                PostsCount = 0,
                WatchersCount = 430,
                Created = DateTime.UtcNow.AddMonths(-4)
            },
            new Community
            {
                Id = Guid.NewGuid(),
                Name = "Nexus AI Labs",
                Slug = "nexus-ai",
                Description = "Исследования и разработка в области прикладного искусственного интеллекта и автономных агентных систем.",
                Kind = CommunityKind.Company,
                Type = CommunityType.Public,
                PostingPolicy = CommunityPostingPolicy.AdminsAndModerators,
                Industry = "Artificial Intelligence",
                CompanySize = "50-100",
                IsVerified = true,
                WebsiteUrl = "https://nexus-ai.dev",
                Location = "Новосибирск / Удалённо",
                Avatar = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300&q=80",
                Banner = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
                CreatorId = userMap["anna_andreeva"].Id,
                MembersCount = 84,
                PostsCount = 0,
                WatchersCount = 610,
                Created = DateTime.UtcNow.AddMonths(-3)
            }
        };

        context.Communities.AddRange(communities);
        await context.SaveChangesAsync();

        var commMap = communities.ToDictionary(c => c.Slug, c => c);
        
        var commMembers = new List<CommunityMember>();
        var commWatchers = new List<CommunityWatcher>();

        foreach (var c in communities)
        {
            commMembers.Add(new CommunityMember
            {
                CommunityId = c.Id,
                UserId = c.CreatorId,
                Role = CommunityRole.Owner,
                Status = MemberStatus.Active,
                JoinedAt = c.Created
            });
            
            if (c.CreatorId != mainUser.Id)
            {
                commMembers.Add(new CommunityMember
                {
                    CommunityId = c.Id,
                    UserId = mainUser.Id,
                    Role = CommunityRole.Member,
                    Status = MemberStatus.Active,
                    JoinedAt = DateTime.UtcNow.AddDays(-15)
                });

                commWatchers.Add(new CommunityWatcher
                {
                    CommunityId = c.Id,
                    UserId = mainUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-15)
                });
            }
        }

        context.CommunityMembers.AddRange(commMembers);
        context.CommunityWatchers.AddRange(commWatchers);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating realistic developer vacancies...");

        var cyberCo = commMap["cybersystems"];
        var flowCo = commMap["flow-digital"];
        var nexusCo = commMap["nexus-ai"];

        var vacancies = new List<Vacancy>
        {
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = cyberCo.Id,
                Title = "Senior .NET / Cloud Architect",
                Description = "Ищем опытного архитектора для проектирования и оптимизации высоконагруженного процессинга платежей. Стек: .NET 9, C#, Kafka, PostgreSQL, ClickHouse, Docker, Kubernetes.\n\nЗадачи:\n- Развитие отказоустойчивой Event-Driven микросервисной архитектуры.\n- Оптимизация задержек (low latency) и пропускной способности ядра.\n- Проведение архитектурных ревью и менторинг команды.",
                SalaryFrom = 4500,
                SalaryTo = 6500,
                Currency = "USD",
                Format = WorkFormat.Remote,
                Level = SeniorityLevel.Senior,
                Stack = new[] { "C#", ".NET 9", "ASP.NET Core", "Kafka", "PostgreSQL", "Docker", "Kubernetes", "Redis" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["alexey_alexeev"].Id,
                Created = DateTime.UtcNow.AddDays(-3)
            },
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = flowCo.Id,
                Title = "Lead Frontend Engineer (Next.js & TypeScript)",
                Description = "Ищем фронтенд-лида для развития флагманской веб-платформы. Стек: Next.js App Router, React 19, TypeScript, Tailwind CSS, TanStack Query.\n\nЗадачи:\n- Развитие модульной дизайн-системы и библиотеки компонентов.\n- Оптимизация Web Vitals, SSR и Server Components.\n- Найм и техническое руководство фронтенд-инженерами.",
                SalaryFrom = 4000,
                SalaryTo = 5500,
                Currency = "USD",
                Format = WorkFormat.Remote,
                Level = SeniorityLevel.Lead,
                Stack = new[] { "TypeScript", "Next.js", "React", "Tailwind CSS", "Figma", "Zustand" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["petr_petrov"].Id,
                Created = DateTime.UtcNow.AddDays(-5)
            },
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = nexusCo.Id,
                Title = "ML Research Engineer (LLM & RAG Systems)",
                Description = "В исследовательскую лабораторию требуется инженер для работы с открытыми языковыми моделями, дообучения (LoRA) и создания гибридных векторных поисковых систем.\n\nЗадачи:\n- Оптимизация инференса моделей (AWQ, vLLM, TensorRT-LLM).\n- Разработка масштабируемого RAG-пайплайна для корпоративных баз знаний.",
                SalaryFrom = 5000,
                SalaryTo = 7500,
                Currency = "USD",
                Format = WorkFormat.Remote,
                Level = SeniorityLevel.Senior,
                Stack = new[] { "Python", "PyTorch", "LangChain", "FastAPI", "Transformers", "CUDA", "VectorDB" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["anna_andreeva"].Id,
                Created = DateTime.UtcNow.AddDays(-2)
            },
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = cyberCo.Id,
                Title = "DevOps / SRE Platform Engineer",
                Description = "Ищем SRE инженера для построения надежной отказоустойчивой инфраструктуры в Kubernetes.\n\nСтек: Go, Kubernetes, Helm, Terraform, ArgoCD, Prometheus, Grafana, VictoriaMetrics.",
                SalaryFrom = 3800,
                SalaryTo = 5200,
                Currency = "USD",
                Format = WorkFormat.Remote,
                Level = SeniorityLevel.Senior,
                Stack = new[] { "Kubernetes", "Docker", "Terraform", "Go", "CI/CD", "Linux", "Prometheus" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["alexey_alexeev"].Id,
                Created = DateTime.UtcNow.AddDays(-7)
            },
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = flowCo.Id,
                Title = "Middle+ Fullstack Developer (React & C#)",
                Description = "Разработка внутренних инструментов и клиентских веб-кабинетов. Идеальный баланс бэкенда на ASP.NET Core и современного фронтенда на React/TypeScript.",
                SalaryFrom = 2500,
                SalaryTo = 3800,
                Currency = "USD",
                Format = WorkFormat.Remote,
                Level = SeniorityLevel.Middle,
                Stack = new[] { "C#", ".NET", "React", "TypeScript", "PostgreSQL", "Docker" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["petr_petrov"].Id,
                Created = DateTime.UtcNow.AddDays(-4)
            },
            new Vacancy
            {
                Id = Guid.NewGuid(),
                CompanyId = flowCo.Id,
                Title = "Mobile Lead Developer (Flutter & iOS)",
                Description = "Разработка кроссплатформенного клиента экосистемы. Фокус на 60fps анимациях, оффлайн-кэшировании и интеграции с native SDK.",
                SalaryFrom = 3500,
                SalaryTo = 5000,
                Currency = "USD",
                Format = WorkFormat.Hybrid,
                Level = SeniorityLevel.Lead,
                Stack = new[] { "Flutter", "Dart", "Swift", "iOS", "Android", "REST API" },
                Status = VacancyStatus.Open,
                CreatedById = userMap["petr_petrov"].Id,
                Created = DateTime.UtcNow.AddDays(-6)
            }
        };

        context.Vacancies.AddRange(vacancies);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating developer projects with mini-profiles...");

        var projects = new List<UserProject>
        {
            new UserProject
            {
                Id = Guid.NewGuid(),
                UserId = mainUser.Id,
                Name = "Compile Network",
                Description = "Современная экосистема и социальная сеть для разработчиков. Интерактивные мини-профили проектов с девлогами, алгоритмическая лента рекомендаций, микроблогинг с поддержкой Markdown, подсветкой синтаксиса кода, видео и медиа-каруселью.",
                ImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
                Images = new[]
                {
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80"
                },
                GithubUrl = "https://github.com/test/compile-network",
                LiveUrl = "https://compileapp.ru",
                Technologies = new[] { "Next.js", "React", "TypeScript", "ASP.NET Core", "C#", "PostgreSQL", "SignalR", "Tailwind CSS" },
                Status = ProjectStatus.Released,
                StarsCount = 47,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new UserProject
            {
                Id = Guid.NewGuid(),
                UserId = mainUser.Id,
                Name = "HyperFlow Engine",
                Description = "Высокопроизводительный движок обработки очередей и фоновых задач на C# и memory-mapped файлах. Нулевые аллокации в hot-path, пропускная способность свыше 1.2M сообщений в секунду.",
                ImageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
                Images = new[]
                {
                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
                },
                GithubUrl = "https://github.com/test/hyperflow-engine",
                Technologies = new[] { "C#", ".NET 9", "Zero-Allocation", "SIMD", "Docker", "Benchmarks" },
                Status = ProjectStatus.InDevelopment,
                StarsCount = 34,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-14)
            },
            new UserProject
            {
                Id = Guid.NewGuid(),
                UserId = mainUser.Id,
                Name = "VoxelCraft Web",
                Description = "Воксельный 3D движок в браузере на WebGPU и TypeScript с процедурной генерацией бесконечного мира и воксельным освещением в реальном времени.",
                ImageUrl = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
                Images = new[]
                {
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
                },
                GithubUrl = "https://github.com/test/voxelcraft-web",
                LiveUrl = "https://voxelcraft.compileapp.ru",
                Technologies = new[] { "TypeScript", "WebGPU", "WGSL", "Vite", "Math" },
                Status = ProjectStatus.Beta,
                StarsCount = 28,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new UserProject
            {
                Id = Guid.NewGuid(),
                UserId = userMap["anna_andreeva"].Id,
                Name = "NeuralRAG Local",
                Description = "Open-source RAG-фреймворк для мгновенного локального семантического поиска и индексирования больших кодовых репозиториев без передачи данных наружу.",
                ImageUrl = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
                Images = new[]
                {
                    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
                },
                GithubUrl = "https://github.com/anna_andreeva/neural-rag-local",
                Technologies = new[] { "Python", "PyTorch", "FastAPI", "VectorDB", "LangChain" },
                Status = ProjectStatus.Released,
                StarsCount = 89,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-18)
            },
            new UserProject
            {
                Id = Guid.NewGuid(),
                UserId = userMap["sergey_sergeev"].Id,
                Name = "KubePulse TUI",
                Description = "Легковесный консольный TUI-дашборд для мониторинга Kubernetes кластеров в реальном времени, написанный на Go.",
                ImageUrl = "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=400&q=80",
                BannerUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
                Images = new[]
                {
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
                },
                GithubUrl = "https://github.com/sergey_sergeev/kubepulse",
                Technologies = new[] { "Go", "Kubernetes", "Bubbletea", "Docker" },
                Status = ProjectStatus.Beta,
                StarsCount = 61,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            }
        };

        context.UserProjects.AddRange(projects);
        await context.SaveChangesAsync();

        var projMap = projects.ToDictionary(p => p.Name, p => p);
        
        var projectStars = new List<ProjectStar>
        {
            new ProjectStar { ProjectId = projMap["Compile Network"].Id, UserId = userMap["petr_petrov"].Id, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new ProjectStar { ProjectId = projMap["Compile Network"].Id, UserId = userMap["alexey_alexeev"].Id, CreatedAt = DateTime.UtcNow.AddDays(-4) },
            new ProjectStar { ProjectId = projMap["Compile Network"].Id, UserId = userMap["anna_andreeva"].Id, CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new ProjectStar { ProjectId = projMap["Compile Network"].Id, UserId = userMap["sergey_sergeev"].Id, CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new ProjectStar { ProjectId = projMap["HyperFlow Engine"].Id, UserId = userMap["alexey_alexeev"].Id, CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new ProjectStar { ProjectId = projMap["HyperFlow Engine"].Id, UserId = userMap["mikhail_mikhailov"].Id, CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new ProjectStar { ProjectId = projMap["NeuralRAG Local"].Id, UserId = mainUser.Id, CreatedAt = DateTime.UtcNow.AddDays(-6) },
            new ProjectStar { ProjectId = projMap["KubePulse TUI"].Id, UserId = mainUser.Id, CreatedAt = DateTime.UtcNow.AddDays(-4) }
        };

        context.ProjectStars.AddRange(projectStars);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating realistic feed and devlog posts...");

        var posts = new List<Post>();
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = mainUser.Id,
            ProjectId = projMap["Compile Network"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddHours(-2),
            Content = @"### 🚀 Релиз Compile v2.4: Мини-профили проектов и интерактивные девлоги!

Рад представить масштабное обновление нашей платформы для разработчиков! Теперь каждый проект имеет свой собственный **мини-профиль** с медиа-галереей, амбиентным свечением скриншотов, ссылками на исходный код и хронологическим девлогом.

```typescript
interface ProjectMiniProfile {
  id: string;
  name: string;
  bannerUrl?: string;
  showcaseImages: string[];
  status: 'InDevelopment' | 'Beta' | 'Released';
  starsCount: number;
  devlogEntries: Post[];
}
```

#### Что нового:
- **Амбиентное размытие (ambient blur)** фона в галерее медиа, исключающее черные полосы по краям.
- **Интеграция с общей лентой:** при публикации обновления в девлог постам присваивается аккуратный бейдж `in p/НазваниеПроекта`.
- **Поддержка вставки кода** с подсветкой синтаксиса и живым Markdown-превью!

Оставляйте комментарии, ставьте звездочки и создавайте мини-профили своих проектов!",
            Attachments = new[]
            {
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
            },
            LikesCount = 18,
            CommentsCount = 0,
            RepostsCount = 2
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = mainUser.Id,
            ProjectId = projMap["HyperFlow Engine"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-1),
            Content = @"### ⚡ Оптимизация hot-path в HyperFlow: 1.2M сообщений/сек без GC аллокаций

Завершил бенчмаркинг нового кольцевого буфера памяти. Переход на `MemoryMappedViewAccessor` и SIMD-векторизацию дал прирост пропускной способности в **3.8x**.

```csharp
[MethodImpl(MethodImplOptions.AggressiveInlining)]
public unsafe bool TryEnqueue(ReadOnlySpan<byte> payload)
{
    var currentTail = Volatile.Read(ref _tail);
    if (currentTail - Volatile.Read(ref _head) >= _capacity)
        return false;

    fixed (byte* pSrc = payload)
    {
        byte* pDest = _buffer + (currentTail & _mask) * _slotSize;
        Buffer.MemoryCopy(pSrc, pDest, _slotSize, payload.Length);
    }
    
    Volatile.Write(ref _tail, currentTail + 1);
    return true;
}
```

Никаких `byte[]` аллокаций в куче Gen 0. Время отклика 99-го перцентиля (P99) стабильно держится на уровне **42 наносекунд**.",
            Attachments = new[]
            {
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
            },
            LikesCount = 24,
            CommentsCount = 0,
            RepostsCount = 3
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["alexey_alexeev"].Id,
            CommunityId = commMap["dotnet-ru"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-2),
            Content = @"### Архитектура Event-Driven микросервисов: Outbox Pattern на практике

Частая ошибка при интеграции с брокерами (Kafka / RabbitMQ) — отправка событий прямо из транзакции базы данных. Если брокер упадет или сетевой сокет разорвется, вы получите рассинхронизацию данных.

#### Как мы решаем это с Transactional Outbox:
1. Записываем доменное событие в таблицу `OutboxMessages` в рамках той же транзакции EF Core.
2. Фоновый `IHostedService` с `PeriodicTimer` батчами вычитывает события и паблишит в Kafka с подтверждением (ACK).
3. При успешном ACK помечаем `ProcessedAtUtc = DateTime.UtcNow`.

```csharp
public async Task HandleAsync(OrderPlacedDomainEvent domainEvent)
{
    var outboxMessage = new OutboxMessage
    {
        Id = Guid.NewGuid(),
        OccurredOnUtc = DateTime.UtcNow,
        Type = typeof(OrderPlacedDomainEvent).Name,
        Content = JsonSerializer.Serialize(domainEvent)
    };

    await _dbContext.OutboxMessages.AddAsync(outboxMessage);
    await _dbContext.SaveChangesAsync();
}
```

Кто уже использует этот паттерн в проде? Делитесь нюансами дедупликации на стороне потребителей!",
            Attachments = Array.Empty<string>(),
            LikesCount = 31,
            CommentsCount = 0,
            RepostsCount = 4
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["petr_petrov"].Id,
            CommunityId = commMap["frontend-hub"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-3),
            Content = @"### Как мы сократили bundle size на 44% при переходе на React Server Components

Делюсь метриками после рефакторинга нашей дизайн-системы на Next.js App Router. Перенос тяжелых библиотек (markdown-парсеры, date-fns, кастомные утилиты форматирования) на сторону сервера полностью исключил их из клиентского JS чанка.

#### Результаты:
- **Начальный размер первого бандла:** `312 KB`
- **После выноса в RSC:** `174 KB` (-44%)
- **First Contentful Paint (FCP):** ускорение с 1.4s до **0.6s** на 4G-соединении!

```tsx
// Server Component: парсинг и сборка происходят на сервере
import MarkdownPreview from '@/components/server-markdown';

export default async function ProjectPost({ postId }: { postId: string }) {
  const post = await fetchPost(postId);
  return (
    <article className=""prose prose-invert"">
      <MarkdownPreview source={post.content} />
    </article>
  );
}
```

Главный вывод: не бойтесь разделять UI на чисто серверные статичные контейнеры и изолированные `use client` острова.",
            Attachments = new[]
            {
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
            },
            LikesCount = 42,
            CommentsCount = 0,
            RepostsCount = 5
        });

        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["anna_andreeva"].Id,
            CommunityId = commMap["ai-engineering"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-4),
            Content = @"### Локальные LLM в продакшене: опыт квантования до 4-bit (GGUF & AWQ)

Провели тестирование инференса открытых моделей 7B и 14B на одной видеокарте RTX 4090.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained(
    'Qwen/Qwen2.5-7B-Instruct',
    device_map='auto',
    torch_dtype='auto'
)
```

С AWQ квантованием скорость генерации составила **98 токенов/сек** при потреблении всего 6.2 ГБ VRAM, а качество на бенчмарках кодогенерации просело менее чем на 1.2%! Для локальных ассистентов кодинга это идеальный баланс скорости и точности.",
            Attachments = Array.Empty<string>(),
            LikesCount = 29,
            CommentsCount = 0,
            RepostsCount = 2
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["sergey_sergeev"].Id,
            CommunityId = commMap["devops-cloud"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-5),
            Content = @"### Полезный bash-однострочник для быстрой диагностики упавших подов в K8s

Коллеги, держите сниппет, который экономит кучу нервов на дежурствах:

```bash
kubectl get pods -A --field-selector status.phase!=Running,status.phase!=Succeeded -o wide
```

А если нужно быстро собрать логи всех рестартнувшихся контейнеров за последний час:

```bash
kubectl logs -l app=payment-service --previous --tail=100
```

Сохраняйте в `.bashrc` алиас `kbad`. Ускоряет траблшутинг в разы!",
            Attachments = Array.Empty<string>(),
            LikesCount = 37,
            CommentsCount = 0,
            RepostsCount = 6
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = mainUser.Id,
            ProjectId = projMap["VoxelCraft Web"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-6),
            Content = @"### 🎮 Девлог VoxelCraft: Переход на WebGPU Compute шейдеры

Переписал алгоритм генерации воксельных чанков с CPU на Compute шейдеры WebGPU (WGSL). Теперь чанки 32x32x256 генерируются полностью параллельно на видеокарте за **0.4 миллисекунды** вместо 18ms в главном потоке JavaScript!

```wgsl
@compute @workgroup_size(8, 8, 8)
fn generateTerrain(@builtin(global_invocation_id) id: vec3<u32>) {
    let worldPos = vec3<f32>(id) + chunkOffset;
    let density = calculateNoise(worldPos);
    if (density > 0.0) {
        voxelBuffer[getIndex(id)] = 1u;
    }
}
```

Фреймрейт стабильно держится на уровне 144 FPS при дальности прорисовки в 24 чанка.",
            Attachments = new[]
            {
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
            },
            LikesCount = 27,
            CommentsCount = 0,
            RepostsCount = 1
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["elena_vasilieva"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-7),
            Content = @"Опубликовала обновленный дизайн-гайд по проектированию data-dense интерфейсов для платформ мониторинга и IDE.

- Строгая монохромная палитра `#0a0a0a` / `zinc-950`
- Контрастные акцентные бейджи для статусов сервисов
- Микро-интеракции на CSS transforms без лишних JS библиотек

Приятно видеть, как эти принципы находят воплощение в Compile!",
            Attachments = new[]
            {
                "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80"
            },
            LikesCount = 33,
            CommentsCount = 0,
            RepostsCount = 2
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["mikhail_mikhailov"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-8),
            Content = @"### 3 простых правила защиты JWT токенов в Single Page Applications (SPA):

1. **Никогда не храните Refresh Token в localStorage.** Он уязвим для XSS атак. Используйте `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
2. **Время жизни Access Token должно быть минимальным** (15-30 минут).
3. **Всегда проверяйте `alg` заголовок на бэкенде**, чтобы исключить атаку с подменой алгоритма на `none`.",
            Attachments = Array.Empty<string>(),
            LikesCount = 45,
            CommentsCount = 0,
            RepostsCount = 7
        });
        
        posts.Add(new Post
        {
            Id = Guid.NewGuid(),
            UserId = userMap["dmitry_dmitriev"].Id,
            ShowInGeneralFeed = true,
            Created = DateTime.UtcNow.AddDays(-9),
            Content = @"Коллеги, кто переводил продакшн мобильные приложения с Flutter на нативный Swift / Kotlin? Оправдались ли затраты на разработку двух отдельных кодовых баз ради 120fps анимаций и нативных виджетов? Поделитесь опытом!",
            Attachments = Array.Empty<string>(),
            LikesCount = 19,
            CommentsCount = 0,
            RepostsCount = 1
        });

        context.Post.AddRange(posts);
        await context.SaveChangesAsync();
        
        projMap["Compile Network"].PostsCount = 1;
        projMap["HyperFlow Engine"].PostsCount = 1;
        projMap["VoxelCraft Web"].PostsCount = 1;
        commMap["dotnet-ru"].PostsCount = 1;
        commMap["frontend-hub"].PostsCount = 1;
        commMap["ai-engineering"].PostsCount = 1;
        commMap["devops-cloud"].PostsCount = 1;
        
        Console.WriteLine("[DatabaseSeeder] Adding comments and discussions to posts...");

        var comments = new List<Comment>
        {
            new Comment
            {
                PostId = posts[0].Id,
                UserId = userMap["petr_petrov"].Id,
                Content = "Поздравляю с релизом! Размытие заднего фона в карусели скриншотов выглядит потрясающе, особенно на широкоформатных экранах.",
                Created = DateTime.UtcNow.AddHours(-1)
            },
            new Comment
            {
                PostId = posts[0].Id,
                UserId = userMap["alexey_alexeev"].Id,
                Content = "Отличная работа по архитектуре! Очень радует, что девлоги теперь интегрированы с общей лентой рекомендаций.",
                Created = DateTime.UtcNow.AddMinutes(-40)
            },
            new Comment
            {
                PostId = posts[0].Id,
                UserId = mainUser.Id,
                Content = "Спасибо огромное за поддержку! В следующем апдейте выкатим интерактивные виджеты со статистикой репозиториев.",
                Created = DateTime.UtcNow.AddMinutes(-20)
            },
            
            new Comment
            {
                PostId = posts[1].Id,
                UserId = userMap["alexey_alexeev"].Id,
                Content = "Мощный результат! А false-sharing между указателями head и tail учитывался? Делали padding в 64 байта?",
                Created = DateTime.UtcNow.AddHours(-18)
            },
            new Comment
            {
                PostId = posts[1].Id,
                UserId = mainUser.Id,
                Content = "Да, обязательно! Использовал `[StructLayout(LayoutKind.Explicit)]` со смещением `[FieldOffset(64)]` для разделения кэш-линий процессора.",
                Created = DateTime.UtcNow.AddHours(-16)
            },
            new Comment
            {
                PostId = posts[1].Id,
                UserId = userMap["mikhail_mikhailov"].Id,
                Content = "Красивое решение. Память освобождается в деструкторе или через `IDisposable` с `SafeHandle`?",
                Created = DateTime.UtcNow.AddHours(-14)
            },
            
            new Comment
            {
                PostId = posts[2].Id,
                UserId = mainUser.Id,
                Content = "Отличная статья, Алексей! Мы в Compile как раз используем Outbox для надежной отправки уведомлений и синхронизации поискового индекса.",
                Created = DateTime.UtcNow.AddDays(-1).AddHours(-4)
            },
            new Comment
            {
                PostId = posts[2].Id,
                UserId = userMap["sergey_sergeev"].Id,
                Content = "Кстати, в связке с Debezium для CDC (Change Data Capture) прямо из WAL логов PostgreSQL Outbox работает вообще без оверхеда на периодический поллинг таблицы.",
                Created = DateTime.UtcNow.AddDays(-1).AddHours(-2)
            },
            
            new Comment
            {
                PostId = posts[3].Id,
                UserId = userMap["elena_vasilieva"].Id,
                Content = "Подтверждаю, метрики переходов между страницами стали в разы плавнее. Никаких мерцаний скелетонов!",
                Created = DateTime.UtcNow.AddDays(-2)
            },
            
            new Comment
            {
                PostId = posts[9].Id,
                UserId = mainUser.Id,
                Content = "Если приложение контентное или SaaS-клиент — Flutter полностью закрывает 95% задач. Переходить на натив имеет смысл только если критичны специфичные системные API (Metal, CoreML, сложная обработка аудио/видео).",
                Created = DateTime.UtcNow.AddDays(-8)
            }
        };

        context.Comment.AddRange(comments);
        await context.SaveChangesAsync();
        
        posts[0].CommentsCount = 3;
        posts[1].CommentsCount = 3;
        posts[2].CommentsCount = 2;
        posts[3].CommentsCount = 1;
        posts[9].CommentsCount = 1;
        
        Console.WriteLine("[DatabaseSeeder] Adding likes to posts...");

        var postLikes = new List<PostLike>
        {
            new PostLike { PostId = posts[0].Id, UserId = userMap["petr_petrov"].Id },
            new PostLike { PostId = posts[0].Id, UserId = userMap["alexey_alexeev"].Id },
            new PostLike { PostId = posts[0].Id, UserId = userMap["anna_andreeva"].Id },
            new PostLike { PostId = posts[0].Id, UserId = userMap["sergey_sergeev"].Id },
            new PostLike { PostId = posts[0].Id, UserId = userMap["elena_vasilieva"].Id },
            new PostLike { PostId = posts[1].Id, UserId = userMap["alexey_alexeev"].Id },
            new PostLike { PostId = posts[1].Id, UserId = userMap["mikhail_mikhailov"].Id },
            new PostLike { PostId = posts[2].Id, UserId = mainUser.Id },
            new PostLike { PostId = posts[3].Id, UserId = mainUser.Id },
            new PostLike { PostId = posts[4].Id, UserId = mainUser.Id },
            new PostLike { PostId = posts[5].Id, UserId = mainUser.Id }
        };

        context.PostLikes.AddRange(postLikes);
        await context.SaveChangesAsync();
        
        Console.WriteLine("[DatabaseSeeder] Creating direct messaging dialogs...");
        
        var chat1 = new Chat
        {
            Id = Guid.NewGuid(),
            Title = null,
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
        };
        context.Chat.Add(chat1);

        context.ChatParticipant.AddRange(new[]
        {
            new ChatParticipant { ChatId = chat1.Id, UserId = mainUser.Id, IsPinned = true, JoinedAt = chat1.CreatedAt, LastReadAt = DateTime.UtcNow },
            new ChatParticipant { ChatId = chat1.Id, UserId = userMap["petr_petrov"].Id, IsPinned = false, JoinedAt = chat1.CreatedAt, LastReadAt = DateTime.UtcNow }
        });

        context.Message.AddRange(new[]
        {
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat1.Id,
                SenderId = userMap["petr_petrov"].Id,
                Content = "Привет, Андрей! Посмотрел обновление Compile с девлогами проектов — выглядит очень свежо и удобно!",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddHours(-3),
                IsRead = true
            },
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat1.Id,
                SenderId = mainUser.Id,
                Content = "Привет, Петр! Спасибо огромное, очень старался сделать удобный формат именно для разработчиков. Как тебе амбиентный блур в галерее?",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddHours(-2),
                IsRead = true
            },
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat1.Id,
                SenderId = userMap["petr_petrov"].Id,
                Content = "Блур вообще топ, скриншоты любого формата теперь смотрятся идеально на черном фоне. Кстати, мы в Flow Digital открыли вакансию Lead Frontend, если будет интересно обсудить — дай знать!",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddMinutes(-15),
                IsRead = true
            }
        });
        
        var chat2 = new Chat
        {
            Id = Guid.NewGuid(),
            Title = null,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddHours(-1)
        };
        context.Chat.Add(chat2);

        context.ChatParticipant.AddRange(new[]
        {
            new ChatParticipant { ChatId = chat2.Id, UserId = mainUser.Id, IsPinned = false, JoinedAt = chat2.CreatedAt, LastReadAt = DateTime.UtcNow },
            new ChatParticipant { ChatId = chat2.Id, UserId = userMap["alexey_alexeev"].Id, IsPinned = false, JoinedAt = chat2.CreatedAt, LastReadAt = DateTime.UtcNow }
        });

        context.Message.AddRange(new[]
        {
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat2.Id,
                SenderId = userMap["alexey_alexeev"].Id,
                Content = "Здорово, Андрей! Заценил твои бенчмарки по HyperFlow Engine. Впечатляющие тайминги по P99.",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddHours(-4),
                IsRead = true
            },
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat2.Id,
                SenderId = mainUser.Id,
                Content = "Привет, Алексей! Спасибо! Потребовалось изрядно повозиться с выравниванием по кэш-линиям и отказом от любых ссылочных типов в цикле обработки.",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddHours(-1),
                IsRead = true
            }
        });
        
        var chat3 = new Chat
        {
            Id = Guid.NewGuid(),
            Title = null,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddHours(-5)
        };
        context.Chat.Add(chat3);

        context.ChatParticipant.AddRange(new[]
        {
            new ChatParticipant { ChatId = chat3.Id, UserId = mainUser.Id, IsPinned = false, JoinedAt = chat3.CreatedAt, LastReadAt = DateTime.UtcNow },
            new ChatParticipant { ChatId = chat3.Id, UserId = userMap["anna_andreeva"].Id, IsPinned = false, JoinedAt = chat3.CreatedAt, LastReadAt = DateTime.UtcNow }
        });

        context.Message.AddRange(new[]
        {
            new Message
            {
                Id = Guid.NewGuid(),
                ChatId = chat3.Id,
                SenderId = userMap["anna_andreeva"].Id,
                Content = "Привет, Андрей! Хочу интегрировать семантический поиск по девлогам проектов с помощью нашей локальной модели. Можем созвониться на выходных?",
                Attachments = Array.Empty<string>(),
                SentAt = DateTime.UtcNow.AddHours(-5),
                IsRead = true
            }
        });

        await context.SaveChangesAsync();

        Console.WriteLine("[DatabaseSeeder] Seeding completed successfully!");
        Console.WriteLine($"[DatabaseSeeder] Summary: {usersData.Count} users, {communities.Count} communities/companies, {vacancies.Count} vacancies, {projects.Count} projects, {posts.Count} posts, {comments.Count} comments, 3 active chats.");
    }
}
