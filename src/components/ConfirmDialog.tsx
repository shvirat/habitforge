import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-surface border border-secondary rounded-2xl p-6 shadow-2xl animate-scale-up relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-20 ${isDestructive ? 'bg-error' : 'bg-primary'}`} />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className={`p-3 rounded-full ${isDestructive ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-1">{title}</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 relative z-10">
                    <Button variant="ghost" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDestructive ? 'primary' : 'primary'}
                        className={isDestructive ? 'bg-error hover:bg-error/90 text-white shadow-lg shadow-error/20 border-transparent' : ''}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
