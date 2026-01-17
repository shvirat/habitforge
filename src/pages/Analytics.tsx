import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Activity, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

const COLORS = ['#00E676', '#FF3D00', '#2979FF', '#7C4DFF', '#FFC107', '#00BCD4'];

export const Analytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [totalCompletions, setTotalCompletions] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Logs
                const q = query(
                    collection(db, 'logs'),
                    where('userId', '==', user.uid),
                    limit(100)
                );

                const logsSnapshot = await getDocs(q);
                // Sort client-side
                const logs = logsSnapshot.docs
                    .map(d => d.data())
                    .sort((a, b) => {
                        const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.date);
                        const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                    });

                // Process Weekly Data
                const days = Array.from({ length: 7 }).map((_, i) => {
                    const d = subDays(new Date(), 6 - i);
                    return {
                        name: format(d, 'EEE'), // Mon, Tue
                        date: d,
                        count: 0
                    };
                });

                logs.forEach(log => {
                    // completion date
                    const logDate = log.completedAt?.toDate ? log.completedAt.toDate() : new Date(log.date);
                    const dayStat = days.find(d => isSameDay(d.date, logDate));
                    if (dayStat) {
                        dayStat.count += 1;
                    }
                });
                setWeeklyData(days);
                setTotalCompletions(logs.length);

                // 2. Fetch Habits for Category Distribution
                const titleQuery = query(
                    collection(db, 'habits'),
                    where('userId', '==', user.uid),
                    where('isArchived', '==', false)
                );
                const habitsSnap = await getDocs(titleQuery);
                const habits = habitsSnap.docs.map(d => d.data());

                const categoryCounts: Record<string, number> = {};
                habits.forEach((h: any) => {
                    const cat = h.category || 'other';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
                setCategoryData(pieData);

            } catch (err) {
                console.error("Error loading analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) return <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /><p className="text-text-muted animate-pulse">Analyzing performance data...</p></div>;

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-primary/60 tracking-tight mb-2">Performance Analytics</h1>
                    <p className="text-text-secondary flex items-center gap-2">
                        <BarChart2 size={16} className="text-accent" />
                        Visualize your discipline metrics.
                    </p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/20 rounded-full blur-[40px] group-hover:bg-primary/30 transition-all" />

                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20"><Activity size={20} /></div>
                        <h3 className="font-bold text-text-muted uppercase tracking-wider text-xs">Total Completions</h3>
                    </div>
                    <p className="text-4xl font-black text-text-primary relative z-10">{totalCompletions}</p>
                    <p className="text-[10px] text-text-muted relative z-10 mt-1">Recorded activities in archive</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Weekly Consistency Chart */}
                <div className="glass-panel p-6 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-accent" />
                        <h3 className="font-bold text-lg text-text-primary">7-Day Consistency</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: 'rgb(var(--color-text-primary))' }}
                                    itemStyle={{ color: 'rgb(var(--color-text-primary))' }}
                                />
                                <Bar dataKey="count" fill="#00E676" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="glass-panel p-6 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <PieIcon className="text-purple-500" />
                        <h3 className="font-bold text-lg text-text-primary">Protocol Distribution</h3>
                    </div>
                    <div className="h-72 w-full">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" iconSize={8} verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted border border-dashed border-white/5 rounded-xl bg-white/5">
                                <PieIcon size={32} className="mb-2 opacity-50" />
                                <p>No active protocols to analyze.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
