import Avatar from '@/components/Avatar';
import { useLanguage } from '@/context/LanguageContext';
import { Pencil, Trash2 } from 'lucide-react';

interface ExperienceCardProps 
{
    icon?: string;
    name: string;
    post: string;
    mode?: string;
    time: string;
    description?: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function ExperienceCard({ icon, name, post, mode, time, description, onEdit, onDelete }: ExperienceCardProps) {
    const { language, t } = useLanguage();
    const isRu = language === 'ru';

    return (
        <div className="p-5 border border-white/5 rounded-2xl bg-zinc-950/20 hover:border-white/10 transition-colors duration-300 group light:bg-white light:border-zinc-200/80 light:shadow-sm light:hover:border-zinc-300">
            <div className="flex flex-row items-center gap-4">
                <Avatar
                    src={icon}
                    name={name}
                    shape="rounded"
                    className="w-10 h-10 text-xs shadow-inner"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-100 truncate light:text-zinc-900">{post}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate light:text-zinc-500">
                                {name} {mode ? `• ${mode}` : ''}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-500 font-medium bg-zinc-900/60 border border-white/5 px-2.5 py-1 rounded-lg light:bg-zinc-100 light:border-zinc-200 light:text-zinc-600">
                                {time}
                            </span>

                            {(onEdit || onDelete) && (
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={onEdit}
                                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                            title={isRu ? "Редактировать место работы" : "Edit work experience"}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={onDelete}
                                            className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition light:text-zinc-500 light:hover:text-red-600 light:hover:bg-red-50"
                                            title={isRu ? "Удалить место работы" : "Delete work experience"}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {description && (
                <p className="text-xs text-zinc-400 leading-relaxed mt-3 pl-14 whitespace-pre-line light:text-zinc-700">
                    {description}
                </p>
            )}
        </div>
    );
}