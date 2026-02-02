import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ZoomIn, Loader2, ImageOff } from 'lucide-react';
import { HabitService } from '@/features/habits/HabitService';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/Button';

interface ProofGalleryProps {
    habitId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ProofGallery = ({ habitId, isOpen, onClose }: ProofGalleryProps) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadLogs();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, user, habitId]);

    const loadLogs = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await HabitService.getHabitLogs(user.uid, habitId);
            setLogs(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-surface/50 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up overflow-hidden glass-panel">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Protocol History</h2>
                        <p className="text-sm text-text-secondary">Visual evidence of your discipline.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={24} />
                    </Button>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-text-muted">
                            <Loader2 size={32} className="animate-spin text-accent" />
                            <p>Retrieving archives...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-text-muted border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                            <ImageOff size={48} className="opacity-50" />
                            <p>No verification records found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-surface/30 cursor-zoom-in transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                    onClick={() => setSelectedImage(log.proofUrl || log.proofBase64)}
                                >
                                    {log.proofUrl || log.proofBase64 ? (
                                        <img
                                            src={log.proofUrl || log.proofBase64}
                                            alt="Proof"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-text-muted text-xs">No Image</div>
                                    )}

                                    {/* Overlay Info */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 text-xs font-medium text-white/90">
                                        <Calendar size={12} className="text-accent" />
                                        {format(log.completedAt, 'MMM d, yyyy')}
                                    </div>

                                    {/* Zoom Icon */}
                                    <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <ZoomIn size={14} className="text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-4 border-t border-white/5 bg-surface/20 text-center text-xs text-text-muted font-mono uppercase tracking-widest">
                    {logs.length} Verification{logs.length !== 1 ? 's' : ''} Logged
                </div>
            </div>

            {/* Lightbox / Full Screen View */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-[95vw] max-h-[95vh] p-2">
                        <img
                            src={selectedImage}
                            alt="Full Verification Proof"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                            variant="ghost"
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </Button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
