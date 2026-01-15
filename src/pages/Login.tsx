import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            const provider = new GoogleAuthProvider();
            const userCred = await signInWithPopup(auth, provider);

            // Check if user exists, if not create profile
            const { getDoc, doc, setDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const docRef = doc(db, 'users', userCred.user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    uid: userCred.user.uid,
                    email: userCred.user.email,
                    xp: 0,
                    level: 1,
                    joinedAt: Timestamp.now()
                });
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError('Failed to sign in with Google. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                // Create User Profile
                const { setDoc, doc, Timestamp } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                await setDoc(doc(db, 'users', userCred.user.uid), {
                    uid: userCred.user.uid,
                    email: userCred.user.email,
                    xp: 0,
                    level: 1,
                    joinedAt: Timestamp.now()
                });
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            <div className="relative z-10 w-full max-w-md glass-panel p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-up border border-white/10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-text-primary via-primary to-text-primary bg-clip-text text-transparent mb-3 tracking-tight drop-shadow-sm">
                        HabitForge
                    </h1>
                    <p className="text-text-secondary font-medium">
                        {isLogin ? 'Welcome back to the forge.' : 'Begin your discipline journey.'}
                    </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-6">
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="••••••••"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && (
                        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-bold flex items-center justify-center animate-shake">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full text-lg h-12 shadow-xl shadow-primary/20" isLoading={loading}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="my-8 flex items-center gap-4 text-text-muted text-xs font-bold uppercase tracking-widest">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    OR
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <Button
                    variant="outline"
                    className="w-full h-12 border-border/50 dark:border-white/10 hover:bg-secondary/50 hover:text-text-primary hover:border-primary/30"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </Button>

                <p className="mt-8 text-center text-sm text-text-secondary">
                    {isLogin ? "New to the forge? " : "Already forged? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary hover:text-primary-hover hover:underline font-bold transition-colors"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};
