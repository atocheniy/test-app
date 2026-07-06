import { useApplication } from '@/context/ApplicationContext';
import { PostService } from '@/services/postService';
import { upload } from '@vercel/blob/client';
import { Image as ImageIcon, Video, Code, Newspaper, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface PublicBlockProps{
    Avatar?: string;
}

export default function PublicBlock({ Avatar }: PublicBlockProps) 
{
    const [newContent, setContent] = useState('');
    const [isSaving, setIsUploading] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { refreshUserData, refreshPostsData } = useApplication();

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newContent.trim() && attachments.length === 0) {
            alert("Пост не может быть пустым");
            return;
        }

        setIsUploading(true);
        try {
            await PostService.createPost({ content: newContent, attachments: attachments });

            setContent('');
            setAttachments([]); 

            await refreshPostsData();
            await refreshUserData();
        } catch (error) {
            console.error("Ошибка создания поста:", error);
            alert("Не удалось создать пост");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/img/upload',
            });
            setAttachments((prev) => [...prev, newBlob.url]);
            await refreshPostsData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="m-4 mx-11 border border-white/5 rounded-xl bg-zinc-950/50">
                        <div className="flex flex-row items-center gap-4 p-4 pb-2 px-4">
                            <div className="w-10 h-10 bg-zinc-700 rounded-full shrink-0 overflow-hidden">
                                {Avatar && (
                                    <img src={Avatar} className="w-full h-full object-cover" alt="Avatar" />
                                )}
                            </div>
                            <h1 className="text-lg font-bold text-zinc-100">What's New</h1>
                            <p className="text-zinc-400">Public posts from people you follow</p>
                        </div>
                        <form onSubmit={handleCreatePost}>
                            <div className="flex flex-row justify-between items-end gap-2 p-2 px-4">
                                <textarea
                                    rows={1}
                                    value={newContent}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="w-full p-2 text-sm text-zinc-100 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none transition focus:ring-2 focus:ring-white-500 focus:border-white-500 resize-none [field-sizing:content] min-h-[38px] max-h-[250px]"
                                />
                            </div>

                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-6 pb-4">
                                    {attachments.map((url, index) => (
                                        <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                                            <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                                            <button
                                                type="button"
                                                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition text-xs"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-row justify-between items-center gap-2">
                                <div className="flex flex-row items-center gap-1 p-2 px-4">
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImgUpload}
                                        disabled={isSaving}
                                        className="hidden" 
                                    />
                                    <button type="button" disabled={isSaving} onClick={() => fileInputRef.current?.click()} className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5"/>
                                    </button>
                                    <button type="button" disabled={isSaving} className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                        <Video className="w-5 h-5"/>
                                    </button>
                                    <button type="button" disabled={isSaving} className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                        <Newspaper className="w-5 h-5"/>
                                    </button>
                                    <button type="button" disabled={isSaving} className="p-2 w-10 h-10 text-zinc-600 border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center">
                                        <Code className="w-5 h-5"/>
                                    </button>
                                </div>
                                <button type="submit" className="w-40 p-2 px-4 mx-4 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition">
                                    {isSaving ? "Posting..." : "Post"}
                                </button>
                            </div>
                        </form>
                    </div>
        
    );
}