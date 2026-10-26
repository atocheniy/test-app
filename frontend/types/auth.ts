export interface LoginInfo {
    email: string;
    password: string;
}

export interface RegisterInfo {
    email: string;
    userName: string;
    password: string;
    fullName?: string;
}

export interface AuthResponse {
    token: string;
    message?: string; 
}

export interface User{
    id: string;
    email: string;
    fullName: string;
    userName: string;

    bio_FirstLine: string;
    bio_SecondLine: string;

    location?: string;
    workStatus?: string;
    githubUrl?: string;
    telegramUrl?: string;
    vkUrl?: string;
    xUrl?: string;
    discordUrl?: string;
    websiteUrl?: string;

    avatar: string;
    banner: string;

    followers: number;
    followings: number;
    watchersCount?: number;
    watchingCount?: number;
    isWatching?: boolean;
    
    technologies?: string[];
    focus?: string;
    preferredLanguage?: 'ru' | 'en';
    projects?: UserProject[];
    experiences?: UserExperience[];
}

export enum ProjectStatus {
    InDevelopment = 0,
    Beta = 1,
    Released = 2,
    Archived = 3,
}

export interface UserProject {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    bannerUrl?: string;
    images?: string[];
    githubUrl?: string;
    liveUrl?: string;
    technologies?: string[];
    status?: ProjectStatus;
    starsCount?: number;
    postsCount?: number;
    createdAt?: string;
}

export interface ProjectDetails extends UserProject {
    userId: string;
    authorName?: string;
    authorUsername?: string;
    authorAvatar?: string;
    isStarredByMe: boolean;
    isMyProject: boolean;
}

export interface CreateProjectData {
    name: string;
    description?: string;
    imageUrl?: string;
    bannerUrl?: string;
    images?: string[];
    githubUrl?: string;
    liveUrl?: string;
    technologies?: string[];
    status?: ProjectStatus;
}

export interface UpdateProjectData {
    name: string;
    description?: string;
    imageUrl?: string;
    bannerUrl?: string;
    images?: string[];
    githubUrl?: string;
    liveUrl?: string;
    technologies?: string[];
    status?: ProjectStatus;
}

export interface UserExperience {
    id: string;
    companyName: string;
    position: string;
    mode?: string;
    period: string;
    description?: string;
    createdAt?: string;
}

export interface CreateExperienceData {
    companyName: string;
    position: string;
    mode?: string;
    period: string;
    description?: string;
}

export interface Post{
    id: string;

    created: Date;
    content: string;
    attachments: string[];

    likesCount: number;
    isLikedByMe: boolean;
    commentsCount: number;
    repostsCount?: number;
    isPinned?: boolean;

    authorName: string;
    authorUsername: string;
    authorAvatar: string;

    commentsList?: {
        id: string;
        content: string;
        created: Date;
        authorName: string;
        authorUsername: string;
        authorAvatar: string;
    }[];

    repostOfPost?: RepostPreview | null;

    community?: {
        id: string;
        name: string;
        slug: string;
        avatar?: string;
    } | null;

    project?: {
        id: string;
        name: string;
        imageUrl?: string;
        status?: ProjectStatus;
    } | null;

    recommendationReason?: string;
}   

export interface Comment{
    id: string;

    created: Date;
    content: string;

    authorName: string;
    authorUsername: string;
    authorAvatar: string;
}   

export interface CreatePost{
    content: string;
    attachments: string[];
    repostOfPostId?: string;
    communityId?: string;
    projectId?: string;
    showInGeneralFeed?: boolean;
}

export interface CreateComment{
    content: string;
    postId: string;
}

export interface UpdatePost{
    content: string;
    attachments: string[];
}

export interface UpdateName{
    fullName: string;
}

export interface UpdateUserName{
    userName: string;
}

export interface UpdateEmail{
    email: string;
}

export interface UpdateBio{
    firstLine: string;
    secondLine: string;
}

export interface UpdateAvatar{
    avatar: string;
}

export interface UpdateBanner{
    banner: string;
}


export interface LikeResponse {
    isLiked: boolean;
    likesCount: number;
}

export interface ReplyInfo {
    id: string;
    content: string;
    authorName: string;
    attachments?: string[];
}

export interface RepostPreview {
  id: string;
  content: string;
  created: string | Date;
  attachments?: string[];
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
}

export interface CreateCommunityData {
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
    banner?: string;
    type?: number;
    postingPolicy?: number;
    kind?: number | string;
    websiteUrl?: string;
    location?: string;
    industry?: string;
    companySize?: string;
}

export enum CommunityKind {
    Community = 0,
    Company = 1
}

export const isCompanyEntity = (kind: any): boolean => {
    return kind === 1 || kind === '1' || kind === 'Company' || (typeof kind === 'string' && kind.toLowerCase() === 'company');
};

export enum WorkFormat {
    Remote = 0,
    Hybrid = 1,
    Office = 2
}

export enum SeniorityLevel {
    Intern = 0,
    Junior = 1,
    Middle = 2,
    Senior = 3,
    Lead = 4
}

export enum VacancyStatus {
    Open = 0,
    Paused = 1,
    Closed = 2
}

export interface Vacancy {
    id: string;
    companyId: string;
    companyName: string;
    companySlug: string;
    companyAvatar?: string;
    companyLocation?: string;
    isCompanyVerified?: boolean;
    title: string;
    description: string;
    salaryFrom?: number | null;
    salaryTo?: number | null;
    currency?: string;
    format: WorkFormat | number | string;
    level: SeniorityLevel | number | string;
    stack: string[];
    status: VacancyStatus | number | string;
    createdById: string;
    createdByName?: string;
    createdByUsername?: string;
    createdByAvatar?: string;
    created: string;
    matchPercent?: number;
    matchReason?: string;
    score?: number;
}

export interface CreateVacancyData {
    title: string;
    description: string;
    salaryFrom?: number | null;
    salaryTo?: number | null;
    currency?: string;
    format: number;
    level: number;
    stack: string[];
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    rules?: string;
    avatar?: string;
    banner?: string;
    type: number | string;
    postingPolicy: number | string;
    kind: number | string;
    websiteUrl?: string;
    location?: string;
    industry?: string;
    companySize?: string;
    isVerified?: boolean;
    vacanciesCount?: number;
    membersCount: number;
    watchersCount: number;
    postsCount: number;
    creatorName?: string;
    creatorUsername?: string;
    creatorAvatar?: string;
    membersList?: {
        id: string;
        name: string;
        username: string;
        avatar?: string;
        role: number | string;
    }[];
    pendingEmployees?: {
        id: string;
        name: string;
        username: string;
        avatar?: string;
        workStatus?: string;
        technologies?: string[];
    }[];
    isMember?: boolean;
    isWatching?: boolean;
    myRole?: number | null;
    myMemberStatus?: number | null;
}

