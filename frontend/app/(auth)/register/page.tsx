'use client';
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Register() {
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError('');

        if (!email || !password || !fullName || !userName) {
            setError('Заполните все поля');
            return;
        }
        if (password !== confirmPass) {
            setError('Пароли не совпадают');
            return;
        }

        try 
        {
            await AuthService.register({ email, userName, password, fullName });
            router.push('/feed');  
        } 
        catch (err: any) 
        {
            console.error(err);
            setError(err.response?.data?.message || "Ошибка регистрации");
        }
    };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3 text-xs md:text-sm">
            <span className="text-zinc-500 hidden sm:inline">Offering a job?</span>
            <a 
            href="/register/employer"
            className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-900 hover:border-white/10 text-zinc-300 transition-all font-medium"
            >
            Employer registration
            </a>
      </div>

      <div className="w-full max-w-[400px] bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-5 h-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Create an account</h1>
          <p className="text-xs text-zinc-500 mt-1.5">Enter your details to create your account</p>
        </div>

        <form className="space-y-4 relative z-10" onSubmit={(e) => {
            e.preventDefault()
            handleRegister();
        }}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Name</label>
            <input
              type="text"
              placeholder="Name"
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              placeholder="@username"
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Confirm Password</label>
            </div>
            <input
              type="confirm-password"
              placeholder="••••••••"
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 text-sm border border-white/5 placeholder-zinc-700 focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-xl bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200"
          >
            Sign Up
          </button>

          <div className="relative my-6 z-10 flex items-center justify-center">
            {error && <p className="align-center text-red-500 text-xs mt-2">{error}</p>}
          </div>
        </form>

        <div className="relative my-6 z-10 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 text-[10px] text-zinc-500 bg-[#0a0a0a] uppercase tracking-wider">or</span>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:bg-zinc-900 hover:border-white/10 transition-all duration-200">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 hover:bg-zinc-900 hover:border-white/10 transition-all duration-200">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.61 4.5 1.7l2.42-2.42C17.29 1.75 14.93 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.78 0-.66-.08-1.3-.21-1.935H12.24z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-8 relative z-10">
          Already have an account?{' '}
          <a href="/login" className="text-zinc-300 hover:underline transition-all">
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}