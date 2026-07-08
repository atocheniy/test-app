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
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react"; 


export default function Profile() {
    const { userData, UserNameNormalized, userPostsData , refreshUserPostsData} = useApplication();
    const { refreshOtherUserPostsData, refreshOtherUserData, otherUserPostsData, otherUserData } = useApplication();

    const params = useParams();
    const usernameFromUrl = params.username as string;

    const { onlineUsers } = useApplication();
    const cleanUsername = otherUserData.userName;

    const isAuthorOnline = onlineUsers.some(
        (u) => u.toLowerCase() === cleanUsername.toLowerCase()
    );

    const isOwnProfile = usernameFromUrl.toLowerCase() === userData.userName.toLowerCase();
    
    useEffect(() => {
        refreshOtherUserPostsData(usernameFromUrl);
        refreshOtherUserData(usernameFromUrl);
    }, []);

    return (
        <div>
            <div>
                <Titlebar title="Profile"></Titlebar>

                <div className="w-full bg-zinc-900 h-48 border-y border-white/5 rounded-b-xl relative overflow-hidden">
                    {otherUserData.banner && (
                        <img src={otherUserData.banner} className="w-full h-full object-cover" alt="Banner" />
                    )}
                </div>

                <div className="px-10 max-sm:px-5 pb-10 relative">
                    {otherUserData.banner && (
                        <div 
                            className="absolute -top-110 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-11110 select-none"
                            style={{
                                backgroundImage: `url(${otherUserData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    {otherUserData.banner && (
                        <div 
                            className="absolute -top-30 left-1/2 -translate-x-1/2 w-full h-[350px] blur-[50px] opacity-20 pointer-events-none z-0 select-none"
                            style={{
                                backgroundImage: `url(${otherUserData.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}

                    <div className="flex flex-row items-end gap-6 relative z-10">
                        <div className="w-40 h-40 max-sm:w-30 max-sm:h-30  bg-zinc-700 rounded-full shrink-0 -mt-20 border-4 border-[#0a0a0a] relative z-10 shadow-lg">
                            <div className="block w-full h-full rounded-full overflow-hidden cursor-pointer">
                                {otherUserData.avatar && (
                                <img src={otherUserData.avatar} className="w-full h-full object-cover" alt="Avatar" />
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
                            <h2 className="text-2xl font-bold text-zinc-100">{otherUserData.fullName}</h2>
                            <div className="flex flex-row items-center gap-2">
                                <p className="text-sm text-zinc-400">@{otherUserData.userName}</p>
                                <span className="text-sm text-zinc-400">•</span>
                                <p className="text-sm text-zinc-400">Followers</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <p className="text-md font-bold text-zinc-300">
                            {otherUserData.bio_FirstLine || ""}
                        </p>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            {otherUserData.bio_SecondLine || ""}
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
                                
                    <div className="flex flex-col gap-4 p-6 max-sm:p-0 max-sm:py-6 max-sm:pb-[90px]">
                        {otherUserPostsData.map((p, index) => {
                            return (
                                <Post key={index} Id={p.id} Name={otherUserData.fullName} UserName={"@" + otherUserData.userName} Content={p.content} Time={new Date(p.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Avatar={otherUserData.avatar} Likes={p.likesCount} Comments={p.commentsCount} Attachments={p.attachments} commentsList={p.commentsList} />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}