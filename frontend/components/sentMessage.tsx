import type { ReplyInfo } from "@/types/auth";
import { Check, CheckCheck, Copy, Edit, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
    Id: string;
    Content: string;
    Time: string;
    IsRead?: boolean;
    Attachments?: string[];
    ReplyTo?: ReplyInfo | null;
    AuthorName?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, content: string, attachments?: string[]) => void;
    onReply?: (message: { id: string; content: string; authorName: string }) => void;
}


export default function sentMessage ({ Id, Content, Time, IsRead = false, Attachments, ReplyTo,  AuthorName = "You", onDelete, onEdit, onReply }: Message) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
       <div className="flex flex-col self-end max-w-[75%] sm:max-w-md my-0.5 group">
            <div className="relative flex flex-col gap-1 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 transition rounded-2xl rounded-tr-sm border border-white/10 text-zinc-100 shadow-sm min-w-[100px]">
                
                {ReplyTo && (
                    <div className="flex flex-col text-xs border-l-2 border-sky-400 bg-black/25 hover:bg-black/40 transition px-2 py-1 rounded-r-lg mb-1 cursor-pointer">
                        <span className="font-semibold text-sky-400 text-[11px] truncate">
                            {ReplyTo.authorName}
                        </span>
                        <span className="text-zinc-400 text-[11px] truncate">
                            {ReplyTo.content || (ReplyTo.attachments?.length ? "📷 Вложение" : "Сообщение")}
                        </span>
                    </div>
                )}

                {Attachments && Attachments.length > 0 && (
                    <div className={`grid gap-1.5 mb-1 ${Attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {Attachments.map((url, index) => (
                            <img 
                                key={index} 
                                src={url} 
                                alt="Attachment" 
                                className="rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                onClick={() => window.open(url, '_blank')}
                            />
                        ))}
                    </div>
                )}

                <div className="flex items-end justify-between gap-3">
                    {Content && Content.trim().length > 0 && (
                        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap text-zinc-100">
                            {Content}
                        </p>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto shrink-0 pb-0.5 select-none relative" ref={menuRef}>
                        
                        <span className="text-[10px] text-zinc-400">
                            {Time}
                        </span>

                        {IsRead ? (
                            <CheckCheck size={14} className="text-sky-400" />
                        ) : (
                            <Check size={14} className="text-zinc-400" />
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen((prev) => !prev);
                            }}
                            className={`p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-all ${
                                isMenuOpen ? 'opacity-100 bg-white/10 text-zinc-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Actions"
                        >
                            <MoreVertical size={13} />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-1.5 w-32 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 z-50 flex flex-col text-xs text-zinc-300 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                                
                                {Content && (
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 hover:text-zinc-100 transition-colors text-left w-full"
                                    >
                                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        <span>{copied ? "Copied!" : "Copy"}</span>
                                    </button>
                                )}

                                {onEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onEdit(Id, Content, Attachments);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 hover:text-zinc-100  hover:text-red-300 transition-colors text-left w-full"
                                    >
                                        <Edit size={13} />
                                        <span>Edit</span>
                                    </button>
                                )}

                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onDelete(Id);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-left w-full"
                                    >
                                        <Trash2 size={13} />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    )
}