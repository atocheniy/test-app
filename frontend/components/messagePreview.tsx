'use client';

import { useLanguage } from "@/context/LanguageContext";
import { Eraser, MoreVertical, Pin, PinOff, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessagePreviewProps {
    Id: string;
    Name: string;
    UserName: string;
    Content: string;
    Time: string;
    Avatar?: string;
    Attachments?: string[];
    isOnline?: boolean;
    isPinned?: boolean;
    onOpenProfile?: () => void;
    onTogglePin?: () => void;
    onClearChat?: () => void;
    onDeleteChat?: () => void;
}

export default function MessagePreview({
    Id,
    Name,
    UserName,
    Content,
    Time,
    Avatar,
    Attachments,
    isOnline,
    isPinned,
    onOpenProfile,
    onTogglePin,
    onClearChat,
    onDeleteChat,
}: MessagePreviewProps) {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const previewText = Content?.trim()
        ? Content.replace(/[\r\n]+/g, " ")
        : Attachments && Attachments.length > 0
        ? (isRu ? "📷 Фотография" : "📷 Photo")
        : (isRu ? "Нет сообщений" : "No messages");

    return (
        <div className="group relative flex flex-row gap-3.5 p-3 hover:bg-white/5 transition cursor-pointer border-b border-white/5">
            <div className="relative w-12 h-12 shrink-0 rounded-full">
                {Avatar ? (
                    <img
                        src={Avatar}
                        alt={Name}
                        className="w-full h-full rounded-full object-cover bg-neutral-800"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-400">
                        {Name?.charAt(0) || "U"}
                    </div>
                )}
                {isOnline && (
                    <span
                        className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full"
                        title={isRu ? "В сети" : "Online"}
                    />
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-200 truncate">
                        {Name}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {isPinned && (
                            <Pin size={12} className="text-neutral-400 shrink-0 fill-neutral-400/20 rotate-45" />
                        )}
                        <span className="text-[11px] text-neutral-500 shrink-0 select-none">
                            {Time}
                        </span>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen((prev) => !prev);
                                }}
                                className="p-1 -mr-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors opacity-70 group-hover:opacity-100"
                                title={isRu ? "Действия" : "Actions"}
                            >
                                <MoreVertical size={14} />
                            </button>

                            {isMenuOpen && (
                                <div
                                    ref={menuRef}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1.5 w-48 bg-[#0a0a0a]/90 border border-white/10 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-xs font-medium"
                                >
                                    {onOpenProfile && UserName && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onOpenProfile();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                        >
                                            <User size={14} className="text-zinc-400" />
                                            <span>{isRu ? "Открыть профиль" : t.settings.viewProfile}</span>
                                        </button>
                                    )}

                                    {onTogglePin && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onTogglePin();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                        >
                                            {isPinned ? (
                                                <>
                                                    <PinOff size={14} className="text-zinc-400" />
                                                    <span>{isRu ? "Открепить чат" : "Unpin chat"}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Pin size={14} className="text-zinc-400" />
                                                    <span>{isRu ? "Закрепить чат" : "Pin chat"}</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {onClearChat && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onClearChat();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                        >
                                            <Eraser size={14} className="text-zinc-400" />
                                            <span>{isRu ? "Очистить переписку" : "Clear chat"}</span>
                                        </button>
                                    )}

                                    {onDeleteChat && (
                                        <>
                                            <div className="border-t border-white/5 my-1" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    onDeleteChat();
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                            >
                                                <Trash2 size={14} className="text-red-400" />
                                                <span>{isRu ? "Удалить чат" : "Delete chat"}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-zinc-400 truncate leading-relaxed">
                    {previewText}
                </p>
            </div>
        </div>
    );
}