interface LinkItem {
    href: string;
    name: string;
}

interface ProjectCardProps {
    name: string;

    links?: LinkItem[];
    description?: string;
    technologies?: string[];
}

export default function ProjectCard({ name, links, description, technologies }: ProjectCardProps) {
    return (
        <div className="p-5 border border-white/5 rounded-2xl bg-zinc-950/10 hover:border-white/10 transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{name}</h4>
                <div className="flex flex-row items-center gap-2">
                    {links?.map((link) => (
                        <a key={link.href} href={link.href} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                            {link.name}
                        </a>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-800 rounded-xl h-40 mt-4 flex items-center justify-center">
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                {description}
            </p>
            <div className="flex gap-1.5 mt-4">
                {technologies?.map((tech) => (
                    <span key={tech} className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">
                        {tech}
                    </span>
                ))}
            </div>
        </div>
    )
}