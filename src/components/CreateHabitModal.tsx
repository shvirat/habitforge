import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { HabitService } from '@/features/habits/HabitService';
import { useAuth } from '@/context/AuthContext';
import type { HabitCategory, HabitFrequency } from '@/types';
import { toast } from 'react-toastify';

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHabitCreated: () => void;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ isOpen, onClose, onHabitCreated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        purpose: '',
        category: 'health' as HabitCategory,
        frequency: 'daily' as HabitFrequency,
        isHabitFixer: false
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            await HabitService.createHabit({
                userId: user.uid,
                ...formData,
            });
            toast.success('Habit created successfully! Time to get disciplined.');
            onHabitCreated();
            onClose();
        } catch (error) {
            toast.error('Failed to create habit');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 animate-fade-in">
            <div className="w-full max-w-lg bg-surface border border-secondary rounded-2xl p-6 shadow-2xl animate-scale-up relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-1">New Protocol</h2>
                <p className="text-text-secondary text-sm mb-6">Commit to a new habit.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Habit Name"
                        placeholder="e.g. Read 20 pages"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Why does this matter?</label>
                        <textarea
                            className="w-full h-24 rounded-lg border border-border/50 dark:border-white/10 bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="e.g. To sharpen my mind and improve focus..."
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Select
                                label="Category"
                                value={formData.category}
                                onChange={(value) => setFormData({ ...formData, category: value as HabitCategory })}
                                options={[
                                    { value: 'health', label: 'Health' },
                                    { value: 'productivity', label: 'Productivity' },
                                    { value: 'learning', label: 'Learning' },
                                    { value: 'mindfulness', label: 'Mindfulness' },
                                    { value: 'fitness', label: 'Fitness' },
                                    { value: 'other', label: 'Other' },
                                ]}
                            />
                        </div>
                        <div>
                            <Select
                                label="Frequency"
                                value={formData.frequency}
                                onChange={(value) => setFormData({ ...formData, frequency: value as HabitFrequency })}
                                options={[
                                    { value: 'daily', label: 'Daily' },
                                    { value: 'weekly', label: 'Weekly' },
                                ]}
                            />
                        </div>
                    </div>

                    <div
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer group ${formData.isHabitFixer
                            ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(0,230,118,0.1)]'
                            : 'bg-surface/50 border-border/50 dark:border-white/10 hover:border-primary/30'
                            }`}
                        onClick={() => setFormData({ ...formData, isHabitFixer: !formData.isHabitFixer })}
                    >
                        <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${formData.isHabitFixer ? 'bg-primary' : 'bg-text-muted/30'
                            }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${formData.isHabitFixer ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                        </div>
                        <div className="flex-1">
                            <span className={`block font-bold transition-colors ${formData.isHabitFixer ? 'text-primary' : 'text-text-primary'}`}>Habit Fixer Mode</span>
                            <span className="text-xs text-text-muted block mt-0.5">Requires mandatory selfie proof between 6-11 PM.</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={loading}>Create Protocol</Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
