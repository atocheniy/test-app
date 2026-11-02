'use client';

import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import Titlebar from "@/components/titlebar";
import { useApplication } from "@/context/ApplicationContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { UserService } from "@/services/userService";
import {
    KeyRound,
    Languages,
    Lock,
    LogOut,
    Monitor,
    Moon,
    Palette,
    Shield,
    Sun,
    Trash2,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Settings() {
    const { userData, setUserData, connection, logout } = useApplication();
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme, codeFontSize, setCodeFontSize, blurEnabled, setBlurEnabled } = useTheme();
    const isRu = language === 'ru';

    const [mounted, setMounted] = useState(false);
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [allowDirectMessages, setAllowDirectMessages] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (userData && userData.userName && userData.userName !== '...') {
            if (userData.showOnlineStatus !== undefined) {
                setShowOnlineStatus(userData.showOnlineStatus);
            }
            if (userData.allowDirectMessages !== undefined) {
                setAllowDirectMessages(userData.allowDirectMessages);
            }
            if (userData.isPrivate !== undefined) {
                setIsPrivate(userData.isPrivate);
            }
        }
    }, [userData.showOnlineStatus, userData.allowDirectMessages, userData.isPrivate, userData.userName]);

    const handleToggleOnlineStatus = async () => {
        const nextValue = !showOnlineStatus;
        setShowOnlineStatus(nextValue);
        setUserData(prev => ({ ...prev, showOnlineStatus: nextValue }));

        try {
            await UserService.updatePrivacySettings({ showOnlineStatus: nextValue });
            if (connection && connection.state === 'Connected') {
                await connection.invoke("ChangeOnlineStatus", "global", nextValue);
            }
        } catch (error) {
            console.error("Failed to update online status:", error);
            setShowOnlineStatus(!nextValue);
            setUserData(prev => ({ ...prev, showOnlineStatus: !nextValue }));
        }
    };

    const handleToggleDirectMessages = async () => {
        const nextValue = !allowDirectMessages;
        setAllowDirectMessages(nextValue);
        setUserData(prev => ({ ...prev, allowDirectMessages: nextValue }));

        try {
            await UserService.updatePrivacySettings({ allowDirectMessages: nextValue });
        } catch (error) {
            console.error("Failed to update direct messages setting:", error);
            setAllowDirectMessages(!nextValue);
            setUserData(prev => ({ ...prev, allowDirectMessages: !nextValue }));
        }
    };

    const handleToggleIsPrivate = async () => {
        const nextValue = !isPrivate;
        setIsPrivate(nextValue);
        setUserData(prev => ({ ...prev, isPrivate: nextValue }));

        try {
            await UserService.updatePrivacySettings({ isPrivate: nextValue });
        } catch (error) {
            console.error("Failed to update private account setting:", error);
            setIsPrivate(!nextValue);
            setUserData(prev => ({ ...prev, isPrivate: !nextValue }));
        }
    };

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!oldPassword || !newPassword) return;

        if (newPassword.length < 6) {
            setPasswordError(isRu ? "Пароль должен содержать минимум 6 символов" : "Password must be at least 6 characters long");
            return;
        }

        setIsChangingPassword(true);
        try {
            await UserService.changePassword({ oldPassword, newPassword });
            setPasswordSuccess(isRu ? "Пароль успешно обновлен!" : "Password updated successfully!");
            setOldPassword("");
            setNewPassword("");
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordSuccess("");
            }, 1200);
        } catch (err: any) {
            console.error("Ошибка смены пароля:", err);
            const errDetail = err?.response?.data?.[0]?.description 
                || (typeof err?.response?.data === 'string' ? err?.response?.data : null)
                || err?.response?.data?.message 
                || (isRu ? "Неверный текущий пароль или ошибка сервера" : "Invalid current password or server error");
            setPasswordError(errDetail);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await UserService.deleteAccount();
            logout();
        } catch (error) {
            console.error("Ошибка при удалении аккаунта:", error);
            alert(isRu ? "Не удалось удалить аккаунт" : "Failed to delete account");
            setIsDeleting(false);
        }
    };

    const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
        <button
            type="button"
            onClick={onToggle}
            className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                active ? 'bg-white light:bg-zinc-900' : 'bg-zinc-800 light:bg-zinc-200'
            }`}
        >
            <div
                className={`w-4 h-4 rounded-full bg-black light:bg-white shadow-md transform transition-transform duration-200 ${
                    active ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );

    return (
        <div className="flex flex-col min-h-full animate-fade-in">
            <Titlebar title={t.settings.title} />

            <div className="p-4 sm:p-6 space-y-6">

                <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-white/[0.01] backdrop-blur-xl relative overflow-hidden light:bg-zinc-50 light:border-zinc-200/80 light:shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4 min-w-0">
                            <Avatar
                                src={userData.avatar}
                                name={userData.fullName || userData.userName}
                                className="w-14 h-14 text-base border border-white/10 light:border-zinc-300"
                            />
                            <div className="flex flex-col min-w-0">
                                <h3 className="text-base font-bold text-zinc-100 light:text-zinc-900 truncate">{userData.fullName}</h3>
                                <span className="text-xs text-zinc-400 light:text-zinc-600 truncate">@{userData.userName}</span>
                                <span className="text-[11px] text-zinc-500 light:text-zinc-500 mt-0.5 truncate">{userData.email}</span>
                            </div>
                        </div>

                        <Link
                            href="/profile"
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/5 transition self-start sm:self-auto shrink-0 light:bg-zinc-200/60 light:text-zinc-800 light:hover:bg-zinc-200 light:border-zinc-300/60"
                        >
                            {t.settings.viewProfile}
                        </Link>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Languages size={16} className="text-cyan-400" />
                        <h2 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
                            {t.settings.languageSubtitle}
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5 light:divide-zinc-200/80">
                        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.languageTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.languageDesc}</p>
                            </div>
                            
                            <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-zinc-900/80 border border-white/10 light:bg-zinc-100 light:border-zinc-200 shrink-0 self-start sm:self-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => setLanguage('ru')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        language === 'ru'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <span className="text-[11px] font-bold">RU</span>
                                    <span>{t.settings.russian}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLanguage('en')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        language === 'en'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <span className="text-[11px] font-bold">EN</span>
                                    <span>{t.settings.english}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-blue-400" />
                        <h2 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
                            {t.settings.securityTitle}
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5 light:divide-zinc-200/80">
                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.passwordTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.passwordDesc}</p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 transition cursor-pointer shrink-0 light:bg-zinc-100 light:text-zinc-800 light:hover:bg-zinc-200 light:border light:border-zinc-200"
                            >
                                <KeyRound size={13} />
                                {t.settings.changePasswordBtn}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={16} className="text-purple-400" />
                        <h2 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
                            {t.settings.privacyTitle}
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5 light:divide-zinc-200/80">
                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.onlineStatusTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.onlineStatusDesc}</p>
                            </div>
                            <Toggle active={showOnlineStatus} onToggle={handleToggleOnlineStatus} />
                        </div>

                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.directMessagesTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.directMessagesDesc}</p>
                            </div>
                            <Toggle active={allowDirectMessages} onToggle={handleToggleDirectMessages} />
                        </div>

                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.privateProfileTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.privateProfileDesc}</p>
                            </div>
                            <Toggle active={isPrivate} onToggle={handleToggleIsPrivate} />
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-950/20 space-y-4 light:bg-white light:border-zinc-200/80 light:shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Palette size={16} className="text-emerald-400" />
                        <h2 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-wider">
                            {t.settings.interfaceTitle}
                        </h2>
                    </div>

                    <div className="divide-y divide-white/5 light:divide-zinc-200/80">
                        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.themeTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.themeDesc}</p>
                            </div>
                            
                            <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-zinc-900/80 border border-white/10 light:bg-zinc-100 light:border-zinc-200 shrink-0 self-start sm:self-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        theme === 'dark'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <Moon size={13} />
                                    <span>{t.settings.themeDark}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        theme === 'light'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <Sun size={13} />
                                    <span>{t.settings.themeLight}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('system')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        theme === 'system'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <Monitor size={13} />
                                    <span>{t.settings.themeSystem}</span>
                                </button>
                            </div>
                        </div>

                        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.codeFontSizeTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.codeFontSizeDesc}</p>
                            </div>
                            
                            <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-zinc-900/80 border border-white/10 light:bg-zinc-100 light:border-zinc-200 shrink-0 self-start sm:self-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => setCodeFontSize('sm')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        codeFontSize === 'sm'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <span>{t.settings.codeFontSm}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCodeFontSize('md')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        codeFontSize === 'md'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <span>{t.settings.codeFontMd}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCodeFontSize('lg')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                        codeFontSize === 'lg'
                                            ? 'bg-white text-black shadow-lg shadow-white/10 light:bg-white light:text-zinc-900 light:shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-200/60'
                                    }`}
                                >
                                    <span>{t.settings.codeFontLg}</span>
                                </button>
                            </div>
                        </div>

                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.blurTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.blurDesc}</p>
                            </div>
                            <Toggle active={blurEnabled} onToggle={() => setBlurEnabled(!blurEnabled)} />
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-red-500/20 bg-red-500/[0.02] space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Trash2 size={16} className="text-red-400" />
                        <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                            {t.settings.dangerTitle}
                        </h2>
                    </div>

                    <div className="divide-y divide-red-500/10">
                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-zinc-200 light:text-zinc-900">{t.settings.signOutTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.signOutDesc}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition cursor-pointer shrink-0 light:bg-zinc-100 light:text-zinc-800 light:hover:bg-zinc-200 light:border-zinc-200/60"
                            >
                                <LogOut size={13} />
                                {t.settings.signOutBtn}
                            </button>
                        </div>

                        <div className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-red-300 light:text-red-600">{t.settings.deleteAccountTitle}</h4>
                                <p className="text-xs text-zinc-500 light:text-zinc-600">{t.settings.deleteAccountDesc}</p>
                            </div>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer shrink-0 light:bg-red-50 light:text-red-600 light:border-red-200"
                            >
                                <Trash2 size={13} />
                                {t.settings.deleteBtn}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                    setOldPassword("");
                    setNewPassword("");
                }}
                className="w-full max-w-[420px] mx-4 bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative light:bg-white light:border-zinc-200"
            >
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-neutral-100 light:text-zinc-900">{t.settings.modalChangePasswordTitle}</h3>
                    <button
                        onClick={() => {
                            setIsPasswordModalOpen(false);
                            setPasswordError("");
                            setPasswordSuccess("");
                            setOldPassword("");
                            setNewPassword("");
                        }}
                        className="p-1 rounded-full text-neutral-500 hover:text-white transition cursor-pointer light:hover:text-zinc-900"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                    {passwordError && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs light:bg-red-50 light:border-red-200 light:text-red-600">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs light:bg-emerald-50 light:border-emerald-200 light:text-emerald-700">
                            {passwordSuccess}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-neutral-500 light:text-zinc-500 uppercase">{t.settings.currentPasswordLabel}</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.02] text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/20 light:bg-zinc-100/80 light:text-zinc-900 light:border-zinc-200 light:focus:border-zinc-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-neutral-500 light:text-zinc-500 uppercase">{t.settings.newPasswordLabel}</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.02] text-neutral-100 text-xs border border-white/10 focus:outline-none focus:border-white/20 light:bg-zinc-100/80 light:text-zinc-900 light:border-zinc-200 light:focus:border-zinc-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-2.5 mt-3 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition disabled:opacity-50 cursor-pointer light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                    >
                        {isChangingPassword ? t.settings.updatingPasswordBtn : t.settings.updatePasswordBtn}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                className="w-full max-w-[420px] mx-4 bg-[#0a0a0a]/85 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-6 shadow-2xl relative text-center light:bg-white light:border-red-200"
            >
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4 light:bg-red-50 light:border-red-200 light:text-red-500">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-base font-bold text-neutral-100 light:text-zinc-900">{t.settings.modalDeleteTitle}</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed light:text-zinc-600">
                    {t.settings.modalDeleteDesc}
                </p>

                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition cursor-pointer light:bg-zinc-100 light:text-zinc-800 light:hover:bg-zinc-200"
                    >
                        {t.settings.cancelBtn}
                    </button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                        {isDeleting ? t.settings.deletingBtn : t.settings.confirmDeleteBtn}
                    </button>
                </div>
            </Modal>

        </div>
    );
}