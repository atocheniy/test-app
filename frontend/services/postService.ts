import { CreatePost, Post, UpdatePost, type LikeResponse } from "@/types/auth";
import { $api } from "../api/axios";

export interface FeedResponse {
    items: Post[];
    nextCursor: string | null;
    hasMore: boolean;
}

export const PostService = {
    async getPost(id: string) {
        const response = await $api.get<Post>(`/Post/getPost/${id}`);
        return response.data; 
    },

    async getUserPosts(cursor?: string | null, limit: number = 15): Promise<FeedResponse> {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (limit) params.set('limit', limit.toString());
        const qs = params.toString();
        const url = qs ? `/Post/getUserPosts?${qs}` : `/Post/getUserPosts`;
        const response = await $api.get<any>(url);
        if (Array.isArray(response.data)) {
            return { items: response.data, nextCursor: null, hasMore: false };
        }
        return response.data; 
    },

    async likePost(id: string){
        const response = await $api.post<LikeResponse>(`/Post/likePost/${id}`);
        return response.data; 
    },

    async getOtherUserPosts(username: string, cursor?: string | null, limit: number = 15): Promise<FeedResponse> {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (limit) params.set('limit', limit.toString());
        const qs = params.toString();
        const url = qs ? `/Post/getOtherUserPosts/${encodeURIComponent(username)}?${qs}` : `/Post/getOtherUserPosts/${encodeURIComponent(username)}`;
        const response = await $api.get<any>(url);
        if (Array.isArray(response.data)) {
            return { items: response.data, nextCursor: null, hasMore: false };
        }
        return response.data; 
    },

    async getAllPosts(filter?: string, cursor?: string | null, limit: number = 15): Promise<FeedResponse> {
        const params = new URLSearchParams();
        if (filter) params.set('filter', filter);
        if (cursor) params.set('cursor', cursor);
        if (limit) params.set('limit', limit.toString());
        const qs = params.toString();
        const url = qs ? `/Post/getAllPosts?${qs}` : `/Post/getAllPosts`;
        const response = await $api.get<any>(url);
        if (Array.isArray(response.data)) {
            return { items: response.data, nextCursor: null, hasMore: false };
        }
        return response.data; 
    },

    async createPost(data: CreatePost){
        return await $api.post<Post>("/Post/createPost", data);
    },

    async changePost(data: UpdatePost, id: string) { 
        return await $api.put(`/Post/updatePost/${id}`, data); 
    }, 

    async deletePost(id: string) {
        return await $api.delete(`/Post/${id}`);
    },

    async getCommunityPosts(slug: string, cursor?: string | null, limit: number = 15): Promise<FeedResponse> {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (limit) params.set('limit', limit.toString());
        const qs = params.toString();
        const url = qs ? `/Post/getCommunityPosts/${encodeURIComponent(slug)}?${qs}` : `/Post/getCommunityPosts/${encodeURIComponent(slug)}`;
        const response = await $api.get<any>(url);
        if (Array.isArray(response.data)) {
            return { items: response.data, nextCursor: null, hasMore: false };
        }
        return response.data;
    },

    async searchPosts(query: string) {
        const clean = query.trim();
        if (!clean) return [];
        const response = await $api.get<Post[]>(`/Post/search?query=${encodeURIComponent(clean)}`);
        return response.data;
    },

    async getTrendingTopics(limit: number = 4) {
        const response = await $api.get<any[]>(`/Post/trending?limit=${limit}`);
        return response.data;
    },
};
