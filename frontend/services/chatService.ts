import type { ReplyInfo } from "@/types/auth";
import { $api } from "../api/axios";

export interface ChatItem {
    id: string;
    name: string;
    avatar: string | null;
    content: string | null;
    time: string;
    userName?: string;
}

export interface MessageItem {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    attachments?: string[];
    time: string;
    isMine: boolean;
    isRead?: boolean;
    replyTo?: ReplyInfo | null;
}

export const ChatService = {
    async getMyChats() {
        const response = await $api.get<ChatItem[]>('/Chat');
        return response.data;
    },

    async startChat(targetUserId: string) {
        const response = await $api.post<{ chatId: string }>(`/Chat/start/${targetUserId}`);
        return response.data;
    },

    async getMessages(chatId: string, page = 1) {
        const response = await $api.get<MessageItem[]>(`/Message/chat/${chatId}?page=${page}`);
        return response.data;
    },

    async sendMessage(chatId: string, content: string, attachments: string[] = [], replyToId?: string) {
        const response = await $api.post<MessageItem>('/Message', {
            chatId,
            content,
            attachments,
            replyToId
        });
        return response.data;
    },

    async updateMessage(id: string, chatId: string, content: string, attachments: string[] = []){
        const response = await $api.put<MessageItem>(`Message/${id}`, {
            chatId,
            content,
            attachments
        });
        return response.data;
    },

    async deleteMessage(messageId: string) {
        return await $api.delete(`/Message/${messageId}`);
    },

    async markAsRead(chatId: string) {
        return await $api.post(`/Message/read/${chatId}`);
    }
};