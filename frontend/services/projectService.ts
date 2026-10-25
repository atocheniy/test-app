import { $api } from "@/api/axios";
import type { ProjectDetails, UserProject, CreateProjectData, UpdateProjectData, Post } from "@/types/auth";
import type { FeedResponse } from "./postService";

export const ProjectService = {
    async getProject(id: string): Promise<ProjectDetails> {
        const response = await $api.get<ProjectDetails>(`/Project/${id}`);
        return response.data;
    },

    async updateProject(id: string, data: UpdateProjectData): Promise<UserProject> {
        const response = await $api.put<UserProject>(`/Project/${id}`, data);
        return response.data;
    },

    async toggleStar(id: string): Promise<{ isStarred: boolean; starsCount: number }> {
        const response = await $api.post<{ isStarred: boolean; starsCount: number }>(`/Project/${id}/star`);
        return response.data;
    },

    async getProjectPosts(id: string, cursor?: string | null, limit: number = 15): Promise<FeedResponse> {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (limit) params.set("limit", limit.toString());
        const qs = params.toString();
        const url = qs ? `/Project/${id}/posts?${qs}` : `/Project/${id}/posts`;
        const response = await $api.get<FeedResponse>(url);
        return response.data;
    },

    async createProject(data: CreateProjectData): Promise<UserProject> {
        const response = await $api.post<UserProject>("/ProfileDetails/projects", data);
        return response.data;
    },

    async deleteProject(id: string): Promise<void> {
        await $api.delete(`/ProfileDetails/projects/${id}`);
    },
};
