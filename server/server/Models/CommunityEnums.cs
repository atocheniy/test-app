namespace server.Models;

public enum CommunityType
{
    Public = 0, 
    Restricted = 1,
    Private = 2
}

public enum CommunityPostingPolicy
{
    MembersOnly = 0,
    AdminsAndModerators = 1
}

public enum CommunityRole
{
    Member = 0,
    Moderator = 1,
    Admin = 2,
    Owner = 3
}

public enum MemberStatus
{
    Active = 0,
    Pending = 1,
    Banned = 2
}

public enum CommunityKind
{
    Community = 0,
    Company = 1
}

public enum WorkFormat
{
    Remote = 0,
    Hybrid = 1,
    Office = 2
}

public enum SeniorityLevel
{
    Intern = 0,
    Junior = 1,
    Middle = 2,
    Senior = 3,
    Lead = 4
}

public enum VacancyStatus
{
    Open = 0,
    Paused = 1,
    Closed = 2
}