'use client';
import { AuthService } from '@/services/authService';
import { CommentsService } from '@/services/commentService';
import { PostService } from '@/services/postService';
import { UserService } from '@/services/userService';
import { Post, User } from "@/types/auth";
import * as signalR from "@microsoft/signalr";
import Cookies from 'js-cookie';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
    setUserData: React.Dispatch<React.SetStateAction<User>>;
    UserNameNormalized: string;
    refreshUserData: () => Promise<void>;

    postsData: Post[];
    refreshPostsData: (filter?: string) => Promise<void>;
    hasMorePosts: boolean;
    isLoadingMorePosts: boolean;
    loadMorePosts: () => Promise<void>;

    currentPost: Post;
    currentPostError: 'locked' | 'not_found' | null;
    refreshCurrentPost: (id: string) => Promise<void>;

    commentsData: Comment[];
    refreshCommentsData: (id: string) => Promise<void>;

    userPostsData: Post[];
    refreshUserPostsData: () => Promise<void>;
    hasMoreUserPosts: boolean;
    isLoadingMoreUserPosts: boolean;
    loadMoreUserPosts: () => Promise<void>;

    otherUserPostsData: Post[];
    otherUserData: User;
    refreshOtherUserPostsData: (username: string) => Promise<void>;
    hasMoreOtherUserPosts: boolean;
    isLoadingMoreOtherUserPosts: boolean;
    loadMoreOtherUserPosts: (username?: string) => Promise<void>;
    refreshOtherUserData: (username: string) => Promise<void>;

    onlineUsers: string[];
    connection: signalR.HubConnection | null;

    repostTarget: RepostTarget | null;
    setRepostTarget: (target: RepostTarget | null) => void;

    logout: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
   
    const [userData, setUserData] = useState<User>({ id: '', fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [], focus: '', projects: [], experiences: [], showOnlineStatus: true, allowDirectMessages: true });
    const [UserNameNormalized, setUserNameNormalized] = useState<string>('');

    const [otherUserData, setOtherUserData] = useState<User>({ id: '', fullName: 'Загрузка...', userName: '...', email: '', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [], focus: '', projects: [], experiences: [], showOnlineStatus: true, allowDirectMessages: true });
    const [otherUserPostsData, setOtherUserPostsData] = useState<Post[]>([]);
    const [otherUserPostsCursor, setOtherUserPostsCursor] = useState<string | null>(null);
    const [hasMoreOtherUserPosts, setHasMoreOtherUserPosts] = useState<boolean>(true);
    const [isLoadingMoreOtherUserPosts, setIsLoadingMoreOtherUserPosts] = useState<boolean>(false);
    const [currentOtherUsername, setCurrentOtherUsername] = useState<string>('');
    const currentOtherUsernameRef = useRef<string>('');

    const [postsData, setPostsData] = useState<Post[]>([]);
    const [postsCursor, setPostsCursor] = useState<string | null>(null);
    const [hasMorePosts, setHasMorePosts] = useState<boolean>(true);
    const [isLoadingMorePosts, setIsLoadingMorePosts] = useState<boolean>(false);
    const [currentFeedFilter, setCurrentFeedFilter] = useState<string | undefined>(undefined);

    const [userPostsData, setUserPostsData] = useState<Post[]>([]);
    const [userPostsCursor, setUserPostsCursor] = useState<string | null>(null);
    const [hasMoreUserPosts, setHasMoreUserPosts] = useState<boolean>(true);
    const [isLoadingMoreUserPosts, setIsLoadingMoreUserPosts] = useState<boolean>(false);

    const [commentsData, setCommentsData] = useState<Comment[]>([]);

    const [currentPost, setCurrentPost] = useState<Post>({} as Post);
    const [currentPostError, setCurrentPostError] = useState<'locked' | 'not_found' | null>(null);

    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [repostTarget, setRepostTarget] = useState<RepostTarget | null>(null);

    const refreshCurrentPost = useCallback(async (id: string) => {
        try {
            setCurrentPostError(null);
            const data = await PostService.getPost(id);
            setCurrentPost(data);
        }
        catch (error: any) {
            console.error("Ошибка обновления данных", error);
            setCurrentPostError(error?.response?.status === 403 ? 'locked' : 'not_found');
            setCurrentPost({} as Post);
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
            setUserData({id: '', fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [], focus: '', projects: [], experiences: [] });
            setUserNameNormalized("...");
        }
    };

    const refreshPostsData = async (filter?: string) => {
        try {
            setCurrentFeedFilter(filter);
            const data = await PostService.getAllPosts(filter, null, 15);
            console.log("Данные постов от сервера:", data);
            setPostsData(data.items || []);
            setPostsCursor(data.nextCursor || null);
            setHasMorePosts(data.hasMore || false);
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setPostsData([]);
            setPostsCursor(null);
            setHasMorePosts(false);
        }
    };

    const loadMorePosts = async () => {
        if (!hasMorePosts || isLoadingMorePosts || !postsCursor) return;
        try {
            setIsLoadingMorePosts(true);
            const data = await PostService.getAllPosts(currentFeedFilter, postsCursor, 15);
            if (data.items && data.items.length > 0) {
                setPostsData(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newUnique = data.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newUnique];
                });
                setPostsCursor(data.nextCursor || null);
                setHasMorePosts(data.hasMore || false);
            } else {
                setHasMorePosts(false);
                setPostsCursor(null);
            }
        } catch (error) {
            console.error("Ошибка дозагрузки постов", error);
        } finally {
            setIsLoadingMorePosts(false);
        }
    };

    const refreshUserPostsData = async () => {
        try {
            const data = await PostService.getUserPosts(null, 15);
            console.log("Данные постов пользователя от сервера:", data);
            setUserPostsData(data.items || []);
            setUserPostsCursor(data.nextCursor || null);
            setHasMoreUserPosts(data.hasMore || false);
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setUserPostsData([]);
            setUserPostsCursor(null);
            setHasMoreUserPosts(false);
        }
    };

    const loadMoreUserPosts = async () => {
        if (!hasMoreUserPosts || isLoadingMoreUserPosts || !userPostsCursor) return;
        try {
            setIsLoadingMoreUserPosts(true);
            const data = await PostService.getUserPosts(userPostsCursor, 15);
            if (data.items && data.items.length > 0) {
                setUserPostsData(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newUnique = data.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newUnique];
                });
                setUserPostsCursor(data.nextCursor || null);
                setHasMoreUserPosts(data.hasMore || false);
            } else {
                setHasMoreUserPosts(false);
                setUserPostsCursor(null);
            }
        } catch (error) {
            console.error("Ошибка дозагрузки постов пользователя", error);
        } finally {
            setIsLoadingMoreUserPosts(false);
        }
    };

    const refreshOtherUserPostsData = async (username: string) => {
        try {
            setCurrentOtherUsername(username);
            currentOtherUsernameRef.current = username;
            const data = await PostService.getOtherUserPosts(username, null, 15);
            console.log("Данные постов другого пользователя от сервера:", data);
            setOtherUserPostsData(data.items || []);
            setOtherUserPostsCursor(data.nextCursor || null);
            setHasMoreOtherUserPosts(data.hasMore || false);
        } catch (error) {
            console.error("Ошибка обновления данных постов", error);
            setOtherUserPostsData([]);
            setOtherUserPostsCursor(null);
            setHasMoreOtherUserPosts(false);
        }
    };

    const loadMoreOtherUserPosts = async (username?: string) => {
        const targetUsername = username || currentOtherUsername;
        if (!hasMoreOtherUserPosts || isLoadingMoreOtherUserPosts || !otherUserPostsCursor || !targetUsername) return;
        try {
            setIsLoadingMoreOtherUserPosts(true);
            const data = await PostService.getOtherUserPosts(targetUsername, otherUserPostsCursor, 15);
            if (data.items && data.items.length > 0) {
                setOtherUserPostsData(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newUnique = data.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newUnique];
                });
                setOtherUserPostsCursor(data.nextCursor || null);
                setHasMoreOtherUserPosts(data.hasMore || false);
            } else {
                setHasMoreOtherUserPosts(false);
                setOtherUserPostsCursor(null);
            }
        } catch (error) {
            console.error("Ошибка дозагрузки постов другого пользователя", error);
        } finally {
            setIsLoadingMoreOtherUserPosts(false);
        }
    };

     const refreshOtherUserData = async (username: string) => {
        try {
            currentOtherUsernameRef.current = username;
            const data = await UserService.getOtherUser(username);
            console.log("Данные пользователя от сервера:", data);
            setOtherUserData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных пользователя", error);
            setOtherUserData({ id: '', fullName: 'Гость', email: 'Ошибка загрузки', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [], focus: '', projects: [], experiences: [] });
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
            setUserData({ id: '', fullName: 'Гость', email: '', userName: '...', bio_FirstLine: '', bio_SecondLine: '', avatar: "", banner: "", followers: 0, followings: 0, technologies: [], focus: '', projects: [], experiences: [] });
            setUserNameNormalized("...");
        }
    }, []);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token || !userData.userName || userData.userName === '...') return;

        const hubBaseUrl = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5223') + '/chathub';

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubBaseUrl, {
                accessTokenFactory: () => token,
                withCredentials: false,
                skipNegotiation: true,
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

            if (newPost.authorUsername?.toLowerCase() === userData.userName?.toLowerCase()) {
                setUserPostsData((prev) => {
                    if (prev.some((p) => p.id === newPost.id)) return prev;
                    return [newPost, ...prev];
                });
            }
        });

        newConnection.on("postDeleted", (data: { id: string }) => {
            console.log("Пост удален через SignalR:", data.id);

            setPostsData((prev) => prev.filter((p) => p.id !== data.id));
            setUserPostsData((prev) => prev.filter((p) => p.id !== data.id));
            setOtherUserPostsData((prev) => prev.filter((p) => p.id !== data.id));
            setCurrentPost((prev) => {
                if (prev && prev.id === data.id) {
                    setCurrentPostError('not_found');
                    return {} as Post;
                }
                return prev;
            });
        });

        newConnection.on("postUpdated", (data: { id: string; content: string; attachments?: string[] }) => {
            const updatePostInList = (postsList: Post[]) =>
                postsList.map((post) => {
                    const updatedRepost = post.repostOfPost && post.repostOfPost.id === data.id
                        ? { ...post.repostOfPost, content: data.content, attachments: data.attachments ?? post.repostOfPost.attachments }
                        : post.repostOfPost;

                    if (post.id === data.id) {
                        return {
                            ...post,
                            content: data.content,
                            attachments: data.attachments ?? post.attachments,
                            repostOfPost: updatedRepost
                        };
                    }

                    if (updatedRepost !== post.repostOfPost) {
                        return { ...post, repostOfPost: updatedRepost };
                    }

                    return post;
                });

            setPostsData((prev) => updatePostInList(prev));
            setUserPostsData((prev) => updatePostInList(prev));
            setOtherUserPostsData((prev) => updatePostInList(prev));

            setCurrentPost((prev) => {
                if (!prev || !prev.id) return prev;
                const updatedRepost = prev.repostOfPost && prev.repostOfPost.id === data.id
                    ? { ...prev.repostOfPost, content: data.content, attachments: data.attachments ?? prev.repostOfPost.attachments }
                    : prev.repostOfPost;

                if (prev.id === data.id) {
                    return {
                        ...prev,
                        content: data.content,
                        attachments: data.attachments ?? prev.attachments,
                        repostOfPost: updatedRepost
                    };
                }

                if (updatedRepost !== prev.repostOfPost) {
                    return { ...prev, repostOfPost: updatedRepost };
                }

                return prev;
            });
        });

        newConnection.on("postPinChanged", (data: { id: string; isPinned: boolean; communityId?: string | null; projectId?: string | null; userId?: string }) => {
            setCurrentPost((prev) => {
                if (prev && prev.id === data.id) {
                    return { ...prev, isPinned: data.isPinned };
                }
                return prev;
            });

            if (!data.communityId && !data.projectId) {
                const applyPin = (list: Post[]) => {
                    if (!list.some((p) => p.id === data.id)) return list;
                    const updated = list.map((p) => {
                        if (p.id === data.id) return { ...p, isPinned: data.isPinned };
                        if (data.isPinned && !p.community && !p.project) return { ...p, isPinned: false };
                        return p;
                    });
                    return [...updated].sort((a, b) => {
                        const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
                        if (pinDiff !== 0) return pinDiff;
                        return new Date(b.created).getTime() - new Date(a.created).getTime();
                    });
                };

                setUserPostsData((prev) => applyPin(prev));
                setOtherUserPostsData((prev) => applyPin(prev));
            }
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

        newConnection.on("commentUpdated", (data: { id: string; postId: string; content: string }) => {
            setCurrentPost((prev) => {
                if (prev && prev.id === data.postId && prev.commentsList) {
                    return {
                        ...prev,
                        commentsList: prev.commentsList.map((c) =>
                            c.id === data.id ? { ...c, content: data.content } : c
                        )
                    };
                }
                return prev;
            });

            const updateCommentInPosts = (postsList: Post[]) =>
                postsList.map((post) => {
                    if (post.id === data.postId && post.commentsList) {
                        return {
                            ...post,
                            commentsList: post.commentsList.map((c) =>
                                c.id === data.id ? { ...c, content: data.content } : c
                            )
                        };
                    }
                    return post;
                });

            setPostsData((prev) => updateCommentInPosts(prev));
            setUserPostsData((prev) => updateCommentInPosts(prev));
            setOtherUserPostsData((prev) => updateCommentInPosts(prev));
            setCommentsData((prev: any[]) =>
                prev.map((c: any) => (c.id === data.id ? { ...c, content: data.content } : c))
            );
        });

        newConnection.on("commentDeleted", (data: { id: string; postId: string; commentsCount: number; latestComments?: any[] }) => {
            setCurrentPost((prev) => {
                if (prev && prev.id === data.postId) {
                    return {
                        ...prev,
                        commentsCount: data.commentsCount,
                        commentsList: (prev.commentsList || []).filter((c) => c.id !== data.id)
                    };
                }
                return prev;
            });

            const removeCommentFromPosts = (postsList: Post[]) =>
                postsList.map((post) => {
                    if (post.id === data.postId) {
                        return {
                            ...post,
                            commentsCount: data.commentsCount,
                            commentsList: data.latestComments ?? (post.commentsList || []).filter((c) => c.id !== data.id)
                        };
                    }
                    return post;
                });

            setPostsData((prev) => removeCommentFromPosts(prev));
            setUserPostsData((prev) => removeCommentFromPosts(prev));
            setOtherUserPostsData((prev) => removeCommentFromPosts(prev));
            setCommentsData((prev: any[]) => prev.filter((c: any) => c.id !== data.id));
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

        newConnection.on("watchRequestsChanged", () => {
            refreshUserData();
        });

        newConnection.on("watchRequestResolved", (data: { username?: string; accepted?: boolean }) => {
            refreshUserData();
            if (data?.username && currentOtherUsernameRef.current?.toLowerCase() === data.username.toLowerCase()) {
                refreshOtherUserData(data.username);
                refreshOtherUserPostsData(data.username);
            }
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
        setUserData,
        UserNameNormalized,
        refreshUserData, 
        postsData,
        refreshPostsData,
        hasMorePosts,
        isLoadingMorePosts,
        loadMorePosts,
        currentPost,
        currentPostError,
        refreshCurrentPost,
        userPostsData,
        refreshUserPostsData,
        hasMoreUserPosts,
        isLoadingMoreUserPosts,
        loadMoreUserPosts,
        otherUserPostsData,
        otherUserData,
        refreshOtherUserPostsData,
        hasMoreOtherUserPosts,
        isLoadingMoreOtherUserPosts,
        loadMoreOtherUserPosts,
        refreshOtherUserData,
        commentsData,
        refreshCommentsData,
        onlineUsers,
        connection,
        repostTarget,
        setRepostTarget,
        logout 
    }), [userData, postsData, hasMorePosts, isLoadingMorePosts, userPostsData, hasMoreUserPosts, isLoadingMoreUserPosts, otherUserPostsData, hasMoreOtherUserPosts, isLoadingMoreOtherUserPosts, otherUserData, currentPost, currentPostError, commentsData, onlineUsers, connection, repostTarget]);

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