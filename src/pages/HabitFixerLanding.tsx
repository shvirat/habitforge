import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { HabitService } from '@/features/habits/HabitService';
import type { Habit } from '@/types';
import { Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';

export const HabitFixerLanding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHabits = async () => {
            if (!user) return;
            try {
                // Fetch habits that are marked as "Habit Fixer" type (we'll filter client side for now if needed, or update query)
                // For now, assuming all "isHabitFixer" habits need verification
                const allHabits = await HabitService.getUserHabits(user.uid);
                setHabits(allHabits.filter(h => h.isHabitFixer));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadHabits();
    }, [user]);

    return (
        <div className="space-y-8 relative">
            {/* Background Glow */}
            <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="relative z-10">
                <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-red-500 mb-2 tracking-tight drop-shadow-sm">Habit Fixer</h1>
                <p className="text-text-secondary text-base md:text-lg">Prove your discipline with photographic evidence.</p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-text-muted font-bold tracking-wider animate-pulse uppercase text-sm">Loading Targets...</p>
                </div>
            ) : habits.length === 0 ? (
                <div className="text-center py-12 md:py-24 glass-panel rounded-3xl border-dashed relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-center mb-6 relative z-10">
                        <div className="p-4 bg-surface/50 rounded-full border border-white/5 shadow-inner">
                            <Camera size={48} className="text-text-muted/50" />
                        </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3 relative z-10">No Fixer Protocols Active</h3>
                    <p className="text-text-secondary mb-8 max-w-md mx-auto relative z-10 px-4">
                        "Habit Fixer" protocols require you to upload a photo as proof of completion.
                        Create a new habit and select "Hard Mode" to start.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="relative z-10 border-accent/30 text-accent hover:bg-accent/10">Go to Dashboard</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {habits.map((habit) => (
                        <div key={habit.id} className="glass-card rounded-2xl p-5 md:p-6 group relative overflow-hidden border-accent/20 hover:border-accent/50 transition-all duration-300 flex flex-col">
                            {/* Hover Effect */}
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <h3 className="font-bold text-xl text-text-primary mb-2 relative z-10 group-hover:text-accent transition-colors">{habit.title}</h3>
                            <p className="text-text-secondary text-sm mb-8 relative z-10 line-clamp-3">{habit.purpose}</p>
                            <Button
                                className="w-full bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 border border-accent/50 mt-auto relative z-10 group-hover:shadow-accent/40 rounded-xl"
                                onClick={() => navigate(`/fixer/${habit.id}`)}
                            >
                                <Camera size={18} className="mr-2" />
                                Go to Protocol
                                <ArrowRight size={18} className="ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
