'use client'

import Post from "@/components/post";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { CommentsService } from "@/services/commentService";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PagePost() {

    const { currentPost, refreshCurrentPost, userData } = useApplication();
    
    const params = useParams();
    const idFromUrl = params.id as string;

    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (idFromUrl) refreshCurrentPost(idFromUrl);
        console.log(currentPost)
    }, [idFromUrl, refreshCurrentPost]);


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
        <div className="flex flex-col h-[calc(100vh-1.65rem)] justify-between">
            <div className="flex-1 flex flex-col">
                <Titlebar title={`Post from ${currentPost.authorName}`}></Titlebar>
            
                <div className="flex flex-col p-6">
                    <Post Id={idFromUrl} Name={currentPost.authorName} Avatar={currentPost.authorAvatar} Attachments={currentPost.attachments} UserName={`@${currentPost.authorUsername}`} Content={currentPost.content} Time={new Date(currentPost.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Likes={currentPost.likesCount} Comments={currentPost.commentsCount}></Post>
                </div>

                <div className="w-full border-t border-white/5"></div>

                <Titlebar title={`Comments`}></Titlebar>

                <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[380px] custom-scrollbar">
                    {currentPost.commentsList && currentPost.commentsList.length > 0 ? (
                        currentPost.commentsList.map((comment) => (
                            <div key={comment.id} className="flex gap-3 text-sm p-3 rounded-2xl bg-zinc-950/20 border border-white/[0.02]">
                                <div className="w-8 h-8 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                                    {comment.authorAvatar && (
                                        <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Commenter Avatar" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-zinc-100 text-xs">{comment.authorName}</span>
                                        <span className="text-zinc-500 text-[10px]">@{comment.authorUsername}</span>
                                        <span className="text-zinc-500 text-[10px]">·</span>
                                        <span className="text-zinc-500 text-[10px]">
                                            {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-zinc-500 text-center py-6 select-none">
                            No comments yet
                        </p>
                    )}
                </div>
            </div>

           <div className="mt-auto border-t border-white/5 p-4 flex flex-row items-center gap-4 px-6 relative z-10">
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