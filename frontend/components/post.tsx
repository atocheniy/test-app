import { Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";

interface PostProps {
    Name: string;
    UserName: string;
    Content: string;
    Time: string;
    Avatar?: string;
}

export default function Post ({ Name, UserName, Content, Time, Avatar }: PostProps) {
    return (
      <div className="py-4 border border-white/5 rounded-xl bg-[#0a0a0a] text-zinc-100 px-4 mx-5">
        <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                {Avatar && (
                    <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />
                )}
            </div>
            <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-zinc-100 text-[15px] hover:underline cursor-pointer">
                {Name}
            </span>
            <span className="text-zinc-500 text-sm">{UserName}</span>
            <span className="text-zinc-500 text-sm">·</span>
            <span className="text-zinc-500 text-sm">12:00 PM</span>
            </div>
        </div>
      
        <div className="pl-13">
            <p className="text-[15px] text-zinc-300 leading-relaxed">
                {Content}
            </p>
            
            <div className="flex items-center gap-10 max-w-[280px] mt-4 text-zinc-500">
            <button className="flex items-center gap-2 hover:text-sky-500 transition-colors group">
                <MessageCircle className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">12</span>
            </button>
            <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <Repeat2 className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">4</span>
            </button>
            <button className="flex items-center gap-2 hover:text-pink-500 transition-colors group">
                <Heart className="w-4 h-4 stroke-[1.8]" />
                <span className="text-xs">148</span>
            </button>
            </div>
        </div>
      
      </div>
    )
}