import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';
import { useToast } from '../context/ToastContext';
import { Menu, Bell } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar';

const DashboardLayout = () => {
    const { currentUser, messages } = useMockApp();
    const navigate = useNavigate();
    // const { showToast } = useToast();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [prevMessageCount, setPrevMessageCount] = useState(0);

    // Calculate unread count
    const unreadCount = messages.filter(m => m.receiver === currentUser?.email && !m.read).length;

    // Toast Notification Effect
    useEffect(() => {
        if (!currentUser) return;
        const myMessages = messages.filter(m => m.receiver === currentUser.email);
        if (prevMessageCount === 0 && myMessages.length > 0) {
            setPrevMessageCount(myMessages.length);
            return;
        }
        if (myMessages.length > prevMessageCount) {
            const latestMsg = myMessages[myMessages.length - 1];
            if (!latestMsg.read) {
                // showToast(`New message from ${latestMsg.sender}`, 'message');
                console.log("Toast disabled");
            }
        }
        setPrevMessageCount(myMessages.length);
    }, [messages, currentUser, prevMessageCount]);

    // Live Location Update
    useEffect(() => {
        const updateLocation = async () => {
            if (!currentUser || !navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const uid = currentUser.user_id || currentUser.id;

                try {
                    console.log('[Dashboard] Updating live location:', latitude, longitude);
                    await fetch(`${import.meta.env.VITE_API_URL}/api/users/${uid}/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });
                } catch (err) {
                    console.error('[Dashboard] Failed to update live location:', err);
                }
            }, (err) => {
                console.warn('[Dashboard] Location access denied:', err.message);
            }, { enableHighAccuracy: true });
        };

        updateLocation();
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <div className="flex h-screen bg-enola-beige/20 overflow-hidden relative font-sans text-enola-dark-brown">

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-enola-cream/80 backdrop-blur-sm shadow-sm flex items-center justify-between px-8 z-10 border-b border-enola-sand/20">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl hover:bg-enola-brown/10 text-enola-brown transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center space-x-6">
                        <div className="hidden md:block">
                            <h2 className="font-serif font-bold text-xl text-enola-dark-brown/80">
                                Welcome back, {currentUser.name.split(' ')[0]}
                            </h2>
                        </div>
                        <button className="p-2 relative rounded-full hover:bg-enola-brown/10 text-enola-taupe transition-colors">
                            <Bell className="w-6 h-6" />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-enola-beige/30 p-4 lg:p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
