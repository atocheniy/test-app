export interface LoginInfo {
    email: string;
    password: string;
}

export interface RegisterInfo {
    email: string;
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
}