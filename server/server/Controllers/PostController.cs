using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using Microsoft.AspNetCore.SignalR;
using server.Hubs;
using System.Text.RegularExpressions;
using server.Helpers;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;

        private readonly IHubContext<ChatHub> _hubContext;
        
        public PostController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _userManager = userManager;
            _config = config;
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/Post
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Post>>> GetPost()
        {
            return await _context.Post.ToListAsync();
        }

        // GET: api/Post/trending
        [HttpGet("trending")]
        public async Task<IActionResult> GetTrendingTopics([FromQuery] int limit = 4)
        {
            limit = Math.Clamp(limit, 1, 10);

            var cutoff = DateTime.UtcNow.AddDays(-7);
            var recentPosts = await _context.Post
                .Include(p => p.Community)
                .Where(p => p.Created >= cutoff)
                .OrderByDescending(p => p.Created)
                .Take(200)
                .ToListAsync();

            if (recentPosts.Count < 5)
            {
                cutoff = DateTime.UtcNow.AddDays(-30);
                recentPosts = await _context.Post
                    .Include(p => p.Community)
                    .Where(p => p.Created >= cutoff)
                    .OrderByDescending(p => p.Created)
                    .Take(200)
                    .ToListAsync();
            }

            var topicScores = new Dictionary<string, (TrendingTopicDto Dto, HashSet<Guid> PostIds, double TotalScore)>(StringComparer.OrdinalIgnoreCase);

            foreach (var post in recentPosts)
            {
                var extracted = TrendingTopicExtractor.ExtractTopicsFromPost(post);
                var hoursOld = (DateTime.UtcNow - post.Created).TotalHours;

                double recencyMultiplier = hoursOld <= 24 ? 1.5 : (hoursOld <= 48 ? 1.2 : 1.0);
                double postWeight = (2.0 + post.LikesCount + post.CommentsCount * 2.0 + post.RepostsCount * 3.0) * recencyMultiplier;

                foreach (var item in extracted)
                {
                    if (!topicScores.TryGetValue(item.NormalizedTag, out var entry))
                    {
                        entry = (
                            new TrendingTopicDto
                            {
                                Tag = item.NormalizedTag,
                                DisplayTag = item.DisplayTag,
                                Category = item.Category,
                            },
                            new HashSet<Guid>(),
                            0
                        );
                    }

                    entry.PostIds.Add(post.Id);
                    entry.TotalScore += postWeight * item.BaseWeight;
                    topicScores[item.NormalizedTag] = entry;
                }
            }

            var result = topicScores.Values
                .Select(x => new TrendingTopicDto
                {
                    Tag = x.Dto.Tag,
                    DisplayTag = x.Dto.DisplayTag,
                    Category = x.Dto.Category,
                    PostCount = x.PostIds.Count,
                    PostsFormatted = TrendingTopicExtractor.FormatPostsCount(x.PostIds.Count),
                    Score = x.TotalScore
                })
                .OrderByDescending(x => x.Score)
                .Take(limit)
                .ToList();

            if (result.Count < limit)
            {
                var existingTags = new HashSet<string>(result.Select(r => r.Tag), StringComparer.OrdinalIgnoreCase);
                var activeCommunities = await _context.Communities
                    .OrderByDescending(c => c.MembersCount)
                    .Take(limit * 2)
                    .ToListAsync();

                foreach (var comm in activeCommunities)
                {
                    if (result.Count >= limit) break;
                    var commTag = "#" + Regex.Replace(comm.Slug.ToLower(), @"[^a-z0-9_]", "");
                    if (!existingTags.Contains(commTag))
                    {
                        var postsCount = await _context.Post.CountAsync(p => p.CommunityId == comm.Id);
                        var count = Math.Max(postsCount, comm.MembersCount);
                        result.Add(new TrendingTopicDto
                        {
                            Tag = commTag,
                            DisplayTag = "#" + (string.IsNullOrWhiteSpace(comm.Name) ? comm.Slug : comm.Name.Replace(" ", "")),
                            Category = !string.IsNullOrWhiteSpace(comm.Industry) ? comm.Industry : "Community",
                            PostCount = count,
                            PostsFormatted = TrendingTopicExtractor.FormatPostsCount(count),
                            Score = 1.0
                        });
                        existingTags.Add(commTag);
                    }
                }
            }

            return Ok(result);
        }

        // GET: api/Post/5
        [HttpGet("getPost/{id}")]
        public async Task<ActionResult<Post>> GetPost(Guid id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var post = await _context.Post
                .Include(p => p.User)
                .Where(p => p.Id == id)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    community = p.Community == null ? null : new {
                        id = p.Community.Id,
                        name = p.Community.Name,
                        slug = p.Community.Slug,
                        avatar = p.Community.Avatar
                    },

                    project = p.Project == null ? null : new {
                        id = p.Project.Id,
                        name = p.Project.Name,
                        imageUrl = p.Project.ImageUrl,
                        status = (int)p.Project.Status
                    },
                    
                    commentsList = p.Comments
                        .OrderBy(c => c.Created)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .FirstOrDefaultAsync();

            if (post == null)
            {
                return NotFound();
            }

            return Ok(post);
        }

        // PUT: api/Post/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("updatePost/{id}")]
        [Authorize]
        public async Task<IActionResult> PutPost(Guid id, [FromBody] UpdatePostDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var post = await _context.Post.FindAsync(id);

            if (post == null) return NotFound();
            
            if (post.UserId != userId)
            {
                return Forbid();
            }

            post.Content = model.Content;
            post.Attachments = model.Attachments;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/Post
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("createPost")]
        [Authorize]
        public async Task<IActionResult> PostPost([FromBody] CreatePostDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();
            
            if (string.IsNullOrEmpty(model.Content) && 
                (model.Attachments == null || model.Attachments.Length == 0) && 
                !model.RepostOfPostId.HasValue)
            {
                return BadRequest("Пост не может быть пустым.");
            }

            object? repostInfo = null;
            
            if (model.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == model.RepostOfPostId.Value);

                if (originalPost != null)
                {
                    originalPost.RepostsCount++;
                    repostInfo = new {
                        id = originalPost.Id,
                        content = originalPost.Content,
                        created = originalPost.Created,
                        attachments = originalPost.Attachments,
                        authorName = originalPost.User?.FullName,
                        authorUsername = originalPost.User?.UserName,
                        authorAvatar = originalPost.User?.Avatar
                    };
                }
            }
            
            Community? community = null;
            
            if (model.CommunityId.HasValue)
            {
                community = await _context.Communities
                    .Include(c => c.Members)
                    .FirstOrDefaultAsync(c => c.Id == model.CommunityId.Value);

                if (community != null)
                {
                    var member = community.Members.FirstOrDefault(m => m.UserId == userId);
                    
                    if (community.PostingPolicy == CommunityPostingPolicy.AdminsAndModerators)
                    {
                        if (member == null || (member.Role != CommunityRole.Admin && member.Role != CommunityRole.Owner && member.Role != CommunityRole.Moderator))
                        {
                            return Forbid();
                        }
                    }
                    else if (community.PostingPolicy == CommunityPostingPolicy.MembersOnly)
                    {
                        if (member == null || member.Status != MemberStatus.Active)
                        {
                            return BadRequest("Только участники могут публиковать посты в этом сообществе.");
                        }
                    }

                    community.PostsCount++;
                }
            }
            
            UserProject? project = null;
            if (model.ProjectId.HasValue)
            {
                project = await _context.UserProjects.FirstOrDefaultAsync(pr => pr.Id == model.ProjectId.Value);
                if (project != null)
                {
                    if (project.UserId != userId)
                    {
                        return Forbid();
                    }
                    project.PostsCount++;
                }
            }

            var post = new Post
            {
                Content = model.Content,
                Attachments = model.Attachments,
                UserId = userId,
                RepostOfPostId = model.RepostOfPostId,
                CommunityId = model.CommunityId,
                ProjectId = model.ProjectId,
                ShowInGeneralFeed = model.ShowInGeneralFeed
            };
            
            _context.Post.Add(post);
            await _context.SaveChangesAsync();
            
            if (model.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post.FindAsync(model.RepostOfPostId.Value);
                if (originalPost != null)
                {
                    await _hubContext.Clients.All.SendAsync("postReposted", new
                    {
                        postId = originalPost.Id,
                        repostsCount = originalPost.RepostsCount
                    });
                }
            }

            await _hubContext.Clients.All.SendAsync("postCreated", new {
                id = post.Id,
                content = post.Content,
                created = post.Created,
                attachments = post.Attachments,
                likesCount = post.LikesCount,
                isLikedByMe = false,
                commentsCount = post.CommentsCount,
                
                authorName = user.FullName,
                authorUsername = user.UserName,
                authorAvatar = user.Avatar,
                repostOfPost = repostInfo,
                
                commentsList = post.Comments
                    .OrderByDescending(c => c.Created)
                    .Take(3)
                    .Select(c => new {
                        id = c.Id,
                        content = c.Content,
                        created = c.Created,
                        authorName = c.User.FullName,
                        authorUsername = c.User.UserName,
                        authorAvatar = c.User.Avatar
                    }),
                
                community = community == null ? null : new {
                    id = community.Id,
                    name = community.Name,
                    slug = community.Slug,
                    avatar = community.Avatar
                },

                project = project == null ? null : new {
                    id = project.Id,
                    name = project.Name,
                    imageUrl = project.ImageUrl,
                    status = (int)project.Status
                },
            });
            
            return Ok(new { id = post.Id, message = "Пост успешно создан" });
        }

        // DELETE: api/Post/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var post = await _context.Post.FindAsync(id);
    
            if (post == null) return NotFound();
            if (post.UserId != userId) return Forbid();
            
            if (post.RepostOfPostId.HasValue)
            {
                var originalPost = await _context.Post.FindAsync(post.RepostOfPostId.Value);
                if (originalPost != null)
                {
                    originalPost.RepostsCount = Math.Max(0, originalPost.RepostsCount - 1);
            
                    await _hubContext.Clients.All.SendAsync("postReposted", new
                    {
                        postId = originalPost.Id,
                        repostsCount = originalPost.RepostsCount
                    });
                }
            }

            if (post.ProjectId.HasValue)
            {
                var proj = await _context.UserProjects.FindAsync(post.ProjectId.Value);
                if (proj != null)
                {
                    proj.PostsCount = Math.Max(0, proj.PostsCount - 1);
                }
            }

            _context.Post.Remove(post);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("postDeleted", new { id = post.Id });
            return NoContent();
        }

        private bool PostExists(Guid id)
        {
            return _context.Post.Any(e => e.Id == id);
        }
        
        [HttpGet("getAllPosts")]
        public async Task<IActionResult> GetFeed(
            [FromQuery] string? filter = null,
            [FromQuery] string? cursor = null,
            [FromQuery] int limit = 15)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            limit = Math.Clamp(limit, 1, 50);
            
            if (filter == "watching")
            {
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Ok(new {
                        items = Array.Empty<object>(),
                        nextCursor = (string?)null,
                        hasMore = false
                    });
                }

                var watchedUserIds = await _context.UserWatchers
                    .Where(uw => uw.WatcherId == currentUserId)
                    .Select(uw => uw.TargetUserId)
                    .ToListAsync();

                if (!watchedUserIds.Any())
                {
                    return Ok(new {
                        items = Array.Empty<object>(),
                        nextCursor = (string?)null,
                        hasMore = false
                    });
                }

                var watchingQuery = _context.Post
                    .Include(p => p.User)
                    .Include(p => p.Community)
                    .Include(p => p.Project)
                    .Where(p => watchedUserIds.Contains(p.UserId) && !p.IsPostedAsCommunity && (p.ProjectId == null || p.ShowInGeneralFeed));

                if (!string.IsNullOrEmpty(cursor) && DateTime.TryParse(cursor, null, System.Globalization.DateTimeStyles.RoundtripKind, out var watchingCursorDate))
                {
                    var cursorUtc = watchingCursorDate.Kind == DateTimeKind.Utc 
                        ? watchingCursorDate 
                        : watchingCursorDate.ToUniversalTime();
                    watchingQuery = watchingQuery.Where(p => p.Created < cursorUtc);
                }

                var rawWatchingPosts = await watchingQuery
                    .OrderByDescending(p => p.Created)
                    .ThenByDescending(p => p.Id)
                    .Take(limit + 1)
                    .Select(p => new {
                        id = p.Id,
                        content = p.Content,
                        created = p.Created,
                        attachments = p.Attachments,
                        likesCount = p.LikesCount,
                        isLikedByMe = _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                        commentsCount = p.CommentsCount,
                        repostsCount = p.RepostsCount,
                        repostOfPost = p.RepostOfPost == null ? null : new {
                            id = p.RepostOfPost.Id,
                            content = p.RepostOfPost.Content,
                            created = p.RepostOfPost.Created,
                            attachments = p.RepostOfPost.Attachments,
                            authorName = p.RepostOfPost.User.FullName,
                            authorUsername = p.RepostOfPost.User.UserName,
                            authorAvatar = p.RepostOfPost.User.Avatar
                        },
                        authorName = p.User.FullName,
                        authorUsername = p.User.UserName,
                        authorAvatar = p.User.Avatar,
                        community = p.Community == null ? null : new {
                            id = p.Community.Id,
                            name = p.Community.Name,
                            slug = p.Community.Slug,
                            avatar = p.Community.Avatar
                        },
                        project = p.Project == null ? null : new {
                            id = p.Project.Id,
                            name = p.Project.Name,
                            imageUrl = p.Project.ImageUrl,
                            status = (int)p.Project.Status
                        },
                        commentsList = p.Comments
                            .OrderByDescending(c => c.Created)
                            .Take(3)
                            .Select(c => new {
                                id = c.Id,
                                content = c.Content,
                                created = c.Created,
                                authorName = c.User.FullName,
                                authorUsername = c.User.UserName,
                                authorAvatar = c.User.Avatar
                            })
                    })
                    .ToListAsync();

                bool watchingHasMore = rawWatchingPosts.Count > limit;
                var watchingItems = watchingHasMore ? rawWatchingPosts.Take(limit).ToList() : rawWatchingPosts;
                string? watchingNextCursor = watchingHasMore && watchingItems.Any() ? watchingItems.Last().created.ToString("o") : null;

                return Ok(new {
                    items = watchingItems,
                    nextCursor = watchingNextCursor,
                    hasMore = watchingHasMore
                });
            }
            
            bool isRecCursor = string.IsNullOrEmpty(cursor) || cursor.StartsWith("rec_", StringComparison.OrdinalIgnoreCase);

            if (isRecCursor)
            {
                int offset = 0;
                if (!string.IsNullOrEmpty(cursor) && cursor.StartsWith("rec_", StringComparison.OrdinalIgnoreCase))
                {
                    int.TryParse(cursor["rec_".Length..], out offset);
                }
                
                FeedRecommendationScorer.UserInterestProfile? profile = null;
                if (!string.IsNullOrEmpty(currentUserId))
                {
                    var currentUser = await _userManager.FindByIdAsync(currentUserId);
                    var userWatchedCommunities = await _context.CommunityWatchers
                        .Where(w => w.UserId == currentUserId)
                        .Select(w => w.CommunityId)
                        .ToListAsync();
                    var userWatchedUsers = await _context.UserWatchers
                        .Where(uw => uw.WatcherId == currentUserId)
                        .Select(uw => uw.TargetUserId)
                        .ToListAsync();
                    var userLikes = await _context.PostLikes
                        .Where(l => l.UserId == currentUserId)
                        .Select(l => l.PostId)
                        .ToListAsync();

                    profile = new FeedRecommendationScorer.UserInterestProfile
                    {
                        UserId = currentUserId,
                        Focus = currentUser?.Focus,
                        WatchedCommunityIds = new HashSet<Guid>(userWatchedCommunities),
                        WatchedUserIds = new HashSet<string>(userWatchedUsers, StringComparer.OrdinalIgnoreCase),
                        LikedPostIds = new HashSet<Guid>(userLikes)
                    };

                    if (currentUser?.Technologies != null)
                    {
                        foreach (var tech in currentUser.Technologies)
                        {
                            var norm = FeedRecommendationScorer.NormalizeTag(tech);
                            if (!string.IsNullOrEmpty(norm))
                            {
                                profile.NormalizedTechnologies.Add(norm);
                            }
                        }
                    }
                }
                
                var cutoff = DateTime.UtcNow.AddDays(-14);
                var candidateQuery = _context.Post
                    .Include(p => p.User)
                    .Include(p => p.Community)
                    .Include(p => p.Project)
                    .Include(p => p.RepostOfPost).ThenInclude(r => r!.User)
                    .Include(p => p.Comments).ThenInclude(c => c.User)
                    .Where(p => p.ProjectId == null || p.ShowInGeneralFeed)
                    .AsQueryable();

                var candidates = await candidateQuery
                    .Where(p => p.Created >= cutoff)
                    .OrderByDescending(p => p.Created)
                    .Take(250)
                    .ToListAsync();

                if (candidates.Count < 30)
                {
                    cutoff = DateTime.UtcNow.AddDays(-60);
                    candidates = await candidateQuery
                        .Where(p => p.Created >= cutoff)
                        .OrderByDescending(p => p.Created)
                        .Take(250)
                        .ToListAsync();
                }

                if (candidates.Count < 15)
                {
                    candidates = await candidateQuery
                        .OrderByDescending(p => p.Created)
                        .Take(250)
                        .ToListAsync();
                }
                
                var ranked = FeedRecommendationScorer.ScoreAndRank(candidates, profile);

                var pagedSlice = ranked.Skip(offset).Take(limit + 1).ToList();
                bool hasMore = pagedSlice.Count > limit;
                var currentBatch = hasMore ? pagedSlice.Take(limit).ToList() : pagedSlice;

                string? nextCursor = null;
                if (hasMore)
                {
                    nextCursor = $"rec_{offset + limit}";
                }
                else if (candidates.Count >= 250)
                {
                    var oldestCandidate = candidates.OrderBy(c => c.Created).FirstOrDefault();
                    if (oldestCandidate != null)
                    {
                        var hasArchive = await _context.Post.AnyAsync(p => p.Created < oldestCandidate.Created);
                        if (hasArchive)
                        {
                            hasMore = true;
                            nextCursor = oldestCandidate.Created.ToString("o");
                        }
                    }
                }

                var likedIdsSet = profile?.LikedPostIds ?? (currentUserId != null
                    ? new HashSet<Guid>(await _context.PostLikes.Where(l => l.UserId == currentUserId).Select(l => l.PostId).ToListAsync())
                    : new HashSet<Guid>());

                var items = currentBatch.Select(sp => {
                    var p = sp.Post;
                    return new {
                        id = p.Id,
                        content = p.Content,
                        created = p.Created,
                        attachments = p.Attachments,
                        likesCount = p.LikesCount,
                        isLikedByMe = likedIdsSet.Contains(p.Id),
                        commentsCount = p.CommentsCount,
                        repostsCount = p.RepostsCount,
                        recommendationReason = sp.RecommendationReason,
                        repostOfPost = p.RepostOfPost == null ? null : new {
                            id = p.RepostOfPost.Id,
                            content = p.RepostOfPost.Content,
                            created = p.RepostOfPost.Created,
                            attachments = p.RepostOfPost.Attachments,
                            authorName = p.RepostOfPost.User?.FullName ?? "",
                            authorUsername = p.RepostOfPost.User?.UserName ?? "",
                            authorAvatar = p.RepostOfPost.User?.Avatar ?? ""
                        },
                        authorName = p.User?.FullName ?? "",
                        authorUsername = p.User?.UserName ?? "",
                        authorAvatar = p.User?.Avatar ?? "",
                        community = p.Community == null ? null : new {
                            id = p.Community.Id,
                            name = p.Community.Name,
                            slug = p.Community.Slug,
                            avatar = p.Community.Avatar
                        },
                        project = p.Project == null ? null : new {
                            id = p.Project.Id,
                            name = p.Project.Name,
                            imageUrl = p.Project.ImageUrl,
                            status = (int)p.Project.Status
                        },
                        commentsList = p.Comments
                            .OrderByDescending(c => c.Created)
                            .Take(3)
                            .Select(c => new {
                                id = c.Id,
                                content = c.Content,
                                created = c.Created,
                                authorName = c.User?.FullName ?? "",
                                authorUsername = c.User?.UserName ?? "",
                                authorAvatar = c.User?.Avatar ?? ""
                            })
                    };
                }).ToList();

                return Ok(new {
                    items,
                    nextCursor,
                    hasMore
                });
            }
            else
            {
                var archiveQuery = _context.Post
                    .Include(p => p.User)
                    .Include(p => p.Community)
                    .Include(p => p.Project)
                    .Where(p => p.ProjectId == null || p.ShowInGeneralFeed)
                    .AsQueryable();

                if (DateTime.TryParse(cursor, null, System.Globalization.DateTimeStyles.RoundtripKind, out var archiveCursorDate))
                {
                    var cursorUtc = archiveCursorDate.Kind == DateTimeKind.Utc 
                        ? archiveCursorDate 
                        : archiveCursorDate.ToUniversalTime();
                    archiveQuery = archiveQuery.Where(p => p.Created < cursorUtc);
                }

                var rawArchivePosts = await archiveQuery
                    .OrderByDescending(p => p.Created)
                    .ThenByDescending(p => p.Id)
                    .Take(limit + 1)
                    .Select(p => new {
                        id = p.Id,
                        content = p.Content,
                        created = p.Created,
                        attachments = p.Attachments,
                        likesCount = p.LikesCount,
                        isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                        commentsCount = p.CommentsCount,
                        repostsCount = p.RepostsCount,
                        recommendationReason = (string?)null,
                        repostOfPost = p.RepostOfPost == null ? null : new {
                            id = p.RepostOfPost.Id,
                            content = p.RepostOfPost.Content,
                            created = p.RepostOfPost.Created,
                            attachments = p.RepostOfPost.Attachments,
                            authorName = p.RepostOfPost.User.FullName,
                            authorUsername = p.RepostOfPost.User.UserName,
                            authorAvatar = p.RepostOfPost.User.Avatar
                        },
                        authorName = p.User.FullName,
                        authorUsername = p.User.UserName,
                        authorAvatar = p.User.Avatar,
                        community = p.Community == null ? null : new {
                            id = p.Community.Id,
                            name = p.Community.Name,
                            slug = p.Community.Slug,
                            avatar = p.Community.Avatar
                        },
                        project = p.Project == null ? null : new {
                            id = p.Project.Id,
                            name = p.Project.Name,
                            imageUrl = p.Project.ImageUrl,
                            status = (int)p.Project.Status
                        },
                        commentsList = p.Comments
                            .OrderByDescending(c => c.Created)
                            .Take(3)
                            .Select(c => new {
                                id = c.Id,
                                content = c.Content,
                                created = c.Created,
                                authorName = c.User.FullName,
                                authorUsername = c.User.UserName,
                                authorAvatar = c.User.Avatar
                            })
                    })
                    .ToListAsync();

                bool archiveHasMore = rawArchivePosts.Count > limit;
                var archiveItems = archiveHasMore ? rawArchivePosts.Take(limit).ToList() : rawArchivePosts;
                string? archiveNextCursor = archiveHasMore && archiveItems.Any() ? archiveItems.Last().created.ToString("o") : null;

                return Ok(new {
                    items = archiveItems,
                    nextCursor = archiveNextCursor,
                    hasMore = archiveHasMore
                });
            }
        }

        [HttpPost("likePost/{id}")]
        [Authorize]
        public async Task<IActionResult> LikePost(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var post = await _context.Post.FindAsync(id);
            if (post == null) return NotFound();
            
            var existingLike = await _context.PostLikes
                .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);
            
            bool isLiked;
            
            if (existingLike != null)
            {
                _context.PostLikes.Remove(existingLike);
                post.LikesCount = Math.Max(0, post.LikesCount - 1);
                isLiked = false;
            }
            else
            {
                _context.PostLikes.Add(new PostLike
                {
                    PostId = id,
                    UserId = userId
                });
                post.LikesCount++;
                isLiked = true;
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("postLiked", new 
            {
                postId = post.Id,
                likesCount = post.LikesCount,
                userId = userId,
                isLiked = isLiked
            });
            
            return Ok(new 
            { 
                isLiked = isLiked, 
                likesCount = post.LikesCount 
            });
        }
        
        [HttpGet("getUserPosts")]
        [Authorize]
        public async Task<IActionResult> GetUserPosts(
            [FromQuery] DateTime? cursor = null,
            [FromQuery] int limit = 15)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            limit = Math.Clamp(limit, 1, 50);

            var query = _context.Post
                .Include(p => p.User)
                .Include(p => p.Project)
                .Where(p => p.UserId == userId);

            if (cursor.HasValue)
            {
                var cursorUtc = cursor.Value.Kind == DateTimeKind.Utc 
                    ? cursor.Value 
                    : cursor.Value.ToUniversalTime();
                query = query.Where(p => p.Created < cursorUtc);
            }

            var rawPosts = await query
                .OrderByDescending(p => p.Created)
                .ThenByDescending(p => p.Id)
                .Take(limit + 1)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == userId),
                    commentsCount = p.CommentsCount,
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    project = p.Project == null ? null : new {
                        id = p.Project.Id,
                        name = p.Project.Name,
                        imageUrl = p.Project.ImageUrl,
                        status = (int)p.Project.Status
                    },
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            bool hasMore = rawPosts.Count > limit;
            var items = hasMore ? rawPosts.Take(limit).ToList() : rawPosts;
            string? nextCursor = hasMore && items.Any() ? items.Last().created.ToString("o") : null;

            return Ok(new {
                items,
                nextCursor,
                hasMore
            });
        }
        
        [HttpGet("getCommunityPosts/{slug}")]
        public async Task<IActionResult> GetCommunityPosts(
            string slug,
            [FromQuery] DateTime? cursor = null,
            [FromQuery] int limit = 15)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cleanSlug = slug.Trim().ToLower();
            limit = Math.Clamp(limit, 1, 50);

            var query = _context.Post
                .Include(p => p.User)
                .Include(p => p.Community)
                .Where(p => p.Community != null && p.Community.Slug == cleanSlug);

            if (cursor.HasValue)
            {
                var cursorUtc = cursor.Value.Kind == DateTimeKind.Utc 
                    ? cursor.Value 
                    : cursor.Value.ToUniversalTime();
                query = query.Where(p => p.Created < cursorUtc);
            }

            var rawPosts = await query
                .OrderByDescending(p => p.Created)
                .ThenByDescending(p => p.Id)
                .Take(limit + 1)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    repostsCount = p.RepostsCount,
                    
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },

                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    community = new {
                        id = p.Community.Id,
                        name = p.Community.Name,
                        slug = p.Community.Slug,
                        avatar = p.Community.Avatar
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            bool hasMore = rawPosts.Count > limit;
            var items = hasMore ? rawPosts.Take(limit).ToList() : rawPosts;
            string? nextCursor = hasMore && items.Any() ? items.Last().created.ToString("o") : null;

            return Ok(new {
                items,
                nextCursor,
                hasMore
            });
        }
        
        [HttpGet("getOtherUserPosts/{username}")]
        public async Task<IActionResult> GetPostsByUsername(
            string username,
            [FromQuery] DateTime? cursor = null,
            [FromQuery] int limit = 15)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound();

            limit = Math.Clamp(limit, 1, 50);

            var query = _context.Post
                .Include(p => p.User)
                .Include(p => p.Project)
                .Where(p => p.UserId == user.Id);

            if (cursor.HasValue)
            {
                var cursorUtc = cursor.Value.Kind == DateTimeKind.Utc 
                    ? cursor.Value 
                    : cursor.Value.ToUniversalTime();
                query = query.Where(p => p.Created < cursorUtc);
            }

            var rawPosts = await query
                .OrderByDescending(p => p.Created)
                .ThenByDescending(p => p.Id)
                .Take(limit + 1)
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,
                    
                    project = p.Project == null ? null : new {
                        id = p.Project.Id,
                        name = p.Project.Name,
                        imageUrl = p.Project.ImageUrl,
                        status = (int)p.Project.Status
                    },
                    
                    repostsCount = p.RepostsCount,
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            bool hasMore = rawPosts.Count > limit;
            var items = hasMore ? rawPosts.Take(limit).ToList() : rawPosts;
            string? nextCursor = hasMore && items.Any() ? items.Last().created.ToString("o") : null;

            return Ok(new {
                items,
                nextCursor,
                hasMore
            });
        }
        
        [HttpGet("search")]
        public async Task<IActionResult> SearchPosts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(new List<object>());
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cleanQuery = query.Trim().ToLower();
            var noHash = cleanQuery.TrimStart('#');
            var collapsed = Regex.Replace(noHash, @"[\s\-_]+", "");

            var posts = await _context.Post
                .Include(p => p.User)
                .Include(p => p.Community)
                .Include(p => p.Project)
                .Include(p => p.RepostOfPost)
                    .ThenInclude(rp => rp.User)
                .Where(p => (p.Content != null && (
                                p.Content.ToLower().Contains(cleanQuery) || 
                                (!string.IsNullOrEmpty(noHash) && p.Content.ToLower().Contains(noHash)) ||
                                (!string.IsNullOrEmpty(collapsed) && p.Content.ToLower().Replace(" ", "").Replace("-", "").Replace("_", "").Contains(collapsed))
                            ))
                         || (p.Community != null && (
                                p.Community.Slug.ToLower().Contains(noHash) || 
                                p.Community.Name.ToLower().Contains(noHash) ||
                                (!string.IsNullOrEmpty(collapsed) && (
                                    p.Community.Slug.ToLower().Replace("-", "").Replace("_", "").Contains(collapsed) ||
                                    p.Community.Name.ToLower().Replace(" ", "").Replace("-", "").Replace("_", "").Contains(collapsed)
                                ))
                            )))
                .OrderByDescending(p => p.Created)
                .Take(20) 
                .Select(p => new {
                    id = p.Id,
                    content = p.Content,
                    created = p.Created,
                    attachments = p.Attachments,
                    likesCount = p.LikesCount,
                    isLikedByMe = currentUserId != null && _context.PostLikes.Any(l => l.PostId == p.Id && l.UserId == currentUserId),
                    commentsCount = p.CommentsCount,
                    repostsCount = p.RepostsCount,
                    
                    repostOfPost = p.RepostOfPost == null ? null : new {
                        id = p.RepostOfPost.Id,
                        content = p.RepostOfPost.Content,
                        created = p.RepostOfPost.Created,
                        attachments = p.RepostOfPost.Attachments,
                        authorName = p.RepostOfPost.User.FullName,
                        authorUsername = p.RepostOfPost.User.UserName,
                        authorAvatar = p.RepostOfPost.User.Avatar
                    },

                    authorName = p.User.FullName,
                    authorUsername = p.User.UserName,
                    authorAvatar = p.User.Avatar,

                    community = p.Community == null ? null : new {
                        id = p.Community.Id,
                        name = p.Community.Name,
                        slug = p.Community.Slug,
                        avatar = p.Community.Avatar
                    },

                    project = p.Project == null ? null : new {
                        id = p.Project.Id,
                        name = p.Project.Name,
                        imageUrl = p.Project.ImageUrl,
                        status = (int)p.Project.Status
                    },
                    
                    commentsList = p.Comments
                        .OrderByDescending(c => c.Created)
                        .Take(3)
                        .Select(c => new {
                            id = c.Id,
                            content = c.Content,
                            created = c.Created,
                            authorName = c.User.FullName,
                            authorUsername = c.User.UserName,
                            authorAvatar = c.User.Avatar
                        })
                })
                .ToListAsync();

            return Ok(posts);
        }
    }
}
