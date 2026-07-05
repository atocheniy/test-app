import { CreatePost, Post, UpdatePost } from "@/types/auth";
import { $api } from "../api/axios";

export const PostService = {
    async getPost(id: string) {
        const response = await $api.get<Post>(`/Post/getPost/${id}`);
        return response.data; 
    },

    async getUserPosts(){
        const response = await $api.get<Post[]>(`/Post/getUserPosts`);
        return response.data; 
    },

    async getOtherUserPosts(username: string){
        const response = await $api.get<Post[]>(`/Post/getOtherUserPosts/${username}`);
        return response.data; 
    },

    async getAllPosts(){
        const response = await $api.get<Post[]>(`/Post/getAllPosts`);
        return response.data; 
    },

    async createPost(data: CreatePost){
        return await $api.post<Post>("/Post/createPost", data);
    },

    async changePost(data: UpdatePost, id: string) { 
        return await $api.patch(`/Post/updatePost/${id}`, data); 
    }, 

    async deletePost(id: string) {
        return await $api.delete(`/Post/${id}`);
    }
};
