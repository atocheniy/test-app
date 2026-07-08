'use client'

import Post from "@/components/post";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { CommentsService } from "@/services/commentService";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PagePost() {

    const { currentPost, refreshCurrentPost, userData } = useApplication();
    
    const params = useParams();
    const idFromUrl = params.id as string;

    const { onlineUsers } = useApplication();
    
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (idFromUrl) refreshCurrentPost(idFromUrl);
        console.log(currentPost)
    }, [idFromUrl]);


    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsSubmitting(true);
        try {
            await CommentsService.createComment({
                content: commentText,
                postId: idFromUrl
            });

            setCommentText('');
            
            await refreshCurrentPost(idFromUrl);
        } catch (error) {
            console.error("Ошибка отправки комментария:", error);
            alert("Не удалось отправить комментарий");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentPost || !currentPost.id) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin" />
            </div>
        );
    }

    return(
        <div className="flex flex-col min-h-full justify-between">
            <div className="flex-1 flex flex-col">
                <div>
                    <Titlebar title={`Post from ${currentPost.authorName}`}></Titlebar>
                
                    <div className="flex flex-col lg:p-6 md:p-6 py-6">
                        <Post Id={idFromUrl} Name={currentPost.authorName} Avatar={currentPost.authorAvatar} Attachments={currentPost.attachments} UserName={`@${currentPost.authorUsername}`} Content={currentPost.content} Time={new Date(currentPost.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Likes={currentPost.likesCount} Comments={currentPost.commentsCount}></Post>
                    </div>

                    <div className="w-full border-t border-white/5"></div>
                </div>
                <div>
                    <Titlebar title={`Comments`}></Titlebar>

                    <div className="flex flex-col max-sm:mb-[60px] min-h-full gap-4 p-6 lg:px-11 md:px-11 overflow-y-auto  custom-scrollbar">
                        {currentPost.commentsList && currentPost.commentsList.length > 0 ? (
                            currentPost.commentsList.map((comment) => {
                                const isCommenterOnline = onlineUsers.some(
                                    (u) => u.toLowerCase() === comment.authorUsername.toLowerCase()
                                );

                                return(
                                <div key={comment.id} className="flex gap-3 text-sm p-4 rounded-2xl bg-zinc-950/50 border border-white/5">
                                    <div className="relative w-8 h-8 shrink-0">
                                        <Link href={`/profile/${comment.authorUsername.replace('@', '')}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                            {comment.authorAvatar && (
                                                <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                            )}

                                            
                                        </Link>
                                        {isCommenterOnline && (
                                                <span 
                                                    className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full" 
                                                    title="Online"
                                                />
                                            )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <Link href={`/profile/${comment.authorUsername.replace('@', '')}`} className="font-semibold text-zinc-100 hover:underline cursor-pointer">
                                                <span className="font-semibold text-zinc-100 text-xs">{comment.authorName}</span>
                                            </Link>
                                            <span className="text-zinc-500 text-[10px]">@{comment.authorUsername}</span>
                                            <span className="text-zinc-500 text-[10px]">·</span>
                                            <span className="text-zinc-500 text-[10px]">
                                                {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-300 leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-zinc-500 text-center py-6 select-none">
                                No comments yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

           <div className="mt-0 bg-black/60 backdrop-blur-sm sticky bottom-0 border-t border-white/5 p-3 flex flex-row items-center gap-4 px-6 relative z-1110">
                <div className="w-8 h-8 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                    {userData.avatar && (
                        <img src={userData.avatar} className="w-full h-full object-cover" alt="My Avatar" />
                    )}
                </div>

                <form onSubmit={handleSendComment} className="flex-1 flex flex-row items-center gap-3">
                    <textarea
                        rows={1}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 p-2.5 px-4 text-sm text-zinc-100 bg-zinc-950 border border-white/5 rounded-2xl focus:outline-none transition focus:ring-1 focus:ring-white/20 resize-none [field-sizing:content] min-h-[38px] max-h-[120px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendComment(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !commentText.trim()}
                        className="px-4 py-2 text-xs font-semibold bg-white text-stone-950 rounded-2xl hover:bg-stone-300 disabled:opacity-30 transition shrink-0"
                    >
                        {isSubmitting ? "..." : "Reply"}
                    </button>
                </form>
            </div>
        </div>
    )
}