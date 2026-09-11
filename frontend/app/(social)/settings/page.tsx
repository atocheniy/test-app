'use client';

import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { UserService } from "@/services/userService";
import {
    KeyRound,
    Lock,
    LogOut,
    Palette,
    Shield,
    Trash2,
    X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Settings() {
    const { userData, logout } = useApplication();

    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [allowDirectMessages, setAllowDirectMessages] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [blurEnabled, setBlurEnabled] = useState(true);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await UserService.deleteAccount();
            logout();
        } catch (error) {
            console.error("Ошибка при удалении аккаунта:", error);
            alert("Не удалось удалить аккаунт");
            setIsDeleting(false);
        }
    };

    const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
        <button
            type="button"
            onClick={onToggle}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                active ? 'bg-white' : 'bg-zinc-800'
            }`}
        >
            <div
                className={`w-4 h-4 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                    active ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );

    return (
        <div className="flex flex-col min-h-full pb-16 animate-fade-in">
            <Titlebar title="Settings" />

            <div className="p-4 sm:p-6 space-y-6">

                <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/[0.01] backdrop-blur-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                                {userData.avatar ? (
                                    <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-400">
                                        {userData.fullName?.[0] || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-base font-bold text-zinc-100">{userData.fullName}</h3>
                                <span className="text-xs text-zinc-400">@{userData.userName}</span>
                                <span className="text-[11px] text-zinc-500 mt-0.5">{userData.email}</span>
                            </div>
                        </div>

                        <Link
                            href={`/profile/${userData.userName}`}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/5 transition self-start sm:self-auto"
                        >
                            View Public Profile
                        </Link>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-blue-400" />
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Security & Credentials
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5">
                        <div className="py-3 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-zinc-200">Password</h4>
                                <p className="text-xs text-zinc-500">Change your secret password regularly</p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                            >
                                <KeyRound size={13} />
                                Change
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={16} className="text-purple-400" />
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Privacy & Social
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5">
                        <div className="py-3 flex items-center justify-between">
                            <div className="pr-4">
                                <h4 className="text-sm font-medium text-zinc-200">Display Online Status</h4>
                                <p className="text-xs text-zinc-500">Show a green indicator when you are active on the site</p>
                            </div>
                            <Toggle active={showOnlineStatus} onToggle={() => setShowOnlineStatus(!showOnlineStatus)} />
                        </div>

                        <div className="py-3 flex items-center justify-between">
                            <div className="pr-4">
                                <h4 className="text-sm font-medium text-zinc-200">Allow Direct Messages</h4>
                                <p className="text-xs text-zinc-500">Anyone in the community can start a private chat with you</p>
                            </div>
                            <Toggle active={allowDirectMessages} onToggle={() => setAllowDirectMessages(!allowDirectMessages)} />
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Palette size={16} className="text-emerald-400" />
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Interface & Effects
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5">
                        <div className="py-3 flex items-center justify-between">
                            <div className="pr-4">
                                <h4 className="text-sm font-medium text-zinc-200">Progressive Blur & Glassmorphism</h4>
                                <p className="text-xs text-zinc-500">Enable soft gradient blur in headers, feed, and chat panels</p>
                            </div>
                            <Toggle active={blurEnabled} onToggle={() => setBlurEnabled(!blurEnabled)} />
                        </div>

                        <div className="py-3 flex items-center justify-between">
                            <div className="pr-4">
                                <h4 className="text-sm font-medium text-zinc-200">Message Notification Sounds</h4>
                                <p className="text-xs text-zinc-500">Play a subtle audio chime upon receiving new messages</p>
                            </div>
                            <Toggle active={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-red-500/20 bg-red-500/[0.02] space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Trash2 size={16} className="text-red-400" />
                        <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                            Danger Zone
                        </h2>
                    </div>

                    <div className="divide-y divide-red-500/10">
                        <div className="py-3 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-zinc-200">Sign Out</h4>
                                <p className="text-xs text-zinc-500">Log out of your current session on this device</p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition cursor-pointer"
                            >
                                <LogOut size={13} />
                                Sign Out
                            </button>
                        </div>

                        <div className="py-3 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-red-300">Delete Account</h4>
                                <p className="text-xs text-zinc-500">Permanently delete your profile, posts, and chats</p>
                            </div>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                            >
                                <Trash2 size={13} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-[420px] bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-bold text-zinc-100">Change Password</h3>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            alert("Пароль успешно обновлен!");
                            setIsPasswordModalOpen(false);
                            setOldPassword("");
                            setNewPassword("");
                        }} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase">Current Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-zinc-500 uppercase">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs border border-white/10 focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 mt-3 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition"
                            >
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-[420px] bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-6 shadow-2xl relative text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-base font-bold text-zinc-100">Delete Account?</h3>
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                            This action is permanent. All your posts, messages, bookmarks, and account details will be irreversibly erased.
                        </p>

                        <div className="flex gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDeleteAccount}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}