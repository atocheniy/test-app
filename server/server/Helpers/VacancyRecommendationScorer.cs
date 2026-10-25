using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using server.DTOs;
using server.Models;

namespace server.Helpers;

public static class VacancyRecommendationScorer
{
    public class UserVacancyProfile
    {
        public string? UserId { get; set; }
        public HashSet<string> NormalizedTechnologies { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public string? Focus { get; set; }
        public string? Location { get; set; }
        public string? WorkStatus { get; set; }
        public SeniorityLevel EstimatedLevel { get; set; } = SeniorityLevel.Middle;
        public List<string> ExperiencePositions { get; set; } = new();
        public HashSet<Guid> WatchedCompanyIds { get; set; } = new();
    }

    public class ScoredVacancy
    {
        public Vacancy Vacancy { get; set; } = null!;
        public double Score { get; set; }
        public int MatchPercent { get; set; }
        public string? MatchReason { get; set; }
    }

    public static SeniorityLevel EstimateUserLevel(ApplicationUser user, IEnumerable<UserExperience>? experiences)
    {
        var exps = experiences?.ToList() ?? new List<UserExperience>();
        var text = (user.Focus ?? "") + " " + string.Join(" ", exps.Select(e => e.Position + " " + e.Description));
        text = text.ToLowerInvariant();

        if (text.Contains("lead") || text.Contains("principal") || text.Contains("head") || text.Contains("architect") || 
            text.Contains("руководитель") || text.Contains("тимлид") || text.Contains("архитектор"))
        {
            return SeniorityLevel.Lead;
        }

        if (text.Contains("senior") || text.Contains("сеньор") || text.Contains("ведущий") || exps.Count >= 3)
        {
            return SeniorityLevel.Senior;
        }

        if (text.Contains("junior") || text.Contains("джуниор") || text.Contains("младший") || 
            text.Contains("intern") || text.Contains("стажер") || (exps.Count == 0 && text.Contains("student")))
        {
            return SeniorityLevel.Junior;
        }

        return SeniorityLevel.Middle;
    }

    public static ScoredVacancy ScoreVacancy(Vacancy vacancy, UserVacancyProfile? profile, DateTime now)
    {
        double score = 10.0;
        var matchedTech = new List<string>();
        int matchPercent = 60;
        string? matchReason = null;

        var daysOld = Math.Max(0.0, (now - vacancy.Created).TotalDays);

        if (vacancy.Company?.IsVerified == true) score += 10.0;
        if (vacancy.Format == WorkFormat.Remote) score += 12.0;
        if (vacancy.SalaryFrom.HasValue || vacancy.SalaryTo.HasValue) score += 10.0;

        if (daysOld <= 7) score += 15.0;
        else if (daysOld <= 21) score += 8.0;
        else if (daysOld <= 45) score += 3.0;

        if (profile != null)
        {
            var vacStackNorm = vacancy.Stack?
                .Select(FeedRecommendationScorer.NormalizeTag)
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList() ?? new List<string>();

            if (vacStackNorm.Count > 0 && profile.NormalizedTechnologies.Count > 0)
            {
                foreach (var tech in vacStackNorm)
                {
                    if (profile.NormalizedTechnologies.Contains(tech) ||
                        profile.NormalizedTechnologies.Any(ut => ut.Contains(tech) || tech.Contains(ut)))
                    {
                        matchedTech.Add(tech);
                    }
                }

                if (matchedTech.Count > 0)
                {
                    score += matchedTech.Count * 25.0;
                    double ratio = matchedTech.Count / (double)vacStackNorm.Count;
                    if (ratio >= 0.5) score += 25.0;
                    if (ratio >= 0.9) score += 20.0;
                }
            }

            var titleLower = (vacancy.Title ?? string.Empty).ToLowerInvariant();
            var descLower = (vacancy.Description ?? string.Empty).ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(profile.Focus))
            {
                var focusClean = profile.Focus.Trim().ToLowerInvariant();
                var focusWords = focusClean.Split(new[] { ' ', '/', ',', '-' }, StringSplitOptions.RemoveEmptyEntries);

                bool focusMatched = focusWords.Any(w => w.Length >= 3 && titleLower.Contains(w));
                if (focusMatched)
                {
                    score += 35.0;
                    matchReason ??= $"Соответствует вашему фокусу: {profile.Focus}";
                }
                else if (focusWords.Any(w => w.Length >= 3 && descLower.Contains(w)))
                {
                    score += 15.0;
                }
            }

            int levelDiff = Math.Abs((int)vacancy.Level - (int)profile.EstimatedLevel);
            if (levelDiff == 0)
            {
                score += 25.0;
            }
            else if (levelDiff == 1)
            {
                score += 12.0;
            }
            else
            {
                score -= 5.0;
            }

            if (!string.IsNullOrWhiteSpace(profile.Location) && vacancy.Company?.Location != null)
            {
                if (vacancy.Company.Location.Contains(profile.Location, StringComparison.OrdinalIgnoreCase) ||
                    profile.Location.Contains(vacancy.Company.Location, StringComparison.OrdinalIgnoreCase))
                {
                    score += 20.0;
                    matchReason ??= $"Локация: {vacancy.Company.Location}";
                }
            }

            if (profile.WatchedCompanyIds.Contains(vacancy.CompanyId))
            {
                score += 40.0;
                matchReason ??= $"Компания из ваших подписок: {vacancy.Company?.Name ?? "Компания"}";
            }

            if (matchedTech.Count > 0)
            {
                var displayTech = matchedTech.Take(3).Select(t => char.ToUpper(t[0]) + t[1..]);
                matchReason ??= $"Стек: {string.Join(", ", displayTech)}";
            }

            if (vacancy.Format == WorkFormat.Remote && matchReason == null)
            {
                matchReason = "Подходит удаленный формат";
            }

            if (score >= 120.0)
            {
                matchPercent = Math.Min(99, 93 + (int)Math.Min(6, (score - 120) / 10));
            }
            else if (score >= 85.0)
            {
                matchPercent = Math.Min(92, 85 + (int)((score - 85) / 5));
            }
            else if (score >= 55.0)
            {
                matchPercent = Math.Min(84, 75 + (int)((score - 55) / 4));
            }
            else if (score >= 35.0)
            {
                matchPercent = Math.Min(74, 65 + (int)((score - 35) / 3));
            }
            else
            {
                matchPercent = Math.Max(50, 50 + (int)(score / 2));
            }
        }
        else
        {
            matchPercent = Math.Min(85, 60 + (int)(score / 3));
            matchReason = vacancy.Format == WorkFormat.Remote ? "Удаленная позиция" : null;
        }

        return new ScoredVacancy
        {
            Vacancy = vacancy,
            Score = score,
            MatchPercent = matchPercent,
            MatchReason = matchReason
        };
    }

    public static List<ScoredVacancy> RankVacancies(IEnumerable<Vacancy> vacancies, UserVacancyProfile? profile)
    {
        var now = DateTime.UtcNow;
        return vacancies
            .Select(v => ScoreVacancy(v, profile, now))
            .OrderByDescending(sv => sv.Score)
            .ThenByDescending(sv => sv.Vacancy.Created)
            .ToList();
    }
}
