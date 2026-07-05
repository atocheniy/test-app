import { Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";
import Link from "next/link";

interface PostProps {
    Id: string;
    Name: string;
    UserName: string;
    Content: string;
    Time: string;
    Avatar?: string;
    Likes: number;
    Comments: number;
    Attachments?: string[];

    commentsList?: {
        id: string;
        content: string;
        created: Date;
        authorName: string;
        authorUsername: string;
        authorAvatar: string;
    }[];
}

export default function Post ({ Id, Name, UserName, Content, Time, Avatar, Likes, Comments, Attachments, commentsList }: PostProps) {
    return (
      <div className="py-4 border border-white/5 rounded-xl bg-[#0a0a0a] text-zinc-100 px-4 mx-5">
        <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                <Link href={`/profile/${UserName.replace('@', '')}`} className="w-10 h-10 rounded-full overflow-hidden cursor-pointer">
                    {Avatar && (
                        <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />
                    )}
                </Link>
            </div>
            <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer">
                <Link href={`/profile/${UserName.replace('@', '')}`} className="font-semibold text-zinc-100 hover:underline cursor-pointer">
                    {Name}
                </Link>
            </span>
            <span className="text-zinc-500 text-sm">{UserName}</span>
            <span className="text-zinc-500 text-sm">·</span>
            <span className="text-zinc-500 text-sm">{Time}</span>
            </div>
        </div>
      
        <div className="pl-13">
            <p className="text-[15px] text-zinc-300 leading-relaxed">
                {Content}
            </p>

            {Attachments && Attachments.length > 0 && (
               <div className="bg-zinc-950 border border-white/5 rounded-xl mt-4 h-[400px] w-full flex items-center justify-center overflow-hidden">
                    <img 
                        src={Attachments[0]} 
                        className="w-full h-full object-contain" 
                        alt="Post attachment" 
                    />
                </div>
            )}
            
            <div className="flex items-center gap-10 max-w-[280px] mt-4 text-zinc-500">
            <Link href={`/post/${Id}`}>
                <button className="flex items-center gap-2 hover:text-sky-500 transition-colors group">
                    <MessageCircle className="w-4 h-4 stroke-[1.8]" />
                        <span className="text-xs">
                            {Comments}
                        </span>
                </button>
            </Link>
            <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <Repeat2 className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">0</span>
            </button>
            <button className="flex items-center gap-2 hover:text-pink-500 transition-colors group">
                <Heart className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">{Likes}</span>
            </button>
            </div>
        </div>
      
            {commentsList && commentsList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.03] space-y-2.5">
                    {commentsList.map((comment) => (
                        <div key={comment.id} className="flex gap-2.5 text-xs p-2 rounded-xl bg-zinc-950 border border-white/[0.01]">
                            <Link href={`/profile/${comment.authorUsername}`} className="w-6 h-6 bg-zinc-700 rounded-full shrink-0 overflow-hidden cursor-pointer">
                                {comment.authorAvatar && (
                                    <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Commenter" />
                                )}
                            </Link>
                            <div className="flex-1 space-y-0.5 text-left">
                                <div className="flex items-baseline gap-1.5">
                                    <Link href={`/profile/${comment.authorUsername}`} className="font-semibold text-zinc-200 hover:underline cursor-pointer">
                                        {comment.authorName}
                                    </Link>
                                    <span className="text-zinc-500 text-[9px]">@{comment.authorUsername}</span>
                                    <span className="text-zinc-500 text-[9px]">·</span>
                                    <span className="text-zinc-500 text-[9px]">
                                        {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
      </div>
    )
}