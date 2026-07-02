interface ExperienceCardProps 
{
    icon?: string;
    name: string;
    post: string;
    mode?: string;
    time: string;
    description?: string;
}

export default function ExperienceCard({ icon, name, post, mode, time, description }: ExperienceCardProps) {
    return (
        <div className="p-5 border border-white/5 rounded-2xl bg-zinc-950/10 hover:border-white/10 transition-colors duration-300">
            <div className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-xs font-bold text-zinc-400">{icon}</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-sm font-semibold text-zinc-100">{post}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">{name} • {mode}</p>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-lg">
                            {time}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-4 pl-14">
                {description}
            </p>
        </div>
    )
}