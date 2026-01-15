import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';
import { clsx } from 'clsx';

export const ThemeToggle = ({ className }: { className?: string }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={clsx("rounded-full w-10 h-10 p-0 relative overflow-hidden", className)}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div className={clsx(
                "absolute inset-0 flex items-center justify-center transition-transform duration-500 rotate-0",
                theme === 'dark' ? "translate-y-0 rotate-0" : "translate-y-10 rotate-90"
            )}>
                <Moon size={20} className="text-primary" />
            </div>
            <div className={clsx(
                "absolute inset-0 flex items-center justify-center transition-transform duration-500 -rotate-90",
                theme === 'light' ? "translate-y-0 rotate-0" : "-translate-y-10 -rotate-90"
            )}>
                <Sun size={20} className="text-orange-500" />
            </div>
        </Button>
    );
};
