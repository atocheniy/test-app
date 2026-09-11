"use client";

import { Check, Copy, Heart, MessageCircle, MoreHorizontal, Pencil, Repeat2, Trash2 } from "lucide-react";
import Link from "next/link";

import dynamic from "next/dynamic";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";

import { useApplication } from "@/context/ApplicationContext";

import { CommentsService } from "@/services/commentService";
import { PostService } from "@/services/postService";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { useRouter } from "next/navigation";
import { LinearBlur } from "progressive-blur";
import { useEffect, useRef, useState } from "react";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

interface PostProps {
  Id: string;
  Name: string;
  UserName: string;
  Content: string;
  Time: string;
  Avatar?: string;
  Likes: number;
  isLikedByMe?: boolean;
  Comments: number;
  repostsCount?: number;
  Attachments?: string[];

  repostOfPost?: {
    id: string;
    content: string;
    created: string | Date;
    authorName: string;
    authorUsername: string;
    authorAvatar?: string;
    attachments?: string[];
  } | null;

  commentsList?: {
    id: string;
    content: string;
    created: Date;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
  }[];
}

export default function Post({
  Id,
  Name,
  UserName,
  Content,
  Time,
  Avatar,
  Likes,
  isLikedByMe = false,
  Comments,
  repostOfPost,
  repostsCount = 0,
  Attachments,
  commentsList,
}: PostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongPost, setIsLongPost] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likesCount, setLikesCount] = useState(Likes);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(Content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  const { onlineUsers, setRepostTarget, userData, refreshPostsData, refreshUserPostsData, refreshCurrentPost } = useApplication();
  const cleanUsername = UserName.replace("@", "");

  const isMyPost = userData?.userName && userData.userName.toLowerCase() === cleanUsername.toLowerCase();

  const handleRepostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRepostTarget({
      id: Id,
      content: Content,
      authorName: Name,
      authorUsername: cleanUsername,
      authorAvatar: Avatar,
      attachments: Attachments,
    });

    const createBlock = document.getElementById("create-post-block");
    if (createBlock) {
      createBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isAuthorOnline = onlineUsers.some((u) => u.toLowerCase() === cleanUsername.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setLikesCount(Likes);
    setIsLiked(isLikedByMe);
  }, [Likes, isLikedByMe]);

  useEffect(() => {
    if (!contentRef.current) return;

    const checkHeight = () => {
      if (contentRef.current) {
        const realHeight = contentRef.current.scrollHeight;
        setContentHeight(realHeight);
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

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(Content);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setIsMenuOpen(false);
      }, 1200);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };


  const handleDeletePost = async () => {
    setIsMenuOpen(false);
    if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

    try {
      await PostService.deletePost(Id);
      await refreshPostsData();
      if (refreshUserPostsData) await refreshUserPostsData();
    } catch (err) {
      console.error("Ошибка удаления поста:", err);
      alert("Не удалось удалить пост");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert("Пост не может быть пустым");
      return;
    }

    setIsSavingEdit(true);
    try {
      await PostService.changePost({
        content: editContent,
        attachments: Attachments || [],
      }, Id);
      setIsEditing(false);
      await refreshPostsData();
    } catch (err) {
      console.error("Ошибка обновления поста:", err);
      alert("Не удалось обновить пост");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoadingLike) return;

    const prevIsLiked = isLiked;
    const prevLikesCount = likesCount;

    setIsLiked(!prevIsLiked);
    setLikesCount((prev) => (prevIsLiked ? prev - 1 : prev + 1));
    setIsLoadingLike(true);

    try {
      const res = await PostService.likePost(Id);

      if (res) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch (error) {
      console.error("Like error:", error);

      setIsLiked(prevIsLiked);
      setLikesCount(prevLikesCount);
    } finally {
      setIsLoadingLike(false);
    }
  };

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
        await refreshCurrentPost(Id);
        await refreshPostsData();
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
          await refreshCurrentPost(Id);
          await refreshPostsData(); 
      } catch (err) {
          console.error(err);
          alert("Не удалось обновить комментарий");
      }
  };

  return (
    <div className="py-4 border border-white/5 rounded-xl bg-white/[0.02] text-zinc-100 px-4 mx-2">
      <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-3 mb-2">
        <div className="relative w-10 h-10 shrink-0">
          <Link
            href={`/profile/${UserName.replace("@", "")}`}
            className="block w-full h-full rounded-full overflow-hidden cursor-pointer"
          >
            {Avatar && <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />}
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
            <Link
              href={`/profile/${UserName.replace("@", "")}`}
              className="font-semibold text-zinc-100 hover:underline cursor-pointer"
            >
              {Name}
            </Link>
          </span>
          <span className="text-zinc-500 text-sm">{UserName}</span>
          <span className="text-zinc-500 text-sm">·</span>
          <span className="text-zinc-500 text-sm">{Time}</span>
        </div>
      </div>
      <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-full transition duration-150"
            title="Опции"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl p-1 z-50 backdrop-blur-xl">
              <button
                onClick={handleCopyText}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{isCopied ? "Скопировано" : "Копировать текст"}</span>
              </button>

              {isMyPost && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Редактировать</span>
                  </button>

                  <div className="h-[1px] bg-white/5 my-1" />

                  <button
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить пост</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 w-full">
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <textarea
              rows={10}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 text-sm text-zinc-100 bg-[#0a0a0a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(Content);
                }}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isSavingEdit ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        ) : (
        <div
          ref={contentRef}
          style={{
    maxHeight: isLongPost
      ? isExpanded
        ? `${contentHeight}px`
        : "200px"
      : undefined,
  }}
  className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out rounded-xl"
        >
          <MarkdownPreview
          className="post-markdown"
            source={Content}
            style={{
              backgroundColor: "transparent",
              color: "inherit",
            }}
            wrapperElement={{
              "data-color-mode": "dark",
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
              rehypeRaw as any,
            ]}
          />

          {isLongPost && !isExpanded && (
              <LinearBlur
                side="bottom"
                steps={5}
                strength={4}
                falloffPercentage={90}
                tint="rgba(5, 5, 5, 0.75)"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 180,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            )}
          </div>
        )}

        {isLongPost && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs font-semibold text-white-100/10 hover:text-sky-300 transition-colors focus:outline-none flex items-center gap-1"
          >
            <span>{isExpanded ? "Show less" : "Show more"}</span>
          </button>
        )}

        {Attachments && Attachments.length > 0 && (
          <div className="relative bg-black border border-white/5 rounded-xl mt-4 h-auto sm:h-[400px] w-full flex items-center justify-center overflow-hidden">
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

        {repostOfPost && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.005] hover:border-white/20 transition duration-200 overflow-hidden group/repost">
            <div 
              onClick={() => router.push(`/post/${repostOfPost.id}`)} 
              className="block p-3.5 pb-2 cursor-pointer"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                  {repostOfPost.authorAvatar ? (
                    <img src={repostOfPost.authorAvatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700" />
                  )}
                </div>
                <span className="font-semibold text-xs text-zinc-200 hover:underline">
                  {repostOfPost.authorName}
                </span>
                <span className="text-zinc-500 text-xs">@{repostOfPost.authorUsername.replace("@", "")}</span>
                <span className="text-zinc-500 text-xs">·</span>
                <span className="text-zinc-500 text-xs">
                  {repostOfPost.created
                    ? new Date(repostOfPost.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>

              {repostOfPost.content && (
                <div className="text-xs text-zinc-300 max-h-[100px] overflow-hidden relative pointer-events-none opacity-90">
                  <MarkdownPreview
                   className="post-markdown"
                    source={repostOfPost.content}
                    style={{ backgroundColor: "transparent", color: "inherit", fontSize: "12px" }}
                    wrapperElement={{ "data-color-mode": "dark" }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />
                </div>
              )}
            </div>

            {repostOfPost.attachments && repostOfPost.attachments.length > 0 && (
    
              <div 
                onClick={() => router.push(`/post/${repostOfPost.id}`)} 
                className="block px-3.5 pb-3.5 cursor-pointer"
              >
                <div className="relative bg-black border border-white/5 rounded-xl mt-4 h-auto sm:h-[400px] w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={repostOfPost.attachments[0]}
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none select-none"
                    alt="Quote attachment"
                  />
                  <img
                    src={repostOfPost.attachments[0]}
                    className="relative w-full h-full object-contain z-10"
                    alt="Post attachment"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-10 max-w-[280px] mt-4 text-zinc-500">
          <Link href={`/post/${Id}`}>
            <button className="flex items-center gap-2 hover:text-sky-500 transition-colors group">
              <MessageCircle className="w-4 h-4 stroke-[1.8]" />
              <span className="text-xs">{Comments}</span>
            </button>
          </Link>
          <button 
            onClick={handleRepostClick}
            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
            title="Репостнуть"
          >
            <Repeat2 className="w-4 h-4 stroke-[1.8]" />
            <span className="text-xs">{repostsCount}</span>
          </button>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all duration-150 active:scale-90 group ${
              isLiked ? "text-pink-500" : "hover:text-pink-500"
            }`}
          >
            <Heart
              className={`w-4 h-4 stroke-[1.8] transition-all duration-200 ${
                isLiked ? "fill-pink-500 text-pink-500 scale-110" : ""
              }`}
            />
            <span className="text-xs">{likesCount}</span>
          </button>
        </div>
      </div>

      {commentsList && commentsList.length > 0 && (
      <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2.5">
        {commentsList.map((comment) => {
          const isCommenterOnline = onlineUsers.some(
            (u) => u.toLowerCase() === comment.authorUsername.toLowerCase(),
          );
          const cleanCommentUser = comment.authorUsername.replace('@', '').toLowerCase();
          const isMyComment = userData?.userName?.toLowerCase() === cleanCommentUser;

          return (
            <div key={comment.id} className="relative flex gap-3 text-sm p-4 rounded-2xl bg-white/[0.01] border border-white/5 group">
                <div className="relative w-8 h-8 shrink-0">
                    <Link href={`/profile/${cleanCommentUser}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                        {comment.authorAvatar && (
                            <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Avatar" />
                        )}
                    </Link>
                    {isCommenterOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#0a0a0a] rounded-full" title="Online" />
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <Link href={`/profile/${cleanCommentUser}`} className="font-semibold text-zinc-100 text-xs hover:underline cursor-pointer">
                                {comment.authorName}
                            </Link>
                            <span className="text-zinc-500 text-[10px]">@{cleanCommentUser}</span>
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
        })}
      </div>
    )}
    </div>
  );
}
