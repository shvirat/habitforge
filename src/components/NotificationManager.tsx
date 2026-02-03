import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const NotificationManager = () => {
    const { permission, requestPermission } = useNotification();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, []);

    if (permission !== 'default' || !isVisible) return null;

    return (
        <div className="fixed bottom-6 right-4 z-100 hidden md:block">
            <button
                onClick={requestPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all animate-bounce"
                title="Enable Notifications"
            >
                <Bell size={20} />
                <span className="text-sm font-medium">Enable Notifications</span>
            </button>
        </div>
    );
};
