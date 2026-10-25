using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using server.DTOs;
using server.Models;

namespace server.Helpers;

public static class TrendingTopicExtractor
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
        "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
        "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
        "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
        "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
        "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
        "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
        "new", "want", "because", "any", "these", "give", "day", "most", "us", "yes", "true", "false",
        "here", "where", "why", "again", "before", "each", "more", "much", "very", "every", "both",

        "и", "в", "не", "на", "я", "что", "тот", "быть", "с", "он", "а", "весь", "это", "как", "она",
        "по", "но", "они", "к", "у", "ты", "из", "мы", "за", "вы", "же", "от", "сказать", "этот",
        "который", "из-за", "мочь", "человек", "о", "один", "еще", "бы", "такой", "только", "себя",
        "свое", "какой", "когда", "вот", "кто", "до", "не", "чтобы", "раз", "где", "там", "под", "можно",
        "ли", "если", "уже", "или", "ни", "сейчас", "чего", "привет", "всем", "день", "добрый", "почему",
        "спасибо", "пожалуйста", "вопрос", "очень", "просто", "тоже", "даже", "тут", "здесь", "куда",
        "зачем", "хотя", "вроде", "между", "после", "перед", "через", "около", "будет", "было", "есть"
    };

    private static readonly Regex HashtagRegex = new(@"#[a-zA-Zа-яА-Я0-9_]{2,35}", RegexOptions.Compiled);

    private static readonly Regex DotTechRegex = new(@"\b[A-Za-z0-9]+\.(?:js|ts|net|io|ai|py|rs|go|org|com)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SymbolTechRegex = new(@"(?:\bC#\b|\bC\+\+\b|\b\.NET\b|\bF#\b|\bAOT\b|\bJIT\b)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex CamelCaseRegex = new(@"\b[A-Z][a-z0-9]+[A-Z][a-zA-Z0-9]*\b", RegexOptions.Compiled);

    private static readonly Regex VersionedRegex = new(@"\b[A-Z][a-zA-Z0-9]{2,}\s+(?:v?[0-9]+(?:\.[0-9]+)*|\b[0-9]{2,4}\b)\b", RegexOptions.Compiled);

    private static readonly Regex AcronymRegex = new(@"\b[A-Z]{2,5}\b", RegexOptions.Compiled);

    public class ExtractedTopic
    {
        public string NormalizedTag { get; set; } = string.Empty; 
        public string DisplayTag { get; set; } = string.Empty; 
        public string Category { get; set; } = "Tech";
        public double BaseWeight { get; set; } = 1.0;
        public string Source { get; set; } = "nlp"; 
    }

    public static List<ExtractedTopic> ExtractTopicsFromPost(Post post)
    {
        var result = new Dictionary<string, ExtractedTopic>(StringComparer.OrdinalIgnoreCase);

        if (post.Community != null || post.CommunityId.HasValue)
        {
            var comm = post.Community;
            var commSlug = comm?.Slug ?? string.Empty;
            var commName = comm?.Name ?? commSlug;
            var commCategory = !string.IsNullOrWhiteSpace(comm?.Industry) ? comm.Industry : "Community";

            if (!string.IsNullOrWhiteSpace(commSlug))
            {
                var normKey = "#" + Regex.Replace(commSlug.ToLower(), @"[^a-z0-9_]", "");
                result[normKey] = new ExtractedTopic
                {
                    NormalizedTag = normKey,
                    DisplayTag = "#" + (string.IsNullOrWhiteSpace(commName) ? commSlug : commName.Replace(" ", "")),
                    Category = commCategory,
                    BaseWeight = 3.0,
                    Source = "community"
                };
            }
        }

        var content = post.Content;
        if (string.IsNullOrWhiteSpace(content))
        {
            return result.Values.ToList();
        }

        var hashtagMatches = HashtagRegex.Matches(content);
        foreach (Match match in hashtagMatches)
        {
            var raw = match.Value;
            var clean = raw.TrimStart('#');
            if (clean.Length >= 2 && !StopWords.Contains(clean))
            {
                var normKey = "#" + Regex.Replace(clean.ToLower(), @"[^a-z0-9а-я_]", "");
                if (normKey.Length > 1)
                {
                    result[normKey] = new ExtractedTopic
                    {
                        NormalizedTag = normKey,
                        DisplayTag = "#" + clean,
                        Category = InferCategory(clean),
                        BaseWeight = 3.5, 
                        Source = "hashtag"
                    };
                }
            }
        }

        var dotMatches = DotTechRegex.Matches(content);
        foreach (Match match in dotMatches)
        {
            var val = match.Value;
            var normKey = "#" + Regex.Replace(val.ToLower(), @"[^a-z0-9]", "");
            if (!result.ContainsKey(normKey))
            {
                result[normKey] = new ExtractedTopic
                {
                    NormalizedTag = normKey,
                    DisplayTag = "#" + val,
                    Category = InferCategory(val),
                    BaseWeight = 2.5,
                    Source = "nlp"
                };
            }
        }

        var symbolMatches = SymbolTechRegex.Matches(content);
        foreach (Match match in symbolMatches)
        {
            var val = match.Value;
            string normKey = val.ToLower() switch
            {
                "c#" => "#csharp",
                "c++" => "#cpp",
                ".net" => "#dotnet",
                "f#" => "#fsharp",
                _ => "#" + Regex.Replace(val.ToLower(), @"[^a-z0-9]", "")
            };

            if (!result.ContainsKey(normKey))
            {
                result[normKey] = new ExtractedTopic
                {
                    NormalizedTag = normKey,
                    DisplayTag = "#" + val.Replace(".", ""),
                    Category = InferCategory(val),
                    BaseWeight = 2.5,
                    Source = "nlp"
                };
            }
        }

        var versionedMatches = VersionedRegex.Matches(content);
        foreach (Match match in versionedMatches)
        {
            var val = match.Value;
            var parts = val.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && !StopWords.Contains(parts[0]))
            {
                var normKey = "#" + Regex.Replace((parts[0] + parts[1]).ToLower(), @"[^a-z0-9]", "");
                if (!result.ContainsKey(normKey))
                {
                    result[normKey] = new ExtractedTopic
                    {
                        NormalizedTag = normKey,
                        DisplayTag = "#" + parts[0] + parts[1],
                        Category = InferCategory(parts[0]),
                        BaseWeight = 2.8,
                        Source = "nlp"
                    };
                }
            }
        }

        var camelMatches = CamelCaseRegex.Matches(content);
        foreach (Match match in camelMatches)
        {
            var val = match.Value;
            if (val.Length >= 4 && !StopWords.Contains(val))
            {
                var normKey = "#" + val.ToLower();
                if (!result.ContainsKey(normKey))
                {
                    result[normKey] = new ExtractedTopic
                    {
                        NormalizedTag = normKey,
                        DisplayTag = "#" + val,
                        Category = InferCategory(val),
                        BaseWeight = 2.0,
                        Source = "nlp"
                    };
                }
            }
        }

        var acronymMatches = AcronymRegex.Matches(content);
        foreach (Match match in acronymMatches)
        {
            var val = match.Value;
            if (val.Length >= 3 && !StopWords.Contains(val))
            {
                var normKey = "#" + val.ToLower();
                if (!result.ContainsKey(normKey))
                {
                    result[normKey] = new ExtractedTopic
                    {
                        NormalizedTag = normKey,
                        DisplayTag = "#" + val,
                        Category = InferCategory(val),
                        BaseWeight = 1.8,
                        Source = "nlp"
                    };
                }
            }
        }

        return result.Values.ToList();
    }

    public static string InferCategory(string term)
    {
        var clean = term.ToLower();

        if (clean.Contains("react") || clean.Contains("next") || clean.Contains("vue") || 
            clean.Contains("angular") || clean.Contains("css") || clean.Contains("html") || 
            clean.Contains("svelte") || clean.Contains("tailwind") || clean.Contains("front") || 
            clean.Contains("js") || clean.Contains("ts") || clean.Contains("web"))
        {
            return "Frontend";
        }

        if (clean.Contains("net") || clean.Contains("c#") || clean.Contains("csharp") || 
            clean.Contains("node") || clean.Contains("java") || clean.Contains("spring") || 
            clean.Contains("python") || clean.Contains("django") || clean.Contains("fastapi") || 
            clean.Contains("go") || clean.Contains("rust") || clean.Contains("back") || 
            clean.Contains("api") || clean.Contains("grpc"))
        {
            return "Backend";
        }

        if (clean.Contains("sql") || clean.Contains("postgres") || clean.Contains("mongo") || 
            clean.Contains("redis") || clean.Contains("db") || clean.Contains("prisma") || 
            clean.Contains("database") || clean.Contains("clickhouse"))
        {
            return "Database";
        }

        if (clean.Contains("docker") || clean.Contains("k8s") || clean.Contains("kube") || 
            clean.Contains("linux") || clean.Contains("devops") || clean.Contains("cloud") || 
            clean.Contains("aws") || clean.Contains("azure") || clean.Contains("nginx") || 
            clean.Contains("ci") || clean.Contains("cd"))
        {
            return "DevOps";
        }

        if (clean.Contains("ai") || clean.Contains("llm") || clean.Contains("gpt") || 
            clean.Contains("claude") || clean.Contains("deepseek") || clean.Contains("ml") || 
            clean.Contains("neural") || clean.Contains("bot") || clean.Contains("openai") || 
            clean.Contains("gemini"))
        {
            return "AI & ML";
        }

        if (clean.Contains("flutter") || clean.Contains("swift") || clean.Contains("kotlin") || 
            clean.Contains("ios") || clean.Contains("android") || clean.Contains("mobile"))
        {
            return "Mobile";
        }

        if (clean.Contains("signalr") || clean.Contains("websocket") || clean.Contains("socket"))
        {
            return "Realtime";
        }

        if (clean.Contains("game") || clean.Contains("unity") || clean.Contains("unreal"))
        {
            return "GameDev";
        }

        return "Tech";
    }

    public static string FormatPostsCount(int count)
    {
        if (count >= 1_000_000)
            return $"{count / 1_000_000.0:0.#}M posts";
        if (count >= 1_000)
            return $"{count / 1_000.0:0.#}k posts";
        if (count == 1)
            return "1 post";
        return $"{count} posts";
    }
}
