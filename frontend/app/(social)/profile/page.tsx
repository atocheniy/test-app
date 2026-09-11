'use client';


import ExperienceCard from "@/components/exp_card";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import { PostSkeleton, ProfileSkeleton } from "@/components/skeletons";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { UserService } from "@/services/userService";
import { upload } from "@vercel/blob/client";
import { ArrowUpRight, Briefcase, ChevronDown, Code2, Globe, Mail, MapPin, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Profile() {
    const { userData, UserNameNormalized, userPostsData , refreshUserPostsData} = useApplication();
    const { refreshUserData } = useApplication();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsUploading] = useState(false);

    const [editFullName, setEditFullName] = useState(userData.fullName || '');
    const [editUserName, setEditUserName] = useState(userData.userName  || '');
    const [editBioFirstLine, setEditBioFirstLine] = useState(userData.bio_FirstLine || '');
    const [editBioSecondLine, setEditBioSecondLine] = useState(userData.bio_SecondLine || '');

    const [editLocation, setEditLocation] = useState(userData.location || '');
    const [editWorkStatus, setEditWorkStatus] = useState(userData.workStatus || '');
    const [editGithub, setEditGithub] = useState(userData.githubUrl || '');
    const [editTelegram, setEditTelegram] = useState(userData.telegramUrl || '');
    const [editVk, setEditVk] = useState(userData.vkUrl || '');
    const [editX, setEditX] = useState(userData.xUrl || '');
    const [editDiscord, setEditDiscord] = useState(userData.discordUrl || '');
    const [editWebsite, setEditWebsite] = useState(userData.websiteUrl || '');

    const [isLinksExpanded, setIsLinksExpanded] = useState(false);
    const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);

    const post = { Name: "", UserName: "", Content: "", Time: "" };
    const posts = Array.from({ length: 10 }, () => post);

    const { onlineUsers } = useApplication();
    const cleanUsername = userData.userName;

    const isAuthorOnline = onlineUsers.some(
        (u) => u.toLowerCase() === cleanUsername.toLowerCase()
    );

    const [isPostsLoading, setIsPostsLoading] = useState(userPostsData.length === 0);

    useEffect(() => {
        document.title = 'Profile';
        const load = async () => {
            if (userPostsData.length === 0) setIsPostsLoading(true);
            await refreshUserPostsData();
            setIsPostsLoading(false);
        };
        load();
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            await UserService.changeBio({firstLine: editBioFirstLine, secondLine: editBioSecondLine});
            await UserService.changeName({fullName: editFullName});
            await UserService.changeUserName({userName: editUserName});
            await UserService.changeDetails({
                location: editLocation,
                workStatus: editWorkStatus,
                githubUrl: editGithub,
                telegramUrl: editTelegram,
                vkUrl: editVk,
                xUrl: editX,
                discordUrl: editDiscord,
                websiteUrl: editWebsite,
            });

            await refreshUserData();
            setIsEditOpen(false);
        } catch (error) {
            console.error("Ошибка обновления профиля:", error);
            alert("Не удалось сохранить изменения");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/avatar/upload',
            });
            await UserService.changeAvatar({avatar: newBlob.url})
            await refreshUserData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/banner/upload',
            });
            await UserService.changeBanner({banner: newBlob.url})
            await refreshUserData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    if (!userData?.id || userData.userName === '...') {
        return <ProfileSkeleton />;
    }

    return (
        <div className="animate-fade-in">
            <div>
                <Titlebar title="Profile"></Titlebar>

                <div className="w-full bg-zinc-900 h-48 border-y border-white/5 rounded-b-xl relative overflow-hidden">
                    {userData.banner && (
                        <img src={userData.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 pb-10 max-sm:px-5 relative">
                    {userData.banner && (
                        <div 
                            className="absolute -top-110 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-11110 select-none"
                            style={{
                                backgroundImage: `url(${userData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    {userData.banner && (
                        <div 
                            className="absolute -top-30 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-0 select-none"
                            style={{
                                backgroundImage: `url(${userData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    <div className="flex flex-row items-end gap-6 relative z-10">
                        <div className="relative w-40 h-40 max-sm:w-30 max-sm:h-30 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] relative z-10 shadow-lg">
                            <div className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                {userData.avatar && (
                                    <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                )}
                            </div>
                            {isAuthorOnline && (
                                <span 
                                    className="absolute bottom-2 right-2 w-5 h-5 bg-white border-2 border-[#0a0a0a] rounded-full" 
                                    title="Online"
                                />
                            )}
                        </div>
                        <div className="mb-2 max-sm:mt-5">
                            <h2 className="text-2xl font-bold text-zinc-100">{userData.fullName}</h2>
                            <div className="flex flex-row items-center gap-2">
                                <p className="text-sm text-zinc-400">{UserNameNormalized}</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">Followers</p>
                            </div>
                        </div>
                        <div className="ml-auto mb-5">
                            <button className="px-4 py-2 text-sm font-medium bg-white text-stone-950 rounded-3xl hover:bg-stone-300 transition"
                            onClick={() => {
                                    setEditFullName(userData.fullName || '');
                                    setEditUserName(userData.userName || '');
                                    setEditBioFirstLine(userData.bio_FirstLine || '');
                                    setEditBioSecondLine(userData.bio_SecondLine || '');
                                    setEditLocation(userData.location || '');
                                    setEditWorkStatus(userData.workStatus || '');
                                    setEditGithub(userData.githubUrl || '');
                                    setEditTelegram(userData.telegramUrl || '');
                                    setEditVk(userData.vkUrl || '');
                                    setEditX(userData.xUrl || '');
                                    setEditDiscord(userData.discordUrl || '');
                                    setEditWebsite(userData.websiteUrl || '');
                                    setIsEditOpen(true);
                                }}>
                                Edit
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <p className="text-md font-bold text-zinc-300">
                            {userData.bio_FirstLine || ""}
                        </p>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            {userData.bio_SecondLine || ""}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

                        <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl">
                            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                                Details
                            </h4>
                            
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Location</span>
                                        <span className="text-xs text-zinc-200 font-medium">
                                            {userData.location || "Not specified"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                        <Briefcase size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Status</span>
                                        <span className="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                            </span>
                                            {userData.workStatus || "Open to opportunities"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Focus</span>
                                        <span className="text-xs text-zinc-200 font-medium">
                                            Fullstack & Realtime Architecture
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-start p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-colors duration-200 rounded-2xl">
                            {(() => {
                                const userLinks = [
                                    userData.githubUrl && { 
                                        label: 'GitHub', 
                                        display: userData.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\/?/, ''), 
                                        url: userData.githubUrl.startsWith('http') ? userData.githubUrl : `https://github.com/${userData.githubUrl}`, 
                                        icon: Code2 
                                    },
                                    userData.telegramUrl && { 
                                        label: 'Telegram', 
                                        display: `@${userData.telegramUrl.replace(/^https?:\/\/t\.me\/?/, '').replace(/^@/, '')}`, 
                                        url: userData.telegramUrl.startsWith('http') ? userData.telegramUrl : `https://t.me/${userData.telegramUrl.replace(/^@/, '')}`, 
                                        icon: Send 
                                    },
                                    userData.vkUrl && { 
                                        label: 'VK', 
                                        display: 'VK Profile', 
                                        url: userData.vkUrl.startsWith('http') ? userData.vkUrl : `https://${userData.vkUrl}`, 
                                        icon: Globe 
                                    },
                                    userData.xUrl && { 
                                        label: 'X (Twitter)', 
                                        display: 'X Profile', 
                                        url: userData.xUrl.startsWith('http') ? userData.xUrl : `https://${userData.xUrl}`, 
                                        icon: Globe 
                                    },
                                    userData.discordUrl && { 
                                        label: 'Discord', 
                                        display: userData.discordUrl, 
                                        url: userData.discordUrl.startsWith('http') ? userData.discordUrl : `https://${userData.discordUrl}`, 
                                        icon: Globe 
                                    },
                                    userData.websiteUrl && { 
                                        label: 'Portfolio', 
                                        display: userData.websiteUrl.replace(/^https?:\/\//, ''), 
                                        url: userData.websiteUrl.startsWith('http') ? userData.websiteUrl : `https://${userData.websiteUrl}`, 
                                        icon: Globe 
                                    },
                                    userData.email && { 
                                        label: 'Email', 
                                        display: userData.email, 
                                        url: `mailto:${userData.email}`, 
                                        icon: Mail 
                                    },
                                ].filter(Boolean) as { label: string; display: string; url: string; icon: any }[];

                                const visibleLinks = isLinksExpanded ? userLinks : userLinks.slice(0, 3);

                                return (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                                Links & Contacts
                                            </h4>
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {userLinks.length}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {userLinks.length === 0 ? (
                                                <p className="text-xs text-zinc-500 py-3 text-center">
                                                    No links added yet
                                                </p>
                                            ) : (
                                                visibleLinks.map((link, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between p-2 px-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-150 group"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <link.icon size={13} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                                                            <span className="text-xs font-medium text-zinc-200">{link.label}</span>
                                                            {link.display && (
                                                                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline truncate max-w-[150px]">
                                                                    {link.display}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ArrowUpRight 
                                                            size={13} 
                                                            className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 shrink-0" 
                                                        />
                                                    </a>
                                                ))
                                            )}

                                            {userLinks.length > 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                                                    className="w-full mt-1.5 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition"
                                                >
                                                    <span>{isLinksExpanded ? "Show less" : `Show all (+${userLinks.length - 3})`}</span>
                                                    <ChevronDown 
                                                        size={12} 
                                                        className={`transition-transform duration-200 ${isLinksExpanded ? "rotate-180" : ""}`} 
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
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
                    <PublicBlock Avatar={userData.avatar}></PublicBlock>
                                
                   <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                        {isPostsLoading ? (
                            <>
                                <PostSkeleton />
                                <PostSkeleton />
                            </>
                        ) : userPostsData.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-8 select-none">No posts yet</p>
                        ) : (
                            userPostsData.map((p) => (
                                <div key={p.id} className="animate-fade-in">
                                    <Post 
                                        Id={p.id} 
                                        Name={userData.fullName} 
                                        UserName={UserNameNormalized} 
                                        Content={p.content} 
                                        Time={new Date(p.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                        Avatar={userData.avatar} 
                                        Likes={p.likesCount} 
                                        isLikedByMe={p.isLikedByMe} 
                                        Comments={p.commentsCount} 
                                        Attachments={p.attachments} 
                                        commentsList={p.commentsList} 
                                        repostsCount={p.repostsCount} 
                                        repostOfPost={p.repostOfPost}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fadeIn">
                    <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl relative">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-zinc-100">Edit Profile</h3>
                            <button 
                                onClick={() => setIsEditOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300 text-xs transition"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6 pb-6 border-b border-white/5">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Avatar</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                        </div>

                         <div className="flex gap-4 mb-6 pb-6 border-b border-white/5">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Banner</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    disabled={isSaving}
                                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-black cursor-pointer"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    placeholder="Your Name"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Username</label>
                                <input
                                    type="text"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    placeholder="@username"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">First Line</label>
                                <input
                                    type="text"
                                    value={editBioFirstLine}
                                    onChange={(e) => setEditBioFirstLine(e.target.value)}
                                    placeholder="Frontend Developer | UI Designer"
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Second Line</label>
                                <textarea
                                    value={editBioSecondLine}
                                    onChange={(e) => setEditBioSecondLine(e.target.value)}
                                    placeholder="Tell something about yourself..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 focus:outline-none focus:border-white/10 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Location</label>
                                    <input
                                        type="text"
                                        value={editLocation}
                                        onChange={(e) => setEditLocation(e.target.value)}
                                        placeholder="e.g. Moscow / Remote"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Job Status</label>
                                    <input
                                        type="text"
                                        value={editWorkStatus}
                                        onChange={(e) => setEditWorkStatus(e.target.value)}
                                        placeholder="e.g. Fullstack Developer"
                                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                    />
                                </div>
                            </div>

                            <div className="border border-white/5 rounded-2xl p-3.5 bg-zinc-950/40">
                                <button
                                    type="button"
                                    onClick={() => setIsEditLinksOpen(!isEditLinksOpen)}
                                    className="w-full flex items-center justify-between text-left transition"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                            Social Links & Contacts
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 font-mono">
                                            {[editGithub, editTelegram, editVk, editX, editDiscord, editWebsite].filter(Boolean).length}/6
                                        </span>
                                    </div>
                                    <ChevronDown 
                                        size={14} 
                                        className={`text-zinc-500 transition-transform duration-200 ${isEditLinksOpen ? "rotate-180" : ""}`} 
                                    />
                                </button>

                                {isEditLinksOpen && (
                                    <div className="space-y-2.5 mt-3 pt-3 border-t border-white/5 animate-in fade-in duration-150">
                                        <input
                                            type="text"
                                            value={editGithub}
                                            onChange={(e) => setEditGithub(e.target.value)}
                                            placeholder="GitHub URL (https://github.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                        <input
                                            type="text"
                                            value={editTelegram}
                                            onChange={(e) => setEditTelegram(e.target.value)}
                                            placeholder="Telegram URL (https://t.me/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                        <input
                                            type="text"
                                            value={editVk}
                                            onChange={(e) => setEditVk(e.target.value)}
                                            placeholder="VK URL (https://vk.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                        <input
                                            type="text"
                                            value={editX}
                                            onChange={(e) => setEditX(e.target.value)}
                                            placeholder="X / Twitter URL (https://x.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                        <input
                                            type="text"
                                            value={editDiscord}
                                            onChange={(e) => setEditDiscord(e.target.value)}
                                            placeholder="Discord URL (https://discord.com/...)"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                        <input
                                            type="text"
                                            value={editWebsite}
                                            onChange={(e) => setEditWebsite(e.target.value)}
                                            placeholder="Portfolio / Website URL"
                                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/5 focus:outline-none focus:border-white/10"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 mt-4 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}