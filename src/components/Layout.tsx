import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Trophy, UserCircle, LogOut } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/Button';
import { LevelBadge } from '@/components/LevelBadge';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user } = useAuth();
    const [xp, setXp] = useState(0);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                setXp(doc.data().xp || 0);
            }
        });
        return () => unsub();
    }, [user]);

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Habit Fixer', icon: Target, path: '/fixer' }, // Note: Fixer usually accessed via habit, but keeping link
        { label: 'Analytics', icon: Trophy, path: '/analytics' },
        { label: 'Profile', icon: UserCircle, path: '/profile' },
    ];

    return (
        <div className="h-screen bg-background text-text-primary flex relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] opacity-20" />
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden min-[900px]:flex w-72 flex-col border-r border-white/5 bg-surface/30 backdrop-blur-xl p-6 z-20 shadow-2xl shrink-0">
                <div className="flex items-center gap-4 mb-10 px-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/40 transition-all duration-500" />
                        <svg className="w-10 h-10 relative z-10 drop-shadow-[0_0_10px_rgba(0,230,118,0.5)]" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="8" width="112" height="112" rx="28" className="fill-surface-light dark:fill-[#0F172A]" />
                            <path d="M64 28 L92 40 V64 C92 82 76 94 64 100 C52 94 36 82 36 64 V40 L64 28Z" fill="#00E676" />
                            <path d="M52 64 L60 72 L78 52" className="stroke-surface-light stroke-[#0F172A]" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-primary/70 tracking-tight">HabitForge</span>
                </div>

                <div className="mb-8 px-2">
                    <Link to="/levels" className="block transform hover:scale-[1.02] transition-transform duration-300">
                        <LevelBadge xp={xp} />
                    </Link>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link to={item.path} key={item.path}>
                                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-[0_0_20px_rgba(0,230,118,0.1)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                    }`}>
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_#00E676]" />}
                                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]' : 'group-hover:scale-110'}`} />
                                    <span className="tracking-wide">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 justify-start gap-3 px-4 text-error/70 hover:text-error hover:bg-error/10 transition-colors"
                        onClick={() => auth.signOut()}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </Button>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative z-10">
                {/* Mobile Header Elements */}
                <div className="min-[900px]:hidden fixed top-4 right-4 z-50">
                    <ThemeToggle className="bg-surface/50 backdrop-blur-md shadow-lg border border-white/10" />
                </div>

                <div className="max-w-6xl mx-auto animate-fade-in pb-32 md:pb-8 safe-area-bottom">
                    {children}
                </div>
            </main>

            {/* Mobile Navbar (Floating Island) */}
            <nav className="min-[900px]:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 ring-1 ring-white/5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link to={item.path} key={item.path} className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-background shadow-[0_0_15px_rgba(0,230,118,0.4)] scale-110' : 'text-text-secondary hover:text-primary'}`}>
                            <Icon size={22} />
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};
