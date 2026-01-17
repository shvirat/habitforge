import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Habit } from '@/types';
import { Button } from '@/components/Button';
import { CameraCapture } from '@/features/camera/CameraCapture';
import { applyWatermark } from '@/utils/canvasWatermark';
import { HabitService } from '@/features/habits/HabitService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import { ArrowLeft, Clock, ShieldCheck, AlertTriangle, Camera } from 'lucide-react';
import { clsx } from 'clsx';

import { ProofGallery } from '@/components/ProofGallery';

export const HabitFixerPage = () => {
    const { habitId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [habit, setHabit] = useState<Habit | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [windowState, setWindowState] = useState<'open' | 'early' | 'late'>('early');

    useEffect(() => {
        const checkTime = () => {
            const hours = new Date().getHours();
            // 6 PM = 18, 11 PM = 23
            if (hours >= 18 && hours <= 23) setWindowState('open');
            else if (hours < 18) setWindowState('early');
            else setWindowState('late');
        };
        checkTime();
        const timer = setInterval(checkTime, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!habitId) return;
        const fetchHabit = async () => {
            try {
                const docRef = doc(db, 'habits', habitId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setHabit({
                        id: docSnap.id,
                        ...data,
                        // Fix: Convert Firestore Timestamp to JS Date
                        lastCompleted: data.lastCompleted?.toDate ? data.lastCompleted.toDate() : data.lastCompleted
                    } as Habit);
                } else {
                    toast.error('Habit not found');
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchHabit();
    }, [habitId]);

    const handleCapture = async (blob: Blob) => {
        if (!user || !habit) return;
        try {
            setUploading(true);
            const watermarkText = { habitName: habit.title, userName: user.email?.split('@')[0] };
            const watermarkedBlob = await applyWatermark(blob, watermarkText);

            await HabitService.completeHabitWithProof(user.uid, habit.id, watermarkedBlob);

            toast.success('Proof verified! Protocol complete.');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Verification failed. Try again.');
            console.error(error);
        } finally {
            setUploading(false);
            setShowCamera(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading protocol details...</div>;
    if (!habit) return null;

    return (
        <div className="max-w-xl mx-auto py-8">
            <Button variant="ghost" className="mb-6 pl-0 text-text-muted hover:text-text-primary hover:bg-transparent -ml-2" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
            </Button>

            <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden border-t border-white/10">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 shadow-[0_0_15px_rgba(255,61,0,0.2)]">
                        <ShieldCheck className="text-accent" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Verification Protocol</h1>
                        <p className="text-text-secondary text-sm font-medium">Verify your discipline with photographic evidence.</p>
                    </div>
                </div>

                <div className="mb-8 p-6 bg-surface/40 backdrop-blur-sm rounded-2xl border border-white/5 relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-2xl" />
                    <h2 className="text-xl font-bold mb-2 text-text-primary">{habit.title}</h2>
                    <p className="text-text-secondary text-sm italic leading-relaxed">"{habit.purpose}"</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className={clsx(
                        "flex items-center justify-between rounded-xl border p-2 transition-all duration-300",
                        windowState === 'open'
                            ? "bg-success/5 border-success/30 text-success shadow-[0_0_20px_rgba(0,230,118,0.05)]"
                            : "bg-surface/30 border-white/5 text-text-muted"
                    )}>
                        <div className="flex items-center gap-4">
                            <Clock size={24} className={windowState === 'open' ? "animate-pulse" : ""} />
                            <div>
                                <p className="font-bold uppercase tracking-wider text-xs mb-0.5">Check-in Window</p>
                                <p className="text-sm font-medium">6:00 PM – 11:00 PM</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={clsx(
                                "font-black font-mono text-l tracking-widest",
                                windowState === 'open' ? "text-success text-glow" : "text-text-muted"
                            )}>
                                {windowState === 'open' ? 'ACTIVE' : 'LOCKED'}
                            </p>
                        </div>
                    </div>

                    {/* Completion Check */}
                    {habit.lastCompleted && habit.lastCompleted.toDateString() === new Date().toDateString() ? (
                        <div className="flex flex-col items-center justify-center p-10 bg-success/5 rounded-2xl border border-success/20 text-center animate-fade-in relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
                            <div className="w-20 h-20 bg-success text-background rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,230,118,0.4)] animate-scale-up">
                                <ShieldCheck size={40} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tight">Protocol Verified</h3>
                            <p className="text-text-secondary mb-8 max-w-xs mx-auto">You have successfully proved your discipline for today. The forge grows stronger.</p>
                            <div className="flex flex-col md:flex-row gap-4">
                                <Button className="min-w-[160px]" variant="outline" onClick={() => navigate('/dashboard')}>
                                    Back to Dashboard
                                </Button>
                                <Button className="min-w-[160px]" variant="secondary" onClick={() => setShowHistory(true)}>
                                    View History
                                </Button>
                            </div>
                        </div>
                    ) : windowState === 'open' ? (
                        <Button
                            className="w-full h-14 text-l font-bold bg-accent hover:bg-accent/90 shadow-[0_0_30px_rgba(255,61,0,0.3)] hover:shadow-[0_0_50px_rgba(255,61,0,0.5)] border border-accent/50 transition-all duration-300 group  rounded-xl"
                            onClick={() => setShowCamera(true)}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-3">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <Camera size={28} className="group-hover:scale-110 transition-transform" />
                                    Initiate Verification
                                </span>
                            )}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-3 p-2 text-text-muted text-sm justify-center bg-surface/30 rounded-xl border border-white/5 border-dashed">
                            <AlertTriangle size={18} />
                            <span>Verification protocol is currently locked.</span>
                        </div>
                    )}

                    {/* Always show history option if not verified (since verified state has its own button) */}
                    {!(habit.lastCompleted && habit.lastCompleted.toDateString() === new Date().toDateString()) && (
                        <div className="flex justify-center mt-4">
                            <Button variant="ghost" className="text-sm text-text-muted hover:text-text-primary" onClick={() => setShowHistory(true)}>
                                View Past Verifications
                            </Button>
                        </div>
                    )}
                </div>
            </div>



            {showCamera && (
                <CameraCapture
                    onCapture={handleCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            <ProofGallery
                habitId={habit.id}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </div >
    );
};
