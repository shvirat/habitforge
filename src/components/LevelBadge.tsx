import React from 'react';
import { calculateLevel, calculateLevelProgress } from '@/utils/gamification';
import { Medal } from 'lucide-react';
import { clsx } from 'clsx';

interface LevelBadgeProps {
    xp: number;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ xp }) => {
    const level = calculateLevel(xp);
    const { progressPercent } = calculateLevelProgress(level, xp);

    // Map numeric level to Badge Tiers
    const getBadgeInfo = (lvl: number) => {
        if (lvl >= 50) return { title: 'Legend', color: 'text-blue-600 bg-blue-100' }; // Diamond
        if (lvl >= 20) return { title: 'Master', color: 'text-cyan-500 bg-cyan-100' }; // Platinum
        if (lvl >= 10) return { title: 'Disciple', color: 'text-yellow-500 bg-yellow-100' }; // Gold
        if (lvl >= 5) return { title: 'Apprentice', color: 'text-slate-500 bg-slate-100' }; // Silver
        return { title: 'Novice', color: 'text-amber-700 bg-amber-100' }; // Bronze
    };

    const badgeInfo = getBadgeInfo(level);

    return (
        <div className="bg-surface border border-border/50 dark:border-secondary rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center", badgeInfo.color)}>
                <Medal size={24} />
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">{badgeInfo.title}</h3>
                    <span className="text-xs font-mono text-text-muted">Lvl {level}</span>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 relative"
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
                <p className="text-[10px] text-text-muted mt-1 text-right">{Math.floor(progressPercent)}% to next lvl</p>
            </div>
        </div>
    );
};
