'use client';

import { $api } from "@/api/axios";
import Cookies from 'js-cookie';

import type { LoginInfo, RegisterInfo, AuthResponse } from "../types/auth"; 

export const AuthService = {
    async register(data: RegisterInfo) { return $api.post('/auth/register', data);},

    async login(data: LoginInfo) 
    {
        const response = await $api.post<AuthResponse>('/auth/login', data);
        
        if (response.data.token) Cookies.set('token', response.data.token, { expires: 30, secure: true, path: '/' });
        return response;
    },

    async logout() {Cookies.remove('token', { path: '/' });}
};