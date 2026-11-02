'use client';

import UserAvatar from '@/components/Avatar';
import { useApplication } from '@/context/ApplicationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { isVideoUrl } from '@/libs/format';
import { compressImage } from '@/libs/imageUtils';
import { PostService } from '@/services/postService';
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { upload } from '@vercel/blob/client';
import {
    Check,
    ChevronUp,
    Code,
    Eye,
    FileCode2,
    Image as ImageIcon,
    Loader2,
    Repeat2,
    Sparkles,
    Video,
    X
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

interface PublicBlockProps {
    Avatar?: string;
    CommunityId?: string;
    ProjectId?: string;
    title?: string;
    subtitle?: string;
    className?: string;
    onPostCreated?: () => void;
    placeholder?: string;
    floating?: boolean;
}

const POPULAR_LANGUAGES = [
    { id: 'typescript', label: 'TypeScript', ext: '.ts' },
    { id: 'javascript', label: 'JavaScript', ext: '.js' },
    { id: 'csharp', label: 'C#', ext: '.cs' },
    { id: 'python', label: 'Python', ext: '.py' },
    { id: 'go', label: 'Go', ext: '.go' },
    { id: 'rust', label: 'Rust', ext: '.rs' },
    { id: 'sql', label: 'SQL', ext: '.sql' },
    { id: 'bash', label: 'Bash', ext: '.sh' },
    { id: 'json', label: 'JSON', ext: '.json' },
    { id: 'html', label: 'HTML', ext: '.html' },
    { id: 'css', label: 'CSS', ext: '.css' },
    { id: 'cpp', label: 'C++', ext: '.cpp' },
    { id: 'java', label: 'Java', ext: '.java' },
    { id: 'php', label: 'PHP', ext: '.php' },
    { id: 'kotlin', label: 'Kotlin', ext: '.kt' },
    { id: 'swift', label: 'Swift', ext: '.swift' },
    { id: 'yaml', label: 'YAML', ext: '.yaml' },
    { id: 'dockerfile', label: 'Docker', ext: 'Dockerfile' },
    { id: 'markdown', label: 'Markdown', ext: '.md' },
    { id: 'plaintext', label: 'Текст', ext: '.txt' },
];

export default function PublicBlock({
    Avatar,
    CommunityId,
    ProjectId,
    title,
    subtitle,
    className,
    onPostCreated,
    placeholder,
    floating = false
}: PublicBlockProps) 
{
    const [newContent, setContent] = useState('');
    const [isSaving, setIsUploading] = useState(false);
    const [showInGeneralFeed, setShowInGeneralFeed] = useState(true);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState<{
        type: 'image' | 'video';
        progress?: number;
    } | null>(null);

    const [isCodeMode, setIsCodeMode] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('typescript');
    const [codeSnippet, setCodeSnippet] = useState('');
    const [codeFileName, setCodeFileName] = useState('');
    const [codeViewMode, setCodeViewMode] = useState<'edit' | 'preview'>('edit');
    const [isMainPreview, setIsMainPreview] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const lastScrollY = useRef(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const { userData, refreshUserData, refreshPostsData, repostTarget, setRepostTarget } = useApplication();
    const { language, t } = useLanguage();
    const { resolvedTheme } = useTheme();
    const isRu = language === 'ru';
    const activePlaceholder = placeholder || t.feed.whatsOnYourMind;

    useEffect(() => {
        if (!floating) return;

        const el = containerRef.current;
        if (!el) return;

        const mainEl = el.closest('main');
        const scrollTarget: (EventTarget & { scrollTop?: number }) = mainEl || window;

        const getScrollTop = () => {
            if (mainEl) return mainEl.scrollTop;
            return window.scrollY || document.documentElement.scrollTop;
        };

        lastScrollY.current = getScrollTop();

        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = getScrollTop();
                    const delta = currentScrollY - lastScrollY.current;

                    if (currentScrollY <= 60) {
                        setIsScrolled(false);
                        setIsVisible(true);
                        lastScrollY.current = currentScrollY;
                        ticking = false;
                        return;
                    }

                    setIsScrolled(true);

                    if (delta > 10) {
                        setIsVisible(false);
                        lastScrollY.current = currentScrollY;
                    } else if (delta < -10) {
                        setIsVisible(true);
                        lastScrollY.current = currentScrollY;
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            scrollTarget.removeEventListener('scroll', handleScroll);
        };
    }, [floating]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        if (uploadingMedia) {
            alert(isRu ? "Пожалуйста, дождитесь окончания загрузки медиа" : "Please wait until media upload finishes");
            return;
        }

        if (!newContent.trim() && attachments.length === 0 && !repostTarget) {
            alert(isRu ? "Пост не может быть пустым" : "Post cannot be empty");
            return;
        }

        setIsUploading(true);
        try {
            await PostService.createPost({ 
                content: newContent, 
                attachments: attachments,
                repostOfPostId: repostTarget?.id,
                communityId: CommunityId,
                projectId: ProjectId,
                showInGeneralFeed: ProjectId ? showInGeneralFeed : true,
            });

            setContent('');
            setAttachments([]); 
            setRepostTarget(null);
            setIsCodeMode(false);
            setIsMainPreview(false);
            setIsFocused(false);
            setIsExpanded(false);

            await Promise.all([
                refreshPostsData(),
                refreshUserData()
            ]);
            onPostCreated?.();
        } catch (error: any) {
            console.error("Ошибка создания поста:", error);
            const errorMsg = error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : null);
            alert(errorMsg || (isRu ? "Не удалось создать пост" : "Failed to create post"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (attachments.some(isVideoUrl)) {
            alert(isRu ? "Нельзя прикреплять изображения к посту, где уже есть видео." : "Cannot attach images to a post that already has a video.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploadingMedia({ type: 'image' });
        try {
            const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 });
            const newBlob = await upload(compressed.name, compressed, {
                access: 'public',
                handleUploadUrl: '/api/img/upload',
            });
            setAttachments((prev) => [...prev, newBlob.url]);
        } catch (error: any) {
            console.error("Ошибка загрузки изображения:", error);
            alert(error?.message || (isRu ? "Не удалось загрузить изображение" : "Failed to upload image"));
        } finally {
            setUploadingMedia(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 60;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(isRu
                ? `Размер видео превышает ${MAX_SIZE_MB} МБ (${(file.size / (1024 * 1024)).toFixed(1)} МБ). Пожалуйста, выберите файл поменьше.`
                : `Video size exceeds ${MAX_SIZE_MB} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please choose a smaller file.`
            );
            if (videoInputRef.current) videoInputRef.current.value = '';
            return;
        }

        if (attachments.some(isVideoUrl)) {
            alert(isRu ? "К посту можно прикрепить только одно видео." : "Only one video can be attached to a post.");
            if (videoInputRef.current) videoInputRef.current.value = '';
            return;
        }

        if (attachments.length > 0) {
            const replace = confirm(isRu
                ? "Видео нельзя комбинировать с изображениями. Заменить прикрепленные изображения на видео?"
                : "Videos cannot be combined with images. Replace attached images with the video?"
            );
            if (!replace) {
                if (videoInputRef.current) videoInputRef.current.value = '';
                return;
            }
            setAttachments([]);
        }

        setUploadingMedia({ type: 'video', progress: 0 });
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/video/upload',
                onUploadProgress: ({ percentage }) => {
                    setUploadingMedia({ type: 'video', progress: Math.round(percentage) });
                },
            });
            setAttachments([newBlob.url]);
        } catch (error: any) {
            console.error("Ошибка загрузки видео:", error);
            alert(error?.message || (isRu ? "Не удалось загрузить видео" : "Failed to upload video"));
        } finally {
            setUploadingMedia(null);
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };

    const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            setCodeSnippet(newValue);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }, 0);
        }
    };

    const handleInsertCode = () => {
        if (!codeSnippet.trim()) {
            alert(isRu ? "Введите фрагмент кода для вставки." : "Enter a code snippet to insert.");
            return;
        }

        const headerComment = codeFileName.trim()
            ? (['python', 'bash', 'yaml', 'dockerfile'].includes(selectedLanguage)
                ? `# ${codeFileName.trim()}\n`
                : (['html', 'xml'].includes(selectedLanguage)
                    ? `<!-- ${codeFileName.trim()} -->\n`
                    : `// ${codeFileName.trim()}\n`))
            : '';

        const formattedBlock = `\`\`\`${selectedLanguage}\n${headerComment}${codeSnippet.trimEnd()}\n\`\`\``;

        setContent((prev) => {
            const trimmed = prev.trim();
            if (!trimmed) return formattedBlock;
            return `${trimmed}\n\n${formattedBlock}\n`;
        });

        setCodeSnippet('');
        setCodeFileName('');
        setIsCodeMode(false);
    };

    const handleCancelCode = () => {
        if (codeSnippet.trim()) {
            const discard = confirm(isRu
                ? "Закрыть редактор кода? Введенный фрагмент не будет сохранен."
                : "Close code editor? The entered snippet will not be saved."
            );
            if (!discard) return;
        }
        setCodeSnippet('');
        setCodeFileName('');
        setIsCodeMode(false);
    };

    const previewCodeMarkdown = codeSnippet.trim()
        ? `\`\`\`${selectedLanguage}\n${codeFileName.trim() ? (['python', 'bash', 'yaml', 'dockerfile'].includes(selectedLanguage) ? `# ${codeFileName.trim()}\n` : `// ${codeFileName.trim()}\n`) : ''}${codeSnippet}\n\`\`\``
        : isRu
            ? `\`\`\`${selectedLanguage}\n// Превью фрагмента кода отобразится здесь в реальном времени...\nfunction example() {\n  return "Привет, мир!";\n}\n\`\`\``
            : `\`\`\`${selectedLanguage}\n// Live code snippet preview will appear here...\nfunction example() {\n  return "Hello, world!";\n}\n\`\`\``;

    const displayAvatar = Avatar || userData?.avatar;
    const defaultTitle = ProjectId ? (isRu ? "Новая запись в девлог" : "New devlog entry") : (isRu ? "Что нового" : "What's New");
    const defaultSubtitle = ProjectId ? (isRu ? "Обновление появится в ленте проекта" : "Update will appear in the project feed") : (isRu ? "Публикации от людей, на которых вы подписаны" : "Public posts from people you follow");

    const isBusyUploading = Boolean(uploadingMedia) || isSaving;
    const hasActiveContent = newContent.trim().length > 0 || attachments.length > 0 || isCodeMode || codeSnippet.trim().length > 0 || Boolean(repostTarget);
    const isEffectivelyExpanded = !floating || isExpanded;
    const shouldShow = !floating || !isScrolled || isVisible || isFocused || isBusyUploading || isExpanded || hasActiveContent;

    const containerClasses = floating
        ? `sticky top-14 max-md:top-17 z-40 transition-all duration-300 ease-out will-change-transform m-4 lg:mx-8 md:mx-11 border rounded-2xl light:bg-white light:border-zinc-200/80 light:shadow-sm ${
            shouldShow
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "-translate-y-[140%] opacity-0 pointer-events-none"
        } ${
            isScrolled
                ? "bg-[#0a0a0a]/90 backdrop-blur-2xl border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.85)] light:bg-white/95 light:backdrop-blur-xl light:border-zinc-200/80 light:shadow-md"
                : "bg-white/[0.02] border-white/5 shadow-none hover:border-white/10 hover:bg-white/[0.03] light:hover:border-zinc-300"
        } ${className || ""}`
        : className || "m-4 lg:mx-8 md:mx-11 border border-white/5 rounded-xl bg-white/[0.02] light:bg-white light:border-zinc-200/80 light:shadow-sm";

    return (
        <div 
            ref={containerRef}
            onFocusCapture={() => setIsFocused(true)}
            onBlurCapture={(e) => {
                if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                    setIsFocused(false);
                    if (!newContent.trim() && attachments.length === 0 && !isCodeMode && !uploadingMedia && !repostTarget) {
                        setIsExpanded(false);
                    }
                }
            }}
            className={containerClasses}
        >
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleImgUpload}
                disabled={isSaving || Boolean(uploadingMedia)}
                className="hidden" 
            />
            <input 
                ref={videoInputRef}
                type="file" 
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
                onChange={handleVideoUpload}
                disabled={isSaving || Boolean(uploadingMedia)}
                className="hidden" 
            />

            <div 
                className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                style={{
                    gridTemplateRows: !isEffectivelyExpanded ? '1fr' : '0fr',
                    opacity: !isEffectivelyExpanded ? 1 : 0,
                    pointerEvents: !isEffectivelyExpanded ? 'auto' : 'none',
                }}
            >
                <div className="overflow-hidden min-h-0">
                    <div 
                        onClick={() => {
                            setIsExpanded(true);
                            setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 120);
                        }}
                        className="flex items-center gap-3 p-2.5 px-3.5 sm:px-4 cursor-pointer select-none group min-h-[48px]"
                    >
                        <UserAvatar
                            src={displayAvatar}
                            name={userData?.fullName || userData?.userName}
                            className="w-8 h-8 text-xs"
                        />

                        <div className="flex-1 text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors truncate py-1 light:text-zinc-500 light:group-hover:text-zinc-700">
                            {newContent.trim() ? (
                                <span className="text-zinc-200 font-medium truncate light:text-zinc-800">{newContent}</span>
                            ) : (
                                <span className="truncate">{activePlaceholder}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button 
                                type="button" 
                                disabled={isSaving || Boolean(uploadingMedia)} 
                                onClick={() => {
                                    setIsExpanded(true);
                                    fileInputRef.current?.click();
                                }} 
                                className="p-1.5 w-8 h-8 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition flex items-center justify-center cursor-pointer disabled:opacity-40 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                title={isRu ? "Прикрепить изображение" : "Attach image"}
                            >
                                <ImageIcon className="w-4 h-4"/>
                            </button>
                            <button 
                                type="button" 
                                disabled={isSaving || Boolean(uploadingMedia)} 
                                onClick={() => {
                                    setIsExpanded(true);
                                    videoInputRef.current?.click();
                                }} 
                                className="p-1.5 w-8 h-8 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition flex items-center justify-center cursor-pointer disabled:opacity-40 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                title={isRu ? "Прикрепить видео (до 60 МБ)" : "Attach video (up to 60 MB)"}
                            >
                                <Video className="w-4 h-4"/>
                            </button>
                            <button 
                                type="button" 
                                disabled={isSaving || Boolean(uploadingMedia)} 
                                onClick={() => {
                                    setIsExpanded(true);
                                    setIsCodeMode(true);
                                }} 
                                className="p-1.5 w-8 h-8 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition flex items-center justify-center cursor-pointer disabled:opacity-40 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                title={isRu ? "Вставить фрагмент кода" : "Insert code snippet"}
                            >
                                <Code className="w-4 h-4"/>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsExpanded(true);
                                    setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 120);
                                }}
                                className="h-7 px-3 text-xs font-semibold bg-white text-black rounded-full hover:bg-zinc-200 transition flex items-center justify-center cursor-pointer ml-1 active:scale-95 shadow-sm light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                            >
                                {isRu ? "Написать" : "Write"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                style={{
                    gridTemplateRows: isEffectivelyExpanded ? '1fr' : '0fr',
                    opacity: isEffectivelyExpanded ? 1 : 0,
                    pointerEvents: isEffectivelyExpanded ? 'auto' : 'none',
                }}
            >
                <div className="overflow-hidden min-h-0">
                    <div className="flex flex-row items-center justify-between gap-3.5 p-4 pb-2 px-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <UserAvatar
                                src={displayAvatar}
                                name={userData?.fullName || userData?.userName}
                                className="w-10 h-10 text-xs"
                            />
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
                                <h1 className="text-base max-sm:text-sm font-bold text-zinc-100 truncate light:text-zinc-900">{title || defaultTitle}</h1>
                                <p className="text-zinc-500 max-sm:text-xs text-xs truncate light:text-zinc-500">{subtitle || defaultSubtitle}</p>
                            </div>
                        </div>

                        {floating && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (hasActiveContent) {
                                        const confirmClose = confirm(isRu ? "Свернуть форму? Введенный текст сохранится в черновике." : "Collapse form? Entered text will be saved in draft.");
                                        if (!confirmClose) return;
                                    }
                                    setIsExpanded(false);
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center cursor-pointer shrink-0 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                title={isRu ? "Свернуть форму" : "Collapse form"}
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleCreatePost}>
                {isCodeMode ? (
                    <div className="mx-4 mb-3 p-4 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col gap-3 animate-fade-in backdrop-blur-md light:bg-zinc-50/70 light:border-zinc-200 light:shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 light:border-zinc-200">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-white/5 text-zinc-200 border border-white/10 light:bg-zinc-200/60 light:text-zinc-700 light:border-zinc-300/60">
                                    <FileCode2 size={16} />
                                </div>
                                <span className="font-semibold text-sm text-zinc-100 light:text-zinc-900">
                                    {isRu ? "Вставка фрагмента кода" : "Insert code snippet"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/10 text-xs light:bg-zinc-200/50 light:border-zinc-200">
                                    <button
                                        type="button"
                                        onClick={() => setCodeViewMode('edit')}
                                        className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                                            codeViewMode === 'edit'
                                                ? 'bg-white text-black font-semibold shadow-sm light:bg-white light:text-zinc-900 light:shadow-sm'
                                                : 'text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900'
                                        }`}
                                    >
                                        {isRu ? "Код" : t.feed.codeSnippet}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCodeViewMode('preview')}
                                        className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 cursor-pointer ${
                                            codeViewMode === 'preview'
                                                ? 'bg-white text-black font-semibold shadow-sm light:bg-white light:text-zinc-900 light:shadow-sm'
                                                : 'text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900'
                                        }`}
                                    >
                                        <Eye size={12} />
                                        {isRu ? "Превью" : t.feed.markdownPreview}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCancelCode}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-200/60"
                                    title={isRu ? "Закрыть режим кода" : "Close code mode"}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mr-1 light:text-zinc-500">{isRu ? "Язык:" : "Language:"}</span>
                                {POPULAR_LANGUAGES.slice(0, 10).map((lang) => {
                                    const isSelected = selectedLanguage === lang.id;
                                    const langLabel = lang.id === 'plaintext' ? (isRu ? 'Текст' : 'Plain Text') : lang.label;
                                    return (
                                        <button
                                            key={lang.id}
                                            type="button"
                                            onClick={() => setSelectedLanguage(lang.id)}
                                            className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition border cursor-pointer ${
                                                isSelected
                                                    ? 'bg-white text-black font-semibold border-white shadow-sm light:bg-zinc-900 light:text-white light:border-zinc-900'
                                                    : 'bg-white/[0.03] text-zinc-400 border-white/5 hover:border-white/20 hover:text-zinc-200 light:bg-zinc-100 light:text-zinc-600 light:border-zinc-200 light:hover:bg-zinc-200 light:hover:text-zinc-900'
                                            }`}
                                        >
                                            {langLabel}
                                        </button>
                                    );
                                })}

                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="px-2 py-0.5 rounded-md text-xs font-mono bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white focus:outline-none focus:border-white/30 cursor-pointer light:bg-zinc-100 light:border-zinc-200 light:text-zinc-800 light:hover:bg-zinc-200"
                                >
                                    {POPULAR_LANGUAGES.map((lang) => {
                                        const langLabel = lang.id === 'plaintext' ? (isRu ? 'Текст' : 'Plain Text') : lang.label;
                                        return (
                                            <option key={lang.id} value={lang.id}>
                                                {langLabel} ({lang.ext})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={codeFileName}
                                    onChange={(e) => setCodeFileName(e.target.value)}
                                    placeholder={isRu ? "Имя файла (напр. index.ts, Program.cs) — необязательно" : "File name (e.g. index.ts, Program.cs) — optional"}
                                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-black border border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition light:bg-zinc-100/70 light:border-zinc-200 light:text-zinc-900 light:placeholder:text-zinc-400 light:focus:bg-white light:focus:border-zinc-300"
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            {codeViewMode === 'edit' ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-mono light:text-zinc-500">
                                        <span>{isRu ? "Код" : "Code"} ({selectedLanguage})</span>
                                        <span>{isRu ? "Tab = 2 пробела" : "Tab = 2 spaces"}</span>
                                    </div>
                                    <textarea
                                        value={codeSnippet}
                                        onChange={(e) => setCodeSnippet(e.target.value)}
                                        onKeyDown={handleCodeKeyDown}
                                        placeholder={isRu ? `// Вставьте ваш ${selectedLanguage} код сюда...\nfunction example() {\n  return "Привет!";\n}` : `// Paste your ${selectedLanguage} code here...\nfunction example() {\n  return "Hello!";\n}`}
                                        className="w-full h-64 p-3.5 text-xs sm:text-sm font-mono leading-relaxed text-zinc-100 bg-black border border-white/10 rounded-xl focus:outline-none focus:border-white/30 resize-y custom-scrollbar light:bg-zinc-100/70 light:border-zinc-200 light:text-zinc-900 light:placeholder:text-zinc-400 light:focus:bg-white light:focus:border-zinc-300"
                                        spellCheck={false}
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-mono light:text-zinc-500">
                                        <span className="flex items-center gap-1 text-zinc-300 light:text-zinc-700">
                                            <Sparkles size={11} className="text-zinc-400 light:text-zinc-500" />
                                            {isRu ? "Превью Markdown" : "Markdown Preview"}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 light:text-zinc-500">{isRu ? "Подсветка синтаксиса" : "Syntax highlighting"}</span>
                                    </div>
                                    <div className="w-full h-64 p-3.5 rounded-xl border border-white/10 bg-black overflow-y-auto overflow-x-auto custom-scrollbar light:bg-white light:border-zinc-200">
                                        <MarkdownPreview
                                            className="post-markdown"
                                            source={previewCodeMarkdown}
                                            style={{
                                                backgroundColor: "transparent",
                                                color: "inherit",
                                                fontSize: "13px",
                                            }}
                                            wrapperElement={{
                                                "data-color-mode": resolvedTheme === 'light' ? 'light' : 'dark',
                                            }}
                                            remarkPlugins={[remarkGfm as any, remarkBreaks as any]}
                                            rehypePlugins={[rehypeHighlight as any]}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 light:border-zinc-200">
                            <span className="text-xs text-zinc-500 font-mono light:text-zinc-500">
                                {codeSnippet.split('\n').filter(Boolean).length} {isRu ? "строк" : "lines"} · {codeSnippet.length} {isRu ? "симв." : "chars"}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCancelCode}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                >
                                    {isRu ? "Отмена" : t.common.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInsertCode}
                                    disabled={!codeSnippet.trim()}
                                    className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                                >
                                    <Check size={13} />
                                    {isRu ? "Вставить в пост" : "Insert into post"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 p-2 px-4">
                        {newContent.trim().length > 0 && (
                            <div className="flex justify-end gap-1 mb-1">
                                <button
                                    type="button"
                                    onClick={() => setIsMainPreview(!isMainPreview)}
                                    className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1 transition cursor-pointer light:text-zinc-600 light:hover:text-zinc-900 light:bg-zinc-100 light:hover:bg-zinc-200 light:border-zinc-200"
                                >
                                    <Eye size={11} />
                                    {isMainPreview ? (isRu ? "Редактировать" : t.post.edit) : (isRu ? "Превью поста" : "Post preview")}
                                </button>
                            </div>
                        )}

                        {isMainPreview ? (
                            <div className="w-full p-3 text-sm text-zinc-100 bg-[#0a0a0a] border border-white/5 rounded-xl min-h-[50px] max-h-[300px] overflow-y-auto custom-scrollbar light:bg-zinc-100/70 light:border-zinc-200 light:text-zinc-900">
                                <MarkdownPreview
                                    className="post-markdown"
                                    source={newContent}
                                    style={{
                                        backgroundColor: "transparent",
                                        color: "inherit",
                                    }}
                                    wrapperElement={{
                                        "data-color-mode": resolvedTheme === 'light' ? 'light' : 'dark',
                                    }}
                                    remarkPlugins={[remarkGfm as any, remarkBreaks as any]}
                                    rehypePlugins={[rehypeHighlight as any]}
                                />
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={newContent}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={activePlaceholder}
                                className="w-full p-2 text-sm text-zinc-100 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none transition focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none [field-sizing:content] min-h-[38px] max-h-[250px] light:bg-zinc-100/70 light:border-zinc-200 light:text-zinc-900 light:placeholder:text-zinc-400 light:focus:bg-white light:focus:ring-zinc-300 light:focus:border-zinc-300"
                            />
                        )}
                    </div>
                )}

                {repostTarget && (
                    <div className="mx-4 mb-3 p-3 rounded-xl border border-white/10 bg-black/40 relative light:bg-zinc-50 light:border-zinc-200/80">
                        <button
                            type="button"
                            onClick={() => setRepostTarget(null)}
                            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition light:bg-zinc-200 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-300"
                            title={isRu ? "Отменить репост" : "Cancel repost"}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Repeat2 className="w-3.5 h-3.5 text-green-500" />
                            <UserAvatar
                                src={repostTarget.authorAvatar}
                                name={repostTarget.authorName || repostTarget.authorUsername}
                                className="w-5 h-5 text-[9px]"
                            />
                            <span className="text-xs font-medium text-zinc-200 light:text-zinc-900">{repostTarget.authorName}</span>
                            <span className="text-xs text-zinc-500 light:text-zinc-500">@{repostTarget.authorUsername}</span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 pl-5 font-normal light:text-zinc-600">
                            {repostTarget.content || (isRu ? "(вложение)" : "(attachment)")}
                        </p>
                    </div>
                )}

                {(attachments.length > 0 || uploadingMedia) && (
                    <div className="flex flex-wrap gap-2.5 px-6 pb-4 items-center">
                        {attachments.map((url, index) => {
                            const isVideo = isVideoUrl(url);
                            return (
                                <div key={index} className="relative w-28 h-20 rounded-xl overflow-hidden border border-white/10 bg-black group shrink-0 light:border-zinc-200 light:bg-zinc-100">
                                    {isVideo ? (
                                        <>
                                            <video src={url} className="w-full h-full object-cover" muted playsInline />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                                <div className="p-1.5 rounded-full bg-black/70 text-white border border-white/10">
                                                    <Video className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img src={url} className="w-full h-full object-cover" alt={isRu ? "Вложение" : "Attachment"} />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/95 transition text-xs cursor-pointer z-10"
                                        title={isRu ? "Удалить" : t.post.delete}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}

                        {uploadingMedia && (
                            <div className="relative w-36 h-20 rounded-xl overflow-hidden border border-white/10 bg-zinc-900/90 flex flex-col items-center justify-center p-2 text-center shrink-0 light:border-zinc-200 light:bg-zinc-100/90">
                                {uploadingMedia.type === 'video' ? (
                                    <>
                                        <Video className="w-5 h-5 text-zinc-300 animate-pulse mb-1 light:text-zinc-600" />
                                        <span className="text-[10px] text-zinc-300 font-medium truncate w-full light:text-zinc-700">
                                            {isRu ? "Загрузка..." : "Uploading..."} {uploadingMedia.progress ?? 0}%
                                        </span>
                                        <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden light:bg-zinc-200">
                                            <div 
                                                className="bg-white h-full transition-all duration-150 light:bg-zinc-900" 
                                                style={{ width: `${uploadingMedia.progress ?? 0}%` }} 
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin mb-1 light:text-zinc-600" />
                                        <span className="text-[10px] text-zinc-400 light:text-zinc-600">{isRu ? "Загрузка..." : "Uploading..."}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-row flex-wrap justify-between items-center gap-2 p-2 px-3 sm:px-4">
                    <div className="flex flex-row items-center gap-1">
                        <button 
                            type="button" 
                            disabled={isSaving || Boolean(uploadingMedia)} 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-2 w-10 h-10 text-zinc-400 hover:text-white border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center cursor-pointer disabled:opacity-40 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                            title={isRu ? "Прикрепить изображение" : "Attach image"}
                        >
                            <ImageIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            type="button" 
                            disabled={isSaving || Boolean(uploadingMedia)} 
                            onClick={() => videoInputRef.current?.click()} 
                            className="p-2 w-10 h-10 text-zinc-400 hover:text-white border-white/5 rounded-xl hover:bg-white/10 transition flex items-center justify-center cursor-pointer disabled:opacity-40 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                            title={isRu ? "Прикрепить видео (до 60 МБ)" : "Attach video (up to 60 MB)"}
                        >
                            <Video className="w-5 h-5"/>
                        </button>
                        <button 
                            type="button" 
                            disabled={isSaving || Boolean(uploadingMedia)} 
                            onClick={() => {
                                setIsCodeMode((prev) => !prev);
                                if (isMainPreview) setIsMainPreview(false);
                            }} 
                            className={`p-2 w-10 h-10 rounded-xl transition flex items-center justify-center cursor-pointer border ${
                                isCodeMode 
                                    ? 'bg-white text-black border-white shadow-sm light:bg-zinc-900 light:text-white light:border-zinc-900' 
                                    : 'text-zinc-400 hover:text-white border-white/5 hover:bg-white/10 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100 light:border-transparent'
                            }`}
                            title={isRu ? "Вставить фрагмент кода (с выбором языка и превью)" : "Insert code snippet (with language selection and preview)"}
                        >
                            <Code className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3.5 ml-auto">
                        {ProjectId && (
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer select-none transition-colors light:text-zinc-600 light:hover:text-zinc-900">
                                <input 
                                    type="checkbox" 
                                    checked={showInGeneralFeed} 
                                    onChange={(e) => setShowInGeneralFeed(e.target.checked)} 
                                    className="w-4 h-4 rounded border-white/20 bg-zinc-900 accent-white shrink-0 cursor-pointer light:border-zinc-300 light:bg-zinc-100 light:accent-zinc-900"
                                />
                                <span className="hidden sm:inline">{t.feed.generalFeed}</span>
                            </label>
                        )}
                        <button 
                            type="submit" 
                            disabled={isSaving || Boolean(uploadingMedia)} 
                            className="h-9 px-6 text-xs font-semibold bg-white text-black rounded-full hover:bg-zinc-200 transition flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-sm light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                        >
                            {isSaving ? t.feed.publishing : uploadingMedia ? t.feed.loading : t.feed.publish}
                        </button>
                    </div>
                </div>
                    </form>
                </div>
            </div>
        </div>
    );
}