'use client';
import { AuthService } from '@/services/authService';
import { CommentsService } from '@/services/commentService';
import { PostService } from '@/services/postService';
import { UserService } from '@/services/userService';
import { Post, User } from "@/types/auth";
import * as signalR from "@microsoft/signalr";
import Cookies from 'js-cookie';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface RepostTarget {
  id: string;
  content: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  attachments?: string[];
}

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

    onlineUsers: string[];
    connection: signalR.HubConnection | null;

    repostTarget: RepostTarget | null;
    setRepostTarget: (target: RepostTarget | null) => void;

    logout: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
   
    const [userData, setUserData] = useState<User>({ id: '', fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
    const [UserNameNormalized, setUserNameNormalized] = useState<string>('');

    const [otherUserData, setOtherUserData] = useState<User>({ id: '', fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
    const [otherUserPostsData, setOtherUserPostsData] = useState<Post[]>([]);

    const [postsData, setPostsData] = useState<Post[]>([]);
    const [userPostsData, setUserPostsData] = useState<Post[]>([]);

    const [commentsData, setCommentsData] = useState<Comment[]>([]);

    const [currentPost, setCurrentPost] = useState<Post>({} as Post);

    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [repostTarget, setRepostTarget] = useState<RepostTarget | null>(null);

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
            setUserData({id: '', fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
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
            setOtherUserData({ id: '', fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
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
            setUserData({ id: '', fullName: 'Гость', email: '', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [] });
            setUserNameNormalized("...");
        }
    }, []);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token || !userData.userName || userData.userName === '...') return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://atocheniy-test-app-api.hf.space/chathub", {
            //.withUrl("http://localhost:5223/chathub", {
                accessTokenFactory: () => token,
                // skipNegotiation: true, 
                transport: signalR.HttpTransportType.WebSockets 
            })
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(async () => {
                await newConnection.invoke("JoinSite", "global", userData.userName);
                setConnection(newConnection);
            })
            .catch(err => console.error("Ошибка подключения:", err));

        newConnection.on("postCreated", (newPost: Post) => {
            console.log("Опубликован новый пост:", newPost);
            
            setPostsData((prev) => {
                if (prev.some((p) => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
            });
        });

        newConnection.on("commentCreated", (newComment: any) => {
            console.log("Опубликован новый комментарий:", newComment);
            
            setCurrentPost((prev) => {
                if (prev && prev.id === newComment.postId) {
                    const commentsList = prev.commentsList || [];
                    
                    if (commentsList.some((c) => c.id === newComment.id)) return prev;

                    return {
                        ...prev,
                        commentsCount: prev.commentsCount + 1,
                        commentsList: [...commentsList, newComment]
                    };
                }
                return prev;
            });

            const updatePostsArray = (postsList: Post[]) => {
                return postsList.map((post) => {
                    if (post.id === newComment.postId) {
                        const commentsList = post.commentsList || [];
                        
                        if (commentsList.some((c) => c.id === newComment.id)) return post;
                        const updatedCommentsPreview = [newComment, ...commentsList].slice(0, 3);

                        return {
                            ...post,
                            commentsCount: post.commentsCount + 1,
                            commentsList: updatedCommentsPreview
                        };
                    }
                    return post;
                });
            };

            setPostsData((prev) => updatePostsArray(prev));
            setUserPostsData((prev) => updatePostsArray(prev));
            setOtherUserPostsData((prev) => updatePostsArray(prev));
        });

        newConnection.on("postLiked", (data: { postId: string; likesCount: number; userId: string; isLiked: boolean }) => {
            console.log("Лайк обновлен:", data);

            const updatePostsLikes = (postsList: Post[]) => {
                return postsList.map((post) => {
                    if (post.id === data.postId) {
                        const isMe = userData.id === data.userId;
                        return {
                            ...post,
                            likesCount: data.likesCount,
                            isLikedByMe: isMe ? data.isLiked : post.isLikedByMe
                        };
                    }
                    return post;
                });
            };

            setPostsData((prev) => updatePostsLikes(prev));
            setUserPostsData((prev) => updatePostsLikes(prev));
            setOtherUserPostsData((prev) => updatePostsLikes(prev));

            setCurrentPost((prev) => {
                if (prev && prev.id === data.postId) {
                    const isMe = userData.id === data.userId;
                    return {
                        ...prev,
                        likesCount: data.likesCount,
                        isLikedByMe: isMe ? data.isLiked : prev.isLikedByMe
                    };
                }
                return prev;
            });
        });

        newConnection.on("postReposted", (data: { postId: string; repostsCount: number }) => {
            console.log("Репост обновлен:", data);

            const updatePostsReposts = (postsList: Post[]) => {
                return postsList.map((post) => {
                    if (post.id === data.postId) {
                        return {
                            ...post,
                            repostsCount: data.repostsCount
                        };
                    }
                    return post;
                });
            };

            setPostsData((prev) => updatePostsReposts(prev));
            setUserPostsData((prev) => updatePostsReposts(prev));
            setOtherUserPostsData((prev) => updatePostsReposts(prev));

            setCurrentPost((prev) => {
                if (prev && prev.id === data.postId) {
                    return {
                        ...prev,
                        repostsCount: data.repostsCount
                    };
                }
                return prev;
            });
        });

        newConnection.on("userJoined", (data) => {
            setOnlineUsers(data.activeUsers);
        });

        newConnection.on("userLeft", (data) => {
            setOnlineUsers(data.activeUsers);
        });

        return () => {
            if (newConnection.state === signalR.HubConnectionState.Connected) {
                newConnection.invoke("LeaveRoom", "global")
                    .then(() => newConnection.stop())
                    .catch(err => console.error(err));
            }
        };
    }, [userData.userName]);

    const logout = () => {
        setUserData({ 
            id: '',
            fullName: 'Загрузка...', 
            email: '', 
            userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: []
        });
        setUserNameNormalized("...");
        setOnlineUsers([]);

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
        onlineUsers,
        connection,
        repostTarget,
        setRepostTarget,
        logout 
    }), [userData, postsData, userPostsData, otherUserPostsData, otherUserData, currentPost, commentsData, onlineUsers, connection, repostTarget]);

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