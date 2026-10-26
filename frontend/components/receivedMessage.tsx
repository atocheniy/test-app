import { useLanguage } from "@/context/LanguageContext";
import { isVideoUrl } from "@/libs/format";
import type { ReplyInfo } from "@/types/auth";
import { Check, Copy, MoreVertical, Reply } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
    Id: string;
    Content: string;
    Time: string;
    Attachments?: string[];
    ReplyTo?: ReplyInfo | null;
    AuthorName?: string;
    onReply?: (message: { id: string; content: string; authorName: string }) => void;
}


export default function receivedMessage ({ Id, Content, Time, Attachments, ReplyTo, AuthorName, onReply }: Message) {
    const { language } = useLanguage();
    const isRu = language === 'ru';
    const resolvedAuthorName = AuthorName || (isRu ? "Пользователь" : "User");

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('top');
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isMenuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPlacement(rect.top < 200 ? 'bottom' : 'top');
        }
        setIsMenuOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleCopy = () => {
        if (Content) {
            navigator.clipboard.writeText(Content);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setIsMenuOpen(false);
            }, 1200);
        }
    };

    return(
        <div className="flex flex-col self-start max-w-[75%] sm:max-w-md my-0.5 group">
            <div className="flex flex-col gap-1 px-3.5 py-2 bg-[#0a0a0a]/75 hover:bg-[#141414]/85 backdrop-blur-md transition rounded-2xl rounded-tl-sm border border-white/5 text-neutral-100 shadow-sm min-w-[85px]">
                
                {ReplyTo && (
                    <div className="flex flex-col text-xs border-l-2 border-white/40 bg-black/30 hover:bg-black/45 transition px-2 py-1 rounded-r-lg mb-1 cursor-pointer">
                        <span className="font-semibold text-neutral-200 text-[11px] truncate">
                            {ReplyTo.authorName}
                        </span>
                        <span className="text-neutral-400 text-[11px] truncate">
                            {ReplyTo.content || (ReplyTo.attachments?.length ? (isRu ? "📷 Вложение" : "📷 Attachment") : (isRu ? "Сообщение" : "Message"))}
                        </span>
                    </div>
                )}

                {Attachments && Attachments.length > 0 && (
                    <div className={`grid gap-1.5 mb-1 ${Attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {Attachments.map((url, index) => (
                            isVideoUrl(url) ? (
                                <video 
                                    key={index} 
                                    src={url} 
                                    controls 
                                    playsInline 
                                    className="rounded-xl max-h-60 w-full object-cover bg-black" 
                                />
                            ) : (
                                <img 
                                    key={index} 
                                    src={url} 
                                    alt={isRu ? "Вложение" : "Attachment"} 
                                    className="rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                    onClick={() => window.open(url, '_blank')}
                                />
                            )
                        ))}
                    </div>
                )}

                <div className="flex items-end justify-between gap-3">
                    {Content && Content.trim().length > 0 && (
                        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap text-neutral-300">
                            {Content}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto shrink-0 pb-0.5 select-none relative" ref={menuRef}>
                        <span className="text-[10px] text-neutral-500">
                            {Time}
                        </span>

                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleToggleMenu}
                            className={`p-0.5 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-all ${
                                isMenuOpen ? 'opacity-100 bg-white/10 text-neutral-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title={isRu ? "Действия" : "Actions"}
                        >
                            <MoreVertical size={13} />
                        </button>

                        {isMenuOpen && (
                            <div className={`absolute right-0 ${
                                menuPlacement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                            } w-32 bg-[#0a0a0a]/90 border border-white/10 rounded-xl shadow-2xl py-1 z-50 flex flex-col text-xs text-neutral-300 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100`}>
                                
                                {onReply && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onReply({ id: Id, content: Content || "", authorName: resolvedAuthorName });
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 hover:text-neutral-100 transition-colors text-left w-full"
                                    >
                                        <Reply size={13} />
                                        <span>{isRu ? "Ответить" : "Reply"}</span>
                                    </button>
                                )}

                                {Content && (
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 hover:text-neutral-100 transition-colors text-left w-full"
                                    >
                                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        <span>{copied ? (isRu ? "Скопировано!" : "Copied!") : (isRu ? "Копировать" : "Copy")}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
