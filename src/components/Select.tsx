import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={cn("space-y-2 relative", className)} ref={containerRef}>
            {label && (
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all duration-200 outline-none",
                        "bg-surface/50 backdrop-blur-sm shadow-inner",
                        "border-border/50 dark:border-white/10", // Theme-aware border
                        "text-text-primary hover:border-primary/50",
                        "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                        isOpen && "border-primary ring-2 ring-primary/20"
                    )}
                >
                    <span className={cn(!selectedOption && "text-text-muted")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={cn(
                            "text-text-muted transition-transform duration-300",
                            isOpen && "rotate-180 text-primary"
                        )}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 overflow-hidden rounded-xl border border-white/10 bg-surface/90 backdrop-blur-xl shadow-2xl animate-scale-up origin-top dark:bg-[#0F172A]/95">
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                                        "hover:bg-primary/10 hover:text-primary",
                                        value === option.value
                                            ? "bg-primary/20 text-primary font-medium"
                                            : "text-text-secondary"
                                    )}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
