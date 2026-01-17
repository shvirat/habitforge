import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LevelBadge } from '@/components/LevelBadge';
import { User, Save, X, Edit2, Shield, Trash2, ShieldCheckIcon } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export const Profile = () => {
    const { user } = useAuth();
    const [xp, setXp] = useState(0);
    const [isEditing, setIsEditing] = React.useState(false);
    const [formData, setFormData] = React.useState({
        displayName: '',
        photoURL: ''
    });
    const [imageError, setImageError] = React.useState(false);
    const [habits, setHabits] = React.useState<any[]>([]);
    const [confirmAction, setConfirmAction] = useState<{ type: string, habitId: string, title: string, message: string } | null>(null);

    React.useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                setXp(doc.data().xp || 0);
            }
        });
        return () => unsub();
    }, [user]);

    React.useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                photoURL: user.photoURL || ''
            });

            // Load habits
            const loadHabits = async () => {
                const { HabitService } = await import('@/features/habits/HabitService');
                const data = await HabitService.getUserHabits(user.uid);
                setHabits(data);
            };
            loadHabits();
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        try {
            const { updateProfile } = await import('firebase/auth');
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Update Auth Profile
            await updateProfile(user, {
                displayName: formData.displayName,
                photoURL: formData.photoURL
            });

            // Update Firestore User Doc
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                photoURL: formData.photoURL
            });

            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <div className="space-y-8 pb-20 max-w-4xl mx-auto">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-primary/60 tracking-tight mb-2">Operative Profile</h1>
                    <p className="text-text-secondary flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        Manage your identity and protocols.
                    </p>
                </div>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Identity Card */}
                <div className="md:col-span-1">
                    <div className="glass-panel p-6 rounded-2xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-all" />

                        <div className="relative inline-block mb-4">
                            {formData.photoURL && !imageError ? (
                                <img
                                    src={formData.photoURL}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-2xl"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl font-black text-white shadow-2xl border-4 border-surface">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-success rounded-full border-4 border-surface" title="Online" />
                        </div>

                        <h2 className="text-xl font-bold text-text-primary mb-1">{user?.displayName || 'Unknown Operative'}</h2>
                        <p className="text-xs text-text-muted font-mono bg-surface/50 py-1 px-3 rounded-full inline-block border border-white/5">
                            ID: {user?.uid.slice(0, 8)}...
                        </p>
                        <div className="mt-4 mb-4 px-2">
                            <Link to="/levels" className="block transform hover:scale-[1.02] transition-transform duration-300">
                                <LevelBadge xp={xp} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Edit Details */}
                <div className="md:col-span-2 space-y-8">
                    <div className="glass-card p-6 rounded-2xl">
                        <div className='flex flex-col justify-between md:flex-row md:items-center md:justify-between'>
                            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                                <User size={20} className="text-accent" />
                                Personal Details
                            </h3>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className='mb-6'>
                                    <Edit2 size={16} className="mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    label="Codename (Display Name)"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Enter your codename"
                                />
                                <Input
                                    label="Avatar Source URL"
                                    value={formData.photoURL}
                                    onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <div className="flex gap-4 pt-2">
                                    <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                                        <X size={16} className="mr-2" />
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} className="flex-1">
                                        <Save size={16} className="mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-surface/50 border border-white/5">
                                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Codename</span>
                                    <p className="font-medium text-text-primary text-lg">{user?.displayName || 'Not Set'}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-surface/50 border border-white/5">
                                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Email Frequency</span>
                                    <p className="font-medium text-text-primary text-lg">{user?.email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Habits Section */}
                    <div className="glass-card p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <ShieldCheckIcon size={20} className="text-accent" />
                                Active Protocols
                            </h3>
                            <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-bold text-text-muted border border-white/5">{habits.length} Active</span>
                        </div>

                        {habits.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                <p className="text-text-muted">No active protocols initialized.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {habits.map(habit => (
                                    <div key={habit.id} className="flex items-center justify-between p-4 bg-surface/40 hover:bg-surface/60 border border-white/5 rounded-xl transition-colors group">
                                        <div>
                                            <h3 className="font-bold text-text-primary">{habit.title}</h3>
                                            <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{habit.category}</span>
                                        </div>
                                        <button
                                            onClick={() => setConfirmAction({
                                                type: 'delete',
                                                habitId: habit.id,
                                                title: 'Delete Protocol?',
                                                message: 'This will permanently remove the protocol. This action cannot be undone.'
                                            })}
                                            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-100 group-hover:opacity-100"
                                            title="Delete Protocol"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={async () => {
                    if (!confirmAction) return;
                    if (confirmAction.type === 'delete') {
                        try {
                            const { HabitService } = await import('@/features/habits/HabitService');
                            await HabitService.deleteHabit(confirmAction.habitId);
                            setHabits(prev => prev.filter(h => h.id !== confirmAction.habitId));
                        } catch (error) {
                            console.error(error);
                        } finally {
                            setConfirmAction(null);
                        }
                    } else {
                        setConfirmAction(null);
                    }
                }}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                isDestructive={true}
                confirmText="Yes, Delete It"
            />
        </div>
    );
};
