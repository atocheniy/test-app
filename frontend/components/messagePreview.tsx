interface MessagePreviewProps {
    Id: string;
    Name: string;
    UserName: string;
    Content: string;
    Time: string;
    Avatar?: string;
    Attachments?: string[];
    isOnline?: boolean;
}

export default function MessagePreview ({ Id, Name, UserName, Content, Time, Avatar, Attachments, isOnline }: MessagePreviewProps) {
    const previewText = Content?.trim() 
        ? Content.replace(/[\r\n]+/g, ' ')
        : (Attachments && Attachments.length > 0 ? "📷 Фотография" : "Нет сообщений");

    return(
        <div className="flex flex-row gap-4 p-3 hover:bg-white/5 transition cursor-pointer border-b border-white/5">
            <div className="relative w-13 h-13 shrink-0 rounded-full">
                {Avatar ? (
                    <img 
                        src={Avatar} 
                        alt={Name} 
                        className="w-full h-full rounded-full object-cover bg-zinc-800"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                        {Name?.charAt(0) || 'U'}
                    </div>
                )}
                {isOnline && (
                        <span 
                            className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-[#0a0a0a] rounded-full" 
                            title="Online"
                        />
                    )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-200 truncate">
                        {Name}
                    </p>
                    <span className="text-[11px] text-zinc-500 shrink-0 select-none">
                        {Time}
                    </span>
                </div>

                <p className="text-xs text-zinc-400 truncate leading-relaxed">
                    {previewText}
                </p>

            </div>
        </div>
    )
}