using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using server.Models;

namespace server.Helpers;

public static class FeedRecommendationScorer
{
    public class UserInterestProfile
    {
        public string? UserId { get; set; }
        public HashSet<string> NormalizedTechnologies { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public string? Focus { get; set; }
        public HashSet<Guid> WatchedCommunityIds { get; set; } = new();
        public HashSet<string> WatchedUserIds { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public HashSet<Guid> LikedPostIds { get; set; } = new();
    }

    public class ScoredPost
    {
        public Post Post { get; set; } = null!;
        public double Score { get; set; }
        public double RawEngagement { get; set; }
        public double TimeDecay { get; set; }
        public double AffinityMultiplier { get; set; } = 1.0;
        public string? RecommendationReason { get; set; }
    }

    public static string NormalizeTag(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var clean = input.Trim().ToLowerInvariant().TrimStart('#');

        return clean switch
        {
            "c#" or "csharp" => "csharp",
            "c++" or "cpp" => "cpp",
            ".net" or "dotnet" => "dotnet",
            "f#" or "fsharp" => "fsharp",
            "node" or "nodejs" or "node.js" => "nodejs",
            "next" or "nextjs" or "next.js" => "nextjs",
            "vue" or "vuejs" or "vue.js" => "vuejs",
            "postgres" or "postgresql" or "pgsql" => "postgresql",
            "tailwind" or "tailwindcss" => "tailwindcss",
            "ts" or "typescript" => "typescript",
            "js" or "javascript" => "javascript",
            "k8s" or "kube" or "kubernetes" => "kubernetes",
            "go" or "golang" => "golang",
            "py" or "python" => "python",
            "ml" or "machinelearning" or "machine-learning" => "ai",
            "llm" or "gpt" or "openai" or "claude" or "gemini" => "ai",
            _ => Regex.Replace(clean, @"[^a-z0-9а-я]", "")
        };
    }

    public static ScoredPost ScorePost(Post post, UserInterestProfile? profile, DateTime now)
    {
        double hoursOld = Math.Max(0.0, (now - post.Created).TotalHours);

        double engagement = 1.0 
            + (post.LikesCount * 2.5) 
            + (post.CommentsCount * 4.0) 
            + (post.RepostsCount * 5.0);

        if (post.Attachments != null && post.Attachments.Length > 0)
        {
            engagement *= 1.15;
        }

        double freshnessBoost = 0.0;
        if (hoursOld <= 2.0)
        {
            freshnessBoost = 6.0;
        }
        else if (hoursOld <= 6.0)
        {
            freshnessBoost = 3.5;
        }
        else if (hoursOld <= 24.0)
        {
            freshnessBoost = 1.5;
        }

        double timeDecay = 1.0 / Math.Pow((hoursOld / 18.0) + 1.0, 1.35);

        double affinityMultiplier = 1.0;
        string? reason = null;

        if (profile != null)
        {
            if (profile.NormalizedTechnologies.Count > 0)
            {
                var postTopics = TrendingTopicExtractor.ExtractTopicsFromPost(post);
                var extractedNormTags = postTopics
                    .Select(t => NormalizeTag(t.NormalizedTag))
                    .Where(t => !string.IsNullOrEmpty(t))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                int techMatches = 0;
                string? matchedTech = null;

                foreach (var userTech in profile.NormalizedTechnologies)
                {
                    if (extractedNormTags.Contains(userTech) ||
                        (!string.IsNullOrEmpty(post.Content) && Regex.IsMatch(post.Content, $@"\b{Regex.Escape(userTech)}\b", RegexOptions.IgnoreCase)))
                    {
                        techMatches++;
                        matchedTech ??= userTech;
                    }
                }

                if (techMatches >= 2)
                {
                    affinityMultiplier *= 1.8;
                    reason = $"#{matchedTech} (+{techMatches - 1})";
                }
                else if (techMatches == 1)
                {
                    affinityMultiplier *= 1.45;
                    reason = $"#{matchedTech}";
                }
            }

            if (post.CommunityId.HasValue && profile.WatchedCommunityIds.Contains(post.CommunityId.Value))
            {
                affinityMultiplier *= 1.4;
                reason ??= post.Community != null && !string.IsNullOrWhiteSpace(post.Community.Name)
                    ? $"Из сообщества {post.Community.Name}"
                    : "Отслеживаемое сообщество";
            }

            if (profile.WatchedUserIds.Contains(post.UserId))
            {
                affinityMultiplier *= 1.3;
                reason ??= "Автор, за которым вы следите";
            }

            if (post.ProjectId.HasValue)
            {
                reason ??= post.Project != null && !string.IsNullOrWhiteSpace(post.Project.Name)
                    ? $"Из проекта {post.Project.Name}"
                    : "Из проекта";
            }

            if (profile.LikedPostIds.Contains(post.Id))
            {
                affinityMultiplier *= 0.85;
            }

            if (!string.IsNullOrEmpty(profile.UserId) && post.UserId == profile.UserId)
            {
                affinityMultiplier *= 0.95;
            }
        }

        double totalScore = (engagement + freshnessBoost) * timeDecay * affinityMultiplier;

        return new ScoredPost
        {
            Post = post,
            Score = totalScore,
            RawEngagement = engagement,
            TimeDecay = timeDecay,
            AffinityMultiplier = affinityMultiplier,
            RecommendationReason = reason
        };
    }

    public static List<ScoredPost> ScoreAndRank(IEnumerable<Post> candidatePosts, UserInterestProfile? profile)
    {
        var now = DateTime.UtcNow;
        var initialScored = candidatePosts
            .Select(p => ScorePost(p, profile, now))
            .OrderByDescending(sp => sp.Score)
            .ThenByDescending(sp => sp.Post.Created)
            .ToList();

        var authorCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var diversified = new List<ScoredPost>(initialScored.Count);

        foreach (var sp in initialScored)
        {
            var author = sp.Post.UserId ?? string.Empty;
            authorCounts.TryGetValue(author, out int count);

            double penalty = count switch
            {
                0 => 1.0,
                1 => 0.75,
                2 => 0.50,
                _ => 0.25 
            };

            sp.Score *= penalty;
            authorCounts[author] = count + 1;
            diversified.Add(sp);
        }

        return diversified
            .OrderByDescending(sp => sp.Score)
            .ThenByDescending(sp => sp.Post.Created)
            .ToList();
    }
}
