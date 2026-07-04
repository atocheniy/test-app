import { $api } from "../api/axios";
import type { User } from "../types/auth";

export const UserService = {
    async getUser() {
        const response = await $api.get<User>('/auth/me');
        return response.data; 
    },

    async deleteAccount() {
        return await $api.delete(`/auth/me`);
    }
};
