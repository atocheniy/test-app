import { $api } from "@/api/axios";
import type { CreateVacancyData, Vacancy } from "@/types/auth";

export const VacancyService = {
    async getVacancies(params?: {
        search?: string;
        format?: number;
        level?: number;
        companySlug?: string;
        stack?: string;
        sort?: string;
        page?: number;
        pageSize?: number;
    }) {
        const query = new URLSearchParams();
        if (params?.search) query.append("search", params.search);
        if (params?.format !== undefined && params.format !== null) query.append("format", params.format.toString());
        if (params?.level !== undefined && params.level !== null) query.append("level", params.level.toString());
        if (params?.companySlug) query.append("companySlug", params.companySlug);
        if (params?.stack) query.append("stack", params.stack);
        if (params?.sort) query.append("sort", params.sort);
        if (params?.page) query.append("page", params.page.toString());
        if (params?.pageSize) query.append("pageSize", params.pageSize.toString());

        const response = await $api.get<{
            total: number;
            page: number;
            pageSize: number;
            items: Vacancy[];
        }>(`/Vacancy/list?${query.toString()}`);
        return response.data;
    },

    async getRecommended(limit: number = 5, skip: number = 0) {
        const response = await $api.get<Vacancy[]>(`/Vacancy/recommended?limit=${limit}&skip=${skip}`);
        return response.data;
    },

    async getVacancy(id: string) {
        const response = await $api.get<Vacancy>(`/Vacancy/${id}`);
        return response.data;
    },

    async createVacancy(companySlug: string, data: CreateVacancyData) {
        const response = await $api.post<{ id: string; message: string }>(`/Vacancy/create/${companySlug}`, data);
        return response.data;
    },

    async updateVacancy(id: string, data: Partial<CreateVacancyData> & { status?: number }) {
        const response = await $api.put<{ message: string }>(`/Vacancy/${id}`, data);
        return response.data;
    },

    async deleteVacancy(id: string) {
        const response = await $api.delete<{ message: string }>(`/Vacancy/${id}`);
        return response.data;
    },

    async apply(id: string) {
        const response = await $api.post<{ chatId: string; message: string }>(`/Vacancy/apply/${id}`);
        return response.data;
    }
};
