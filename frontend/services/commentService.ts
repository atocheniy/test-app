import { CreateComment } from "@/types/auth";
import { $api } from "../api/axios";

export const CommentsService = {
    async getComment(id: string) {
        const response = await $api.get<Comment>(`/Comment/getComment/${id}`);
        return response.data; 
    },

    async getCommentsForPost(id: string){
        const response = await $api.get<Comment[]>(`/Comment/getAllCommentsToPost/${id}`);
        return response.data; 
    },

    async createComment(data: CreateComment){
        return await $api.post<Comment>("/Comment/createComment", data);
    },
};
