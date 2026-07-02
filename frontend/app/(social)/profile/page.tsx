import ExperienceCard from "@/components/exp_card";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import Titlebar from "@/components/titlebar";

export default function Profile() {
    const post = { Name: "", UserName: "", Content: "", Time: "" };
    const posts = Array.from({ length: 10 }, () => post);

    return (
        <div>
            <div>
                <Titlebar  title="Profile"></Titlebar>

                <div className="w-full bg-zinc-900 h-48 border-b border-white/5 rounded-b-xl relative">
                    
                </div>

                <div className="px-10 pb-10">
                    <div className="flex flex-row items-end gap-6">
                        <div className="w-40 h-40 bg-zinc-700 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] relative z-10 shadow-lg">
                        </div>
                        <div className="mb-2">
                            <h2 className="text-2xl font-bold text-zinc-100">User Name</h2>
                            <div className="flex flex-row items-center gap-2">
                                <p className="text-sm text-zinc-400">@username</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">Followers</p>
                            </div>
                        </div>
                        <div className="ml-auto mb-5">
                            <button className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition">
                                Edit Profile
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <p className="text-md font-bold text-zinc-300">
                            First Line
                        </p>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            Second Line
                        </p>
                    </div>

                    <div className="space-y-3 mt-4">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tech Stack</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Zustand', 'GraphQL', 'PostgreSQL', 'Git'].map((tech) => (
                                <span 
                                    key={tech} 
                                    className="px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:border-white/10 hover:bg-zinc-950/80 transition-all duration-200 cursor-default"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 border-t border-white/5 pt-8 space-y-8">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <div className="space-y-4 p-5 border border-white/5 bg-zinc-950/10 rounded-2xl">
                                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Details</h4>
                                <div className="space-y-3 text-xs text-zinc-400">
                                    
                                    
                                </div>
                            </div>

                            <div className="space-y-4 p-5 border border-white/5 bg-zinc-950/10 rounded-2xl">
                                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Links</h4>
                                <div className="space-y-2">
                                   
                                </div>
                            </div>

                        </div>

                        <div className="border-t border-white/5 pt-6" />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Featured Projects</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                <ProjectCard name="First project" links={[{ href: "https://github.com", name: "GitHub" }, { href: "https://www.npmjs.com", name: "NPM" }]} description="" technologies={["TypeScript", "React"]} />
                                <ProjectCard name="Second project" links={[{ href: "https://github.com", name: "GitHub" }, { href: "https://www.npmjs.com", name: "NPM" }]} description="" technologies={["TypeScript", "React"]} />

                            </div>
                        </div>


                        <div className="border-t border-white/5 pt-6" />

                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Experience</h3>
                            
                            <div className="space-y-4">
                                
                                <ExperienceCard icon="V" name="First" post="Developer" mode="Full-time" time="2026" description="" />
                                <ExperienceCard icon="L" name="Second" post="Developer" mode="Full-time" time="2025" description="" />
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
            <Titlebar title="Activity"></Titlebar>
                <div>
                    <PublicBlock></PublicBlock>
                                
                    <div className="flex flex-col gap-4 p-6">
                        {posts.map((p, index) => {
                            return (
                                <Post key={index} Name={p.Name} UserName={p.UserName} Content={p.Content} Time={p.Time} />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}