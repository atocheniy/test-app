'use client';
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { User } from "@/types/auth";
import { UserService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import Cookies from 'js-cookie';

interface ApplicationContextType {
    userData: User;
    refreshUserData: () => Promise<void>;

    logout: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
   
    const [userData, setUserData] = useState<User>({ fullName: 'Загрузка...', email: '' });

    const refreshUserData = async () => {
        try {
            const data = await UserService.getUser();
            setUserData(data);
            
        } catch (error) {
            console.error("Ошибка обновления данных пользователя", error);
            setUserData({ fullName: 'Гость', email: 'Ошибка загрузки' });
        }
    };

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) refreshUserData();
        else setUserData({ fullName: 'Гость', email: '' });
    }, []);

    const logout = () => {
        setUserData({ 
            fullName: 'Загрузка...', 
            email: '', 
        });

        AuthService.logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
    };

    const contextValue = useMemo(() => ({ 
        userData, 
        refreshUserData, 
        logout 
    }), [userData]);

    return (
        <ApplicationContext.Provider value={ contextValue }>
            {children}
        </ApplicationContext.Provider>
    );
};

export const useApplication = () => {
    const context = useContext(ApplicationContext);
    if (!context) throw new Error("useApplication must be used within ApplicationProvider");
    return context;
};