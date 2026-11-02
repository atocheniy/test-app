import { useLanguage } from "@/context/LanguageContext";
import UserAvatar from "@/components/Avatar";
import { X } from "lucide-react";
import Link from "next/link";
import ProgressiveBlur from "@/components/ProgressiveBlur";

interface TitlebarMessageProps {
    Id: string;
    Name: string;
    UserName: string;
    Info: string;
    Avatar?: string | null;
    isOnline?: boolean;
    isTyping?: boolean;
    onClose?: () => void;
}

export default function TitlebarMessage({ Id, Name, UserName, Info, Avatar, isOnline, isTyping, onClose }: TitlebarMessageProps) 
{
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <div className="sticky top-0 shrink-0 z-50 flex items-center h-14 px-3 bg-transparent relative max-md:bg-black/90 light:bg-white/80 light:border-b light:border-zinc-200/80 light:shadow-sm light:backdrop-blur-md">
            <ProgressiveBlur
                className="max-md:hidden light:hidden"
                side="top"
                steps={6}
                strength={20}
                falloffPercentage={100}
                tint="rgba(2, 2, 2, 0.75)"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 70,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
            
            <div className="flex flex-row gap-4 items-center relative z-10">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="sm:hidden p-2 rounded-full border border-white/5 hover:bg-white/5 transition cursor-pointer text-zinc-400 hover:text-white light:border-zinc-200 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                        title={isRu ? "Закрыть" : t.common.close}
                    >
                        <X size={18} />
                    </button>
                )}
                <div className="relative w-10 h-10 shrink-0 rounded-full">
                    <Link href={`/profile/${UserName.replace('@', '')}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                        <UserAvatar src={Avatar} name={Name || UserName} className="w-full h-full text-xs" />
                    </Link>
                    {isOnline && (
                        <span 
                            className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full light:bg-emerald-500 light:border-white" 
                            title={isRu ? "В сети" : "Online"}
                        />
                    )}
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-zinc-100 light:text-zinc-900 leading-tight">{Name}</h1>
                    
                    {isTyping ? (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 light:text-blue-600 font-medium animate-pulse">
                            <span>{isRu ? "печатает" : "typing"}</span>
                            <span className="flex gap-0.5 items-center mt-1">
                                <span className="w-1 h-1 rounded-full bg-white light:bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 rounded-full bg-white light:bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 rounded-full bg-white light:bg-blue-600 animate-bounce"></span>
                            </span>
                        </div>
                    ) : (
                        <span className={`text-xs ${isOnline ? 'text-neutral-300 light:text-emerald-600 font-medium' : 'text-neutral-500 light:text-zinc-500'}`}>
                            {Info}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
