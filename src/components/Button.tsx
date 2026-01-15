import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95';

    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:shadow-[0_0_30px_rgba(0,230,118,0.5)] border border-transparent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-white/5',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_rgba(255,61,0,0.3)] hover:shadow-[0_0_30px_rgba(255,61,0,0.5)] border border-transparent',
        ghost: 'hover:bg-white/5 text-text-primary hover:text-primary',
        outline: 'border-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/50'
    };

    const sizes = {
        sm: 'h-9 px-4 text-xs uppercase',
        md: 'h-11 px-6 text-sm uppercase',
        lg: 'h-14 px-8 text-base uppercase'
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
