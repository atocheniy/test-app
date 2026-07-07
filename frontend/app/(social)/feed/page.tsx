'use client'

import Post from "@/components/post";
import PublicBlock from "@/components/public_block";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useEffect } from "react";

export default function Feed() {

    const { userData, postsData } = useApplication();
    const { refreshUserData, refreshPostsData } = useApplication();
    
    useEffect(() => {
        refreshPostsData();
        document.title = 'Feed';
    }, []);

    return (
        <div className="flex flex-col min-h-full">
           
            <Titlebar title="Feed"></Titlebar>
            <PublicBlock Avatar={userData.avatar}></PublicBlock>
            
            <div className="flex flex-col  max-sm:mb-[60px] gap-4 p-6 py-6 max-sm:p-0 max-sm:py-6" >
                {postsData.map((p, index) => {
                    console.log(p);
                    return (
                         <Post key={index} Id={p.id} Avatar={p.authorAvatar} Name={p.authorName} UserName={"@" + p.authorUsername} Content={p.content} Time={new Date(p.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  Likes={p.likesCount} Comments={p.commentsCount} Attachments={p.attachments} commentsList={p.commentsList} />
                    );
                })}
            </div>
        </div>
    )
}