"use client";

import { Check, Code2, Copy, Heart, MessageCircle, MoreHorizontal, Pencil, Repeat2, Sparkles, Trash2 } from "lucide-react";
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
import { useLanguage } from "@/context/LanguageContext";

import { formatPostTime, isVideoUrl } from "@/libs/format";
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

  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
  } | null;

  project?: {
    id: string;
    name: string;
    imageUrl?: string;
    status?: number;
  } | null;

  recommendationReason?: string;
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
  community,
  project,
  recommendationReason
}: PostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongPost, setIsLongPost] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);

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
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
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
    if (!innerContentRef.current) return;

    const checkHeight = () => {
      if (innerContentRef.current) {
        const realHeight = innerContentRef.current.scrollHeight;
        setContentHeight(realHeight);
        setIsLongPost(realHeight > 250);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      checkHeight();
    });
    resizeObserver.observe(innerContentRef.current);

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
    if (!confirm(isRu ? "Вы уверены, что хотите удалить этот пост?" : "Are you sure you want to delete this post?")) return;

    try {
      await PostService.deletePost(Id);
      await refreshPostsData();
      if (refreshUserPostsData) await refreshUserPostsData();
    } catch (err) {
      console.error("Ошибка удаления поста:", err);
      alert(isRu ? "Не удалось удалить пост" : "Failed to delete post");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert(isRu ? "Пост не может быть пустым" : "Post cannot be empty");
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
      alert(isRu ? "Не удалось обновить пост" : "Failed to update post");
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
    if (!confirm(isRu ? "Удалить этот комментарий?" : "Delete this comment?")) return;
    try {
        await CommentsService.deleteComment(commentId);
        await refreshCurrentPost(Id);
        await refreshPostsData();
    } catch (err) {
        console.error(err);
        alert(isRu ? "Не удалось удалить комментарий" : "Failed to delete comment");
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
          alert(isRu ? "Не удалось обновить комментарий" : "Failed to update comment");
      }
  };

  return (
    <div className="py-4 border border-white/5 rounded-xl bg-white/[0.02] text-zinc-100 px-4 mx-2 min-w-0 overflow-hidden">
      {recommendationReason ? (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mb-2 pl-0.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{recommendationReason}</span>
        </div>
      ) : project ? (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mb-2 pl-0.5">
          <Code2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-500">{isRu ? "Из проекта" : "From project"}</span>
          <Link
            href={`/project/${project.id}`}
            className="text-zinc-200 hover:text-white font-medium hover:underline transition-colors truncate max-w-xs"
          >
            {project.name}
          </Link>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center space-x-3 mb-2 min-w-0 flex-1">
        <div className="relative w-10 h-10 shrink-0">
          <Link
            href={isMyPost ? '/profile' : `/profile/${cleanUsername}`}
            className="block w-full h-full rounded-full overflow-hidden cursor-pointer"
          >
            {Avatar && <img src={Avatar} className="w-full h-full object-cover" alt={isRu ? "Аватар" : "Avatar"} />}
          </Link>
          {isAuthorOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full"
              title={isRu ? "В сети" : "Online"}
            />
          )}
        </div>
        <div className="flex items-baseline space-x-2 flex-wrap gap-y-1 min-w-0">
          <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer truncate max-w-full">
            <Link
              href={isMyPost ? '/profile' : `/profile/${cleanUsername}`}
              className="font-semibold text-zinc-100 hover:underline cursor-pointer"
            >
              {Name}
            </Link>
          </span>
          <span className="text-zinc-500 text-sm truncate max-w-full">{UserName}</span>

          {community && (
            <>
              <span className="text-zinc-600 text-xs">{isRu ? 'в' : 'in'}</span>
              <Link 
                href={`/c/${community.slug}`}
                className="font-medium text-xs text-sky-400 hover:underline font-mono bg-sky-500/10 px-1.5 py-0.5 rounded truncate max-w-full"
              >
                c/{community.slug}
              </Link>
            </>
          )}

          {project && (
            <>
              <span className="text-zinc-600 text-xs">{isRu ? 'в' : 'in'}</span>
              <Link 
                href={`/project/${project.id}`}
                className="inline-flex items-center gap-1.5 font-medium text-xs text-zinc-200 hover:text-white hover:underline bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-md transition-colors max-w-full min-w-0"
              >
                {project.imageUrl ? (
                  <img src={project.imageUrl} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
                ) : (
                  <Code2 className="w-3 h-3 text-zinc-400 shrink-0" />
                )}
                <span className="truncate">p/{project.name}</span>
              </Link>
            </>
          )}

          <span className="text-zinc-500 text-sm">·</span>
          <span className="text-zinc-500 text-sm">{Time}</span>
        </div>
      </div>
      <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-full transition duration-150"
            title={isRu ? "Опции" : "Options"}
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
                <span>{isCopied ? t.post.linkCopied : t.post.copyLink}</span>
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
                    <span>{t.post.edit}</span>
                  </button>

                  <div className="h-[1px] bg-white/5 my-1" />

                  <button
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.post.delete}</span>
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
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-1.5 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isSavingEdit ? t.common.loading : t.common.save}
              </button>
            </div>
          </div>
        ) : (
        <div
          ref={contentRef}
          style={{
            maxHeight: isLongPost
              ? isExpanded
                ? `${contentHeight + 20}px`
                : "200px"
              : undefined,
          }}
          className="relative overflow-hidden transition-[max-height] duration-250 ease-out rounded-xl will-change-[max-height]"
        >
          <div ref={innerContentRef}>
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
          </div>

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
            <span>{isExpanded ? t.post.showLess : t.post.showMore}</span>
          </button>
        )}

        {Attachments && Attachments.length > 0 && (
          <div className="relative bg-black border border-white/5 rounded-xl mt-4 w-full flex items-center justify-center overflow-hidden">
            {isVideoUrl(Attachments[0]) ? (
              <video
                src={Attachments[0]}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[520px] object-contain rounded-xl bg-black"
              />
            ) : (
              <div className="relative w-full h-auto sm:h-[400px] flex items-center justify-center overflow-hidden">
                <img
                  src={Attachments[0]}
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none select-none"
                  alt=""
                />
                <img
                  src={Attachments[0]}
                  className="relative w-full h-full object-contain z-10"
                  alt={isRu ? "Вложение к посту" : "Post attachment"}
                />
              </div>
            )}
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
                  {repostOfPost.created ? formatPostTime(repostOfPost.created) : ""}
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
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName === 'VIDEO') return;
                  router.push(`/post/${repostOfPost.id}`);
                }} 
                className="block px-3.5 pb-3.5 cursor-pointer"
              >
                <div className="relative bg-black border border-white/5 rounded-xl mt-4 w-full flex items-center justify-center overflow-hidden">
                  {isVideoUrl(repostOfPost.attachments[0]) ? (
                    <video
                      src={repostOfPost.attachments[0]}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-[380px] object-contain rounded-xl bg-black"
                    />
                  ) : (
                    <div className="relative w-full h-auto sm:h-[350px] flex items-center justify-center overflow-hidden">
                      <img
                        src={repostOfPost.attachments[0]}
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none select-none"
                        alt={isRu ? "Вложение цитаты" : "Quote attachment"}
                      />
                      <img
                        src={repostOfPost.attachments[0]}
                        className="relative w-full h-full object-contain z-10"
                        alt={isRu ? "Вложение к посту" : "Post attachment"}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-8 sm:gap-10 w-[260px] sm:w-[280px] max-w-[calc(100vw-2rem)] mt-4 text-zinc-500">
          <Link href={`/post/${Id}`}>
            <button className="flex items-center gap-2 hover:text-sky-500 transition-colors group" title={t.post.comment}>
              <MessageCircle className="w-4 h-4 stroke-[1.8]" />
              <span className="text-xs">{Comments}</span>
            </button>
          </Link>
          <button 
            onClick={handleRepostClick}
            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
            title={t.post.repost}
          >
            <Repeat2 className="w-4 h-4 stroke-[1.8]" />
            <span className="text-xs">{repostsCount}</span>
          </button>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all duration-150 active:scale-90 group ${
              isLiked ? "text-pink-500" : "hover:text-pink-500"
            }`}
            title={t.post.like}
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
                    <Link href={isMyComment ? '/profile' : `/profile/${cleanCommentUser}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                        {comment.authorAvatar && (
                            <img src={comment.authorAvatar} className="w-full h-full object-cover" alt={isRu ? "Аватар" : "Avatar"} />
                        )}
                    </Link>
                    {isCommenterOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-[#0a0a0a] rounded-full" title={isRu ? "В сети" : "Online"} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                            <Link href={isMyComment ? '/profile' : `/profile/${cleanCommentUser}`} className="font-semibold text-zinc-100 text-xs hover:underline cursor-pointer truncate max-w-full">
                                {comment.authorName}
                            </Link>
                            <span className="text-zinc-500 text-[10px] truncate">@{cleanCommentUser}</span>
                            <span className="text-zinc-500 text-[10px]">·</span>
                            <span className="text-zinc-500 text-[10px]">
                                {formatPostTime(comment.created)}
                            </span>
                        </div>

                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveMenuCommentId(activeMenuCommentId === comment.id ? null : comment.id)}
                                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-full transition"
                                title={isRu ? "Опции" : "Options"}
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
                                        <span>{copiedCommentId === comment.id ? (isRu ? "Скопировано" : "Copied") : (isRu ? "Копировать" : "Copy")}</span>
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
                                                <span>{isRu ? "Редактировать" : t.post.edit}</span>
                                            </button>
                                            <div className="h-[1px] bg-white/5 my-1" />
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                            >
                                                <Trash2 size={12} />
                                                <span>{isRu ? "Удалить" : t.post.delete}</span>
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
                                    {isRu ? "Отмена" : t.common.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveEditComment(comment.id)}
                                    className="px-3 py-1 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition"
                                >
                                    {isRu ? "Сохранить" : t.common.save}
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
