'use client';

import { Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";
import Link from "next/link";

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGemoji from 'remark-gemoji';
import remarkBreaks from 'remark-breaks';
import { remarkAlert } from 'remark-github-blockquote-alert';
import dynamic from 'next/dynamic';

import { useApplication } from "@/context/ApplicationContext";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { useEffect, useRef, useState } from "react";

const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
);

interface PostProps {
    Id: string;
    Name: string;
    UserName: string;
    Content: string;
    Time: string;
    Avatar?: string;
    Likes: number;
    Comments: number;
    Attachments?: string[];

    commentsList?: {
        id: string;
        content: string;
        created: Date;
        authorName: string;
        authorUsername: string;
        authorAvatar: string;
    }[];
}

export default function Post ({ Id, Name, UserName, Content, Time, Avatar, Likes, Comments, Attachments, commentsList }: PostProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLongPost, setIsLongPost] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const { onlineUsers } = useApplication();
    const cleanUsername = UserName.replace('@', '');

    const isAuthorOnline = onlineUsers.some(
        (u) => u.toLowerCase() === cleanUsername.toLowerCase()
    );
    
    useEffect(() => {
        if (!contentRef.current) return;

        const checkHeight = () => {
            if (contentRef.current) {
                const realHeight = contentRef.current.scrollHeight;
                if (realHeight > 250) {
                    setIsLongPost(true);
                } else {
                    setIsLongPost(false);
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            checkHeight();
        });
        resizeObserver.observe(contentRef.current);

        checkHeight();
        
        return () => {
            resizeObserver.disconnect();
        };
    }, [Content]);

    return (
      <div className="py-4 border border-white/5 rounded-xl bg-zinc-950/50 text-zinc-100 px-4 mx-5">
        <div className="flex items-center space-x-3 mb-2">
            <div className="relative w-10 h-10 shrink-0">
                <Link href={`/profile/${UserName.replace('@', '')}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                    {Avatar && (
                        <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />
                    )}

                    
                </Link>
                {isAuthorOnline && (
                        <span 
                            className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full" 
                            title="Online"
                        />
                     )}
            </div>
            <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer">
                <Link href={`/profile/${UserName.replace('@', '')}`} className="font-semibold text-zinc-100 hover:underline cursor-pointer">
                    {Name}
                </Link>
            </span>
            <span className="text-zinc-500 text-sm">{UserName}</span>
            <span className="text-zinc-500 text-sm">·</span>
            <span className="text-zinc-500 text-sm">{Time}</span>
            </div>
        </div>
      
        <div className="pt-4 w-full">
            <div 
                ref={contentRef}
                className={`relative overflow-hidden transition-all duration-300 rounded-xl ${
                    isLongPost && !isExpanded ? "max-h-[200px]" : "max-h-none"
                }`}
            >
                <MarkdownPreview
                source={Content} 
                     style={{ 
                        backgroundColor: 'transparent',
                        color: 'inherit'      
                    }}
                    wrapperElement={{
                        "data-color-mode": "dark"  
                    }}
                    remarkPlugins={[
                        remarkGfm as any,    
                        remarkMath as any,    
                        remarkGemoji as any, 
                        remarkBreaks as any,  
                        remarkAlert as any,   
                    ]}
                    rehypePlugins={[
                        rehypeKatex as any,    
                        rehypeHighlight as any,
                        rehypeSlug as any,    
                        rehypeAutolinkHeadings as any, 
                        rehypeRaw as any     
                    ]}
                                />
            </div>

            {isLongPost && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-xs font-semibold text-white-500 hover:text-sky-400 transition-colors focus:outline-none"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}

            {Attachments && Attachments.length > 0 && (
               <div className="relative bg-black border border-white/5 rounded-xl mt-4 h-[400px] w-full flex items-center justify-center overflow-hidden">
                    <img 
                        src={Attachments[0]} 
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none select-none" 
                        alt="" 
                    />
                    <img 
                        src={Attachments[0]} 
                        className="relative w-full h-full object-contain z-10" 
                        alt="Post attachment" 
                    />
                </div>
            )}
            
            <div className="flex items-center gap-10 max-w-[280px] mt-4 text-zinc-500">
            <Link href={`/post/${Id}`}>
                <button className="flex items-center gap-2 hover:text-sky-500 transition-colors group">
                    <MessageCircle className="w-4 h-4 stroke-[1.8]" />
                        <span className="text-xs">
                            {Comments}
                        </span>
                </button>
            </Link>
            <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <Repeat2 className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">0</span>
            </button>
            <button className="flex items-center gap-2 hover:text-pink-500 transition-colors group">
                <Heart className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">{Likes}</span>
            </button>
            </div>
        </div>
      
            {commentsList && commentsList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.03] space-y-2.5">
                    {commentsList.map((comment) => {

                        const isCommenterOnline = onlineUsers.some(
                            (u) => u.toLowerCase() === comment.authorUsername.toLowerCase()
                        );

                        return(
                        <div key={comment.id} className="flex gap-2.5 text-xs p-2 rounded-xl bg-zinc-950 border border-white/[0.01]">
                            <div className="relative w-6 h-6 shrink-0">
                                <Link href={`/profile/${UserName.replace('@', '')}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                    {comment.authorAvatar && (
                                        <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Commenter" />
                                    )}

                                    
                                </Link>
                                {isCommenterOnline && (
                                        <span 
                                            className="absolute bottom-0 right-0 w-2 h-2 bg-white border-2 border-[#0a0a0a] rounded-full" 
                                            title="Online"
                                        />
                                )}
                            </div>

                            <div className="flex-1 space-y-0.5 text-left">
                                <div className="flex items-baseline gap-1.5">
                                    <Link href={`/profile/${comment.authorUsername}`} className="font-semibold text-zinc-200 hover:underline cursor-pointer">
                                        {comment.authorName}
                                    </Link>
                                    <span className="text-zinc-500 text-[9px]">@{comment.authorUsername}</span>
                                    <span className="text-zinc-500 text-[9px]">·</span>
                                    <span className="text-zinc-500 text-[9px]">
                                        {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                        )
                    })}
                </div>
            )}
      </div>
    )
}