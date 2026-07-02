import {Image, Video, Code, Newspaper} from 'lucide-react';

export default function PublicBlock() 
{
    return (
        <div className="m-4 mx-11 border border-white/5 rounded-xl bg-[#0a0a0a]">
                        <div className="flex flex-row items-center gap-4 p-4 pb-2 px-4">
                            <div className="w-10 h-10 bg-zinc-700 rounded-full shrink-0"></div>
                            <h1 className="text-lg font-bold text-zinc-100">What's New</h1>
                            <p className="text-zinc-400">Public posts from people you follow</p>
                        </div>
                        <div className="flex flex-row justify-between items-end gap-2 p-2 px-4">
                            <textarea
                                rows={1}
                                placeholder="What's on your mind?"
                                className="w-full p-2 text-sm text-zinc-100 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none transition focus:ring-2 focus:ring-white-500 focus:border-white-500 resize-none [field-sizing:content] min-h-[38px] max-h-[250px]"
                            />
                        </div>
                        <div className="flex flex-row justify-between items-center gap-2">
                            <div className="flex flex-row items-center gap-1 p-2 px-4">
                                <button className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                    <Image className="w-5 h-5"/>
                                </button>
                                <button className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                    <Video className="w-5 h-5"/>
                                </button>
                                <button className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                    <Newspaper className="w-5 h-5"/>
                                </button>
                                <button className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                    <Code className="w-5 h-5"/>
                                </button>
                            </div>
                            <button className="w-40 p-2 px-4 mx-4 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition">
                                Post
                            </button>
                        </div>
                    </div>
        
    );
}