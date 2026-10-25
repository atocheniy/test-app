import { $api } from "../api/axios";
import type { UpdateAvatar, UpdateBanner, UpdateBio, UpdateName, UpdateUserName, User } from "../types/auth";

export const UserService = {
    async getUser() {
        const response = await $api.get<User>('/auth/me');
        return response.data; 
    },

    async getOtherUser(username: string){
        const response = await $api.get<User>(`/auth/profile/${username}`);
        return response.data; 
    },

    async changeName(data: UpdateName){
        return $api.patch('/auth/updateName', data);
    },

    async changeUserName(data: UpdateUserName){
        return $api.patch('/auth/updateUserName', data);
    },

    async changeBio(data: UpdateBio){
        return $api.patch('/auth/updateBio', data);
    },

    async changeAvatar(data: UpdateAvatar) { 
        return await $api.patch('/auth/updateAvatar', data); 
    }, 

    async changeBanner(data: UpdateBanner) { 
        return await $api.patch('/auth/updateBanner', data); 
    }, 

    async deleteAccount() {
        return await $api.delete(`/auth/me`);
    },

    async changeDetails(data: { location?: string; workStatus?: string; focus?: string; technologies?: string[]; githubUrl?: string; telegramUrl?: string; vkUrl?: string; xUrl?: string; discordUrl?: string; websiteUrl?: string }) {
        return await $api.patch('/auth/updateDetails', data);
    },

    async changePassword(data: { oldPassword: string; newPassword: string }) {
        return await $api.post('/auth/changePassword', data);
    },

    async addProject(data: any) {
        const response = await $api.post('/ProfileDetails/projects', data);
        return response.data;
    },

    async updateProject(id: string, data: any) {
        const response = await $api.put(`/ProfileDetails/projects/${id}`, data);
        return response.data;
    },

    async deleteProject(id: string) {
        return await $api.delete(`/ProfileDetails/projects/${id}`);
    },

    async addExperience(data: any) {
        const response = await $api.post('/ProfileDetails/experiences', data);
        return response.data;
    },

    async updateExperience(id: string, data: any) {
        const response = await $api.put(`/ProfileDetails/experiences/${id}`, data);
        return response.data;
    },

    async deleteExperience(id: string) {
        return await $api.delete(`/ProfileDetails/experiences/${id}`);
    },

    async searchUsers(query: string) {
        const clean = query.replace('@', '').trim();
        if (!clean) return [];
        const response = await $api.get<User[]>(`/auth/search?query=${encodeURIComponent(clean)}`);
        return response.data;
    },

    async toggleWatchUser(username: string) {
        const clean = username.replace('@', '').trim();
        const response = await $api.post<{ isWatching: boolean; watchersCount: number; followers: number }>(`/auth/toggleWatchUser/${clean}`);
        return response.data;
    },

    async getRecommendedUsers(limit: number = 3) {
        const response = await $api.get<any[]>(`/auth/recommended?limit=${limit}`);
        return response.data;
    },

    async updateLanguage(language: 'ru' | 'en') {
        const response = await $api.patch<{ language: 'ru' | 'en' }>('/auth/updateLanguage', { language });
        return response.data;
    },
};
