'use client';
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { Post, User } from "@/types/auth";
import { UserService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import Cookies from 'js-cookie';
import { PostService } from '@/services/postService';
import { CommentsService } from '@/services/commentService';

interface ApplicationContextType {
    userData: User;
    UserNameNormalized: string;
    refreshUserData: () => Promise<void>;

    postsData: Post[];
    refreshPostsData: () => Promise<void>;

    currentPost: Post;
    refreshCurrentPost: (id: string) => Promise<void>;

    commentsData: Comment[];
    refreshCommentsData: (id: string) => Promise<void>;

    userPostsData: Post[];
    refreshUserPostsData: () => Promise<void>;

    otherUserPostsData: Post[];
    otherUserData: User;

    refreshOtherUserPostsData: (username: string) => Promise<void>;
    refreshOtherUserData: (username: string) => Promise<void>;

    logout: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
   
    const [userData, setUserData] = useState<User>({ fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
    const [UserNameNormalized, setUserNameNormalized] = useState<string>('');

    const [otherUserData, setOtherUserData] = useState<User>({ fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
    const [otherUserPostsData, setOtherUserPostsData] = useState<Post[]>([]);

    const [postsData, setPostsData] = useState<Post[]>([]);
    const [userPostsData, setUserPostsData] = useState<Post[]>([]);

    const [commentsData, setCommentsData] = useState<Comment[]>([]);

    const [currentPost, setCurrentPost] = useState<Post>({} as Post);

    const refreshCurrentPost = useCallback(async (id: string) => {
        try {
            const data = await PostService.getPost(id);
            setCurrentPost(data);
        }
        catch (error) {
            console.error("Ошибка обновления данных", error);
            setCurrentPost({} as Post)
        }
    }, []);

    const refreshCommentsData = async (id: string) => {
        try {
            const data = await CommentsService.getCommentsForPost(id);
            console.log("Данные комментариев от сервера:", data);
            setCommentsData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных комментариев", error);
            setCommentsData([]);
        }
    }

    const refreshUserData = async () => {
        try {
            const data = await UserService.getUser();
            console.log("Данные пользователя от сервера:", data);
            setUserData(data);

            setUserNameNormalized("@" + data.userName.toLowerCase());
            
        } catch (error) {
            console.error("Ошибка обновления данных пользователя", error);
            setUserData({ fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
            setUserNameNormalized("...");
        }
    };

    const refreshPostsData = async () => {
        try {
            const data = await PostService.getAllPosts();
            console.log("Данные постов от сервера:", data);
            setPostsData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setPostsData([]);
        }
    }

    const refreshUserPostsData = async () => {
        try {
            const data = await PostService.getUserPosts();
            console.log("Данные постов от сервера:", data);
            setUserPostsData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setUserPostsData([]);
        }
    }

    const refreshOtherUserPostsData = async (username: string) => {
        try {
            const data = await PostService.getOtherUserPosts(username);
            console.log("Данные постов от сервера:", data);
            setOtherUserPostsData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setOtherUserPostsData([]);
        }
    }

     const refreshOtherUserData = async (username: string) => {
        try {
            const data = await UserService.getOtherUser(username);
            console.log("Данные пользователя от сервера:", data);
            setOtherUserData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных пользователя", error);
            setOtherUserData({ fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
        }
    };

    useEffect(() => {
        const token = Cookies.get('token');
        if (token)
            { 
            refreshUserData();
            refreshPostsData();
            refreshUserPostsData();
        }
        else 
        {
            setUserData({ fullName: 'Гость', email: '', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
            setUserNameNormalized("...");
        }
    }, []);

    const logout = () => {
        setUserData({ 
            fullName: 'Загрузка...', 
            email: '', 
            userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: []
        });
        setUserNameNormalized("...");

        AuthService.logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
    };

    const contextValue = useMemo(() => ({ 
        userData, 
        UserNameNormalized,
        refreshUserData, 
        postsData,
        refreshPostsData,
        currentPost,
        refreshCurrentPost,
        userPostsData,
        refreshUserPostsData,
        otherUserPostsData,
        otherUserData,
        refreshOtherUserPostsData,
        refreshOtherUserData,
        commentsData,
        refreshCommentsData,
        logout 
    }), [userData, postsData, userPostsData, otherUserPostsData, otherUserData, currentPost]);

    return (
        <ApplicationContext.Provider value={ contextValue }>
            {children}
        </ApplicationContext.Provider>
    );
};

export const useApplication = () => {
    const context = useContext(ApplicationContext);
    if (!context) throw new Error("useApplication must be used within ApplicationProvider");
    return context;
};