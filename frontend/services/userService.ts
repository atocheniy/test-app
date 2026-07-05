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
    }
};
