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
    email: string;
    fullName: string;
    userName: string;

    bio_FirstLine: string;
    bio_SecondLine: string;

    avatar: string;
    banner: string;

    followers: number;
    followings: number;
    
    technologies?: string[];
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
