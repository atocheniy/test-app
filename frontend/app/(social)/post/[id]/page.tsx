'use client'

import Post from "@/components/post";
import { PostSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import TitlebarBack from "@/components/titlebarBack";
import { useApplication } from "@/context/ApplicationContext";
import { CommentsService } from "@/services/commentService";
import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LinearBlur } from "progressive-blur";
import { useEffect, useState } from "react";

export default function PagePost() {

    const { currentPost, refreshCurrentPost, userData } = useApplication();
    
    const router = useRouter();
    const params = useParams();
    const idFromUrl = params.id as string;

    const { onlineUsers } = useApplication();
    
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

    
    const handleCopyComment = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedCommentId(id);
        setTimeout(() => {
            setCopiedCommentId(null);
            setActiveMenuCommentId(null);
        }, 1200);
    };

    const handleDeleteComment = async (commentId: string) => {
        setActiveMenuCommentId(null);
        if (!confirm("Удалить этот комментарий?")) return;
        try {
            await CommentsService.deleteComment(commentId);
            await refreshCurrentPost(idFromUrl);
        } catch (err) {
            console.error(err);
            alert("Не удалось удалить комментарий");
        }
    };

    const handleSaveEditComment = async (commentId: string) => {
        if (!editCommentText.trim()) return;
        try {
            await CommentsService.updateComment(commentId, editCommentText);
            setEditingCommentId(null);
            await refreshCurrentPost(idFromUrl);
        } catch (err) {
            console.error(err);
            alert("Не удалось обновить комментарий");
        }
    };

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

    const isPostLoading = !currentPost || currentPost.id !== idFromUrl;
    
    if (isPostLoading) {
        return (
            <div className="flex flex-col min-h-full">
                <TitlebarBack title="Post" />
                
                <div className="flex flex-col lg:p-6 md:p-6 py-6">
                    <PostSkeleton />
                </div>

                <div className="w-full border-t border-white/5" />
                <Titlebar title="Comments" />

                <div className="flex flex-col gap-4 p-6 lg:px-11 md:px-11">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-28 bg-white/5 rounded" />
                                <div className="h-3 w-full bg-white/5 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return(
        <div className="flex flex-col min-h-full justify-between animate-fade-in">
            <div className="flex-1 flex flex-col">
                <div>
                    <TitlebarBack title={`Post from ${currentPost.authorName}`} />
                        
                    <div className="flex flex-col lg:p-6 md:p-6 py-6">
                        <Post Id={idFromUrl} Name={currentPost.authorName} Avatar={currentPost.authorAvatar} Attachments={currentPost.attachments} UserName={`@${currentPost.authorUsername}`} Content={currentPost.content} Time={new Date(currentPost.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Likes={currentPost.likesCount} isLikedByMe={currentPost.isLikedByMe} Comments={currentPost.commentsCount} repostsCount={currentPost.repostsCount} repostOfPost={currentPost.repostOfPost}></Post>
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
                            const cleanUser = comment.authorUsername.replace('@', '').toLowerCase();
                            const isMyComment = userData?.userName?.toLowerCase() === cleanUser;

                            return (
                                <div key={comment.id} className="relative flex gap-3 text-sm p-4 rounded-2xl bg-white/[0.02] border border-white/5 group">
                                    <div className="relative w-8 h-8 shrink-0">
                                        <Link href={`/profile/${cleanUser}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                            {comment.authorAvatar ? (
                                                <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800" />
                                            )}
                                        </Link>
                                        {isCommenterOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#0a0a0a] rounded-full" title="Online" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-baseline gap-2">
                                                <Link href={`/profile/${cleanUser}`} className="font-semibold text-zinc-100 text-xs hover:underline cursor-pointer">
                                                    {comment.authorName}
                                                </Link>
                                                <span className="text-zinc-500 text-[10px]">@{cleanUser}</span>
                                                <span className="text-zinc-500 text-[10px]">·</span>
                                                <span className="text-zinc-500 text-[10px]">
                                                    {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMenuCommentId(activeMenuCommentId === comment.id ? null : comment.id)}
                                                    className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-full transition"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </button>

                                                {activeMenuCommentId === comment.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-zinc-900 border border-white/10 shadow-xl p-1 z-50">
                                                        <button
                                                            onClick={() => handleCopyComment(comment.content, comment.id)}
                                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                                                        >
                                                            {copiedCommentId === comment.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                                            <span>{copiedCommentId === comment.id ? "Скопировано" : "Копировать"}</span>
                                                        </button>

                                                        {isMyComment && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCommentId(comment.id);
                                                                        setEditCommentText(comment.content);
                                                                        setActiveMenuCommentId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                                                                >
                                                                    <Pencil size={12} />
                                                                    <span>Редактировать</span>
                                                                </button>
                                                                <div className="h-[1px] bg-white/5 my-1" />
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span>Удалить</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {editingCommentId === comment.id ? (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    value={editCommentText}
                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                    rows={2}
                                                    className="w-full p-2.5 text-xs text-zinc-100 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCommentId(null)}
                                                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
                                                    >
                                                        Отмена
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEditComment(comment.id)}
                                                        className="px-3 py-1 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                                    >
                                                        Сохранить
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-zinc-300 leading-relaxed mt-1">{comment.content}</p>
                                        )}
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

           <div className="sticky bottom-0 p-3 px-6 max-sm:bottom-7 flex flex-row items-center gap-4 relative z-1050">
                <LinearBlur
                    side="bottom"
                    steps={5}
                    strength={20}
                    falloffPercentage={100}
                    tint="rgba(2, 2, 2, 0.75)"
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 140,
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                />
                <div className="w-8 h-8 bg-zinc-700 rounded-full shrink-0 overflow-hidden relative z-10">
                    {userData.avatar && (
                        <img src={userData.avatar} className="w-full h-full object-cover" alt="My Avatar" />
                    )}
                </div>

                <form onSubmit={handleSendComment} className="flex-1 flex flex-row items-center gap-3 relative z-10">
                    <textarea
                        rows={1}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 p-2.5 px-4 text-sm text-zinc-100 bg-white/[0.02] border border-white/10 rounded-2xl focus:outline-none transition focus:ring-1 focus:ring-white/20 resize-none [field-sizing:content] min-h-[38px] max-h-[120px]"
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