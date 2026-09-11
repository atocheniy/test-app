'use client'

import Post from "@/components/post";
import PublicBlock from "@/components/public_block";
import { PostSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useEffect, useState } from "react";

export default function Feed() {

    const { userData, postsData, refreshPostsData } = useApplication();
    const [isLoading, setIsLoading] = useState(postsData.length === 0);

    useEffect(() => {
        document.title = 'Feed';
        const load = async () => {
            if (postsData.length === 0) setIsLoading(true);
            await refreshPostsData();
            setIsLoading(false);
        };
        load();
    }, []);

    return (
        <div className="flex flex-col min-h-full">
           
            <Titlebar title="Feed"></Titlebar>
            <PublicBlock Avatar={userData.avatar}></PublicBlock>
            
            <div className="flex flex-col  max-sm:mb-[60px] gap-4 p-6 py-6 max-sm:p-0 max-sm:py-6" >
                {isLoading ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : (
                 postsData.map((p) => (
                        <div key={p.id} className="animate-fade-in">
                            <Post 
                                Id={p.id} 
                                Avatar={p.authorAvatar} 
                                Name={p.authorName} 
                                UserName={"@" + p.authorUsername} 
                                Content={p.content} 
                                Time={new Date(p.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  
                                Likes={p.likesCount} 
                                isLikedByMe={p.isLikedByMe} 
                                Comments={p.commentsCount} 
                                Attachments={p.attachments} 
                                commentsList={p.commentsList} 
                                repostsCount={p.repostsCount} 
                                repostOfPost={p.repostOfPost}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}