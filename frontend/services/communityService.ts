import { $api } from "@/api/axios";
import type { CreateCommunityData } from "@/types/auth";

export const CommunityService = {
    async createCommunity(data: CreateCommunityData) {
        const response = await $api.post<{ slug: string; message: string }>('/Community/create', data);
        return response.data;
    },

    async updateCommunity(slug: string, data: { 
        name?: string; 
        description?: string; 
        rules?: string; 
        avatar?: string; 
        banner?: string;
        type?: number;
        postingPolicy?: number;
        kind?: number | string;
        websiteUrl?: string;
        location?: string;
        industry?: string;
        companySize?: string;
    }) {
        const response = await $api.put(`/Community/update/${slug}`, data);
        return response.data;
    },

    async getCommunity(slug: string) {
        const response = await $api.get(`/Community/get/${slug}`);
        return response.data;
    },

    async toggleJoin(slug: string) {
        const response = await $api.post<{ isMember: boolean; membersCount: number }>(`/Community/toggleJoin/${slug}`);
        return response.data;
    },

    async toggleWatch(slug: string) {
        const response = await $api.post<{ isWatching: boolean; watchersCount: number }>(`/Community/toggleWatch/${slug}`);
        return response.data;
    },

    async getAll() {
        const response = await $api.get('/Community/all');
        return response.data;
    },

    async searchCommunities(query: string) {
        const clean = query.replace('c/', '').trim();
        if (!clean) return [];
        const response = await $api.get<any[]>(`/Community/search?query=${encodeURIComponent(clean)}`);
        return response.data;
    },

    async requestEmployee(slug: string) {
        const response = await $api.post<{ message: string }>(`/Community/${slug}/requestEmployee`);
        return response.data;
    },

    async acceptEmployee(slug: string, userId: string) {
        const response = await $api.post<{ message: string }>(`/Community/${slug}/acceptEmployee/${userId}`);
        return response.data;
    },

    async rejectEmployee(slug: string, userId: string) {
        const response = await $api.post<{ message: string }>(`/Community/${slug}/rejectEmployee/${userId}`);
        return response.data;
    },

    async getPendingEmployees(slug: string) {
        const response = await $api.get<any[]>(`/Community/${slug}/pendingEmployees`);
        return response.data;
    }
};