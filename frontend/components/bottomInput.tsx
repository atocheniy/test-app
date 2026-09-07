import { upload } from '@vercel/blob/client';
import { Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BottomInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
    onSend: (attachments: string[]) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function BottomInput({value, onChange, onSend, onKeyDown, disabled = false, placeholder = "Type a message..." }: BottomInputProps) {
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled && !isUploading;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                const newBlob = await upload(file.name, file, {
                    access: 'public',
                    handleUploadUrl: '/api/img/upload',
                });

                setAttachments((prev) => [...prev, newBlob.url]);
            }
        } catch (error) {
            console.error("Ошибка загрузки в Vercel Blob:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSend = () => {
        if (!canSend) return;
        onSend(attachments);
        setAttachments([]);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && canSend) {
            e.preventDefault();
            handleSend();
        }
        if (onKeyDown) onKeyDown(e);
    };

    return (
        <div className="shrink-0 sticky bottom-0 bg-black/70 backdrop-blur-md border-t border-white/5 px-4 py-2 flex flex-col gap-2">
            
             {attachments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                    {attachments.map((url, index) => (
                        <div key={index} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                            <img src={url} alt="Attachment preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Attach image"
                >
                    {isUploading ? (
                        <Loader2 size={20} className="animate-spin text-sky-400" />
                    ) : (
                        <Paperclip size={20} />
                    )}
                </button>

                <textarea 
                    ref={textareaRef}
                    rows={1}
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={isUploading ? "Uploading image..." : placeholder} 
                    className="flex-1 min-h-[40px] max-h-[140px] py-2.5 px-4 resize-none transition rounded-2xl bg-white/5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500 border border-transparent focus:border-sky-500 text-sm leading-relaxed overflow-y-auto no-scrollbar"
                />

                <button 
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${ canSend ? 'bg-white hover:bg-zinc-200 text-black active:scale-95 cursor-pointer shadow-md' : 'bg-white/5 text-zinc-600 cursor-not-allowed' }`} title="Send" > <SendHorizontal size={18} className="translate-x-[1px]" /> </button> </div>
        </div>
    )
}
