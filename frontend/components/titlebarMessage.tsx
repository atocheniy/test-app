interface TitlebarMessageProps {
    Id: string;
    Name: string;
    UserName: string;
    Info: string;
    Avatar?: string;
    isOnline?: boolean;
    isTyping?: boolean;
    onClose?: () => void;
}

import { X } from "lucide-react";
import Link from "next/link";

export default function TitlebarMessage({ Id, Name, UserName, Info, Avatar, isOnline, isTyping, onClose }: TitlebarMessageProps) 
{
    return (
        <div className="sticky top-0 shrink-0 z-1000 flex items-center h-14 px-3 border-b border-white/5 bg-black/60 backdrop-blur-sm">
            <div className="flex flex-row gap-4 items-center">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="sm:hidden p-2 rounded-full border border-white/5 hover:bg-white/5 transition cursor-pointer text-zinc-400 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                )}
                <div className="relative w-10 h-10 shrink-0 rounded-full">
                    <Link href={`/profile/${UserName.replace('@', '')}`} className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                        {Avatar && (
                            <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />
                        )}

                        
                    </Link>
                    {isOnline && (
                        <span 
                            className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full" 
                            title="Online"
                        />
                    )}
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-zinc-100 leading-tight">{Name}</h1>
                    
                    {isTyping ? (
                        <div className="flex items-center gap-1.5 text-xs text-white-400 font-medium animate-pulse">
                            <span>печатает</span>
                            <span className="flex gap-0.5 items-center mt-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"></span>
                            </span>
                        </div>
                    ) : (
                        <span className={`text-xs ${isOnline ? 'text-white-400 font-medium' : 'text-zinc-500'}`}>
                            {Info}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}