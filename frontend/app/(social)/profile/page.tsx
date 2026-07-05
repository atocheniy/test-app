'use client';

import {$api } from "@/api/axios";

import ExperienceCard from "@/components/exp_card";
import Post from "@/components/post";
import ProjectCard from "@/components/project_card";
import PublicBlock from "@/components/public_block";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { UserService } from "@/services/userService";
import { UpdateBio } from "@/types/auth";
import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { useEffect } from "react"; 


export default function Profile() {
    const { userData, UserNameNormalized, userPostsData , refreshUserPostsData} = useApplication();
    const { refreshUserData } = useApplication();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsUploading] = useState(false);

    const [editFullName, setEditFullName] = useState(userData.fullName || '');
    const [editUserName, setEditUserName] = useState(userData.userName  || '');
    const [editBioFirstLine, setEditBioFirstLine] = useState(userData.bio_FirstLine || '');
    const [editBioSecondLine, setEditBioSecondLine] = useState(userData.bio_SecondLine || '');

    const post = { Name: "", UserName: "", Content: "", Time: "" };
    const posts = Array.from({ length: 10 }, () => post);

    useEffect(() => {
        refreshUserPostsData();
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            await UserService.changeBio({firstLine: editBioFirstLine, secondLine: editBioSecondLine});
            await UserService.changeName({fullName: editFullName});
            await UserService.changeUserName({userName: editUserName});

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

    return (
        <div>
            <div>
                <Titlebar title="Profile"></Titlebar>

                <div className="w-full bg-zinc-900 h-48 border-b border-white/5 rounded-b-xl relative overflow-hidden">
                    {userData.banner && (
                        <img src={userData.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 pb-10 relative">
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
                        <div className="w-40 h-40 bg-zinc-700 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] relative z-10 shadow-lg overflow-hidden">
                            {userData.avatar && (
                                <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            )}
                        </div>
                        <div className="mb-2">
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
                                    setIsEditOpen(true);
                                }}>
                                Edit Profile
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
                    <PublicBlock Avatar={userData.avatar}></PublicBlock>
                                
                    <div className="flex flex-col gap-4 p-6">
                        {userPostsData.map((p, index) => {
                            return (
                                <Post key={index} Id={p.id} Name={userData.fullName} UserName={UserNameNormalized} Content={p.content} Time={new Date(p.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Avatar={userData.avatar} Likes={p.likesCount} Comments={p.commentsCount} Attachments={p.attachments} commentsList={p.commentsList} />
                            );
                        })}
                    </div>
                </div>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fadeIn">
                    <div className="w-full max-w-[480px] bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl relative">
                        
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