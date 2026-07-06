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
    }, []);

    return (
        <div className="flex flex-col min-h-full">
           
            <Titlebar title="Feed"></Titlebar>
            <PublicBlock Avatar={userData.avatar}></PublicBlock>
            
            <div className="flex flex-col gap-4 lg:p-6 md:p-6" >
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