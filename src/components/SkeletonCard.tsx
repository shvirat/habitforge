

export const SkeletonCard = () => {
    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col h-[280px]">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-20" />

            <div className="flex justify-between items-start mb-6 w-full">
                <div className="space-y-2 w-full">
                    <div className="h-7 w-3/4 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-5 w-24 bg-white/5 rounded-md animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse" />
                    <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                </div>
            </div>

            <div className="space-y-2 mb-8">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
            </div>

            <div className="mt-auto flex gap-3">
                <div className="h-10 w-10 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-10 flex-1 bg-white/5 rounded-lg animate-pulse" />
            </div>
        </div>
    );
};
