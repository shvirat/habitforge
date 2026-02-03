import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                        {label}
                    </label>
                )}
                <input
                    className={cn(
                        'flex h-12 w-full rounded-lg border border-white/10 dark:border-white/10 bg-surface/50 backdrop-blur-sm px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 shadow-inner',
                        error && 'border-error/50 focus:ring-error/50 focus:border-error',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-error font-medium animate-fade-in mt-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
