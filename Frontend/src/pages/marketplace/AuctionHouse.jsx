import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gavel, Timer, TrendingUp, MapPin, Layers,
    ArrowUpRight, Users, History, AlertCircle,
    BadgeCheck, Wallet, Flame, Activity, ShieldCheck
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useMockApp } from '../../hooks/useMockApp';
import { useToast } from '../../context/ToastContext';

const AuctionHouse = () => {
    const { currentUser } = useMockApp();
    const { showToast } = useToast();
    const [auctions, setAuctions] = useState([]);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({ live_auctions: 0, total_bidders: 0 });
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Initial Data Fetch & Real-Time Setup
    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const [auctionsRes, statsRes, activityRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/auctions`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/auctions/stats`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/auctions/recent-activity`)
                ]);

                if (auctionsRes.ok) {
                    const data = await auctionsRes.json();
                    setAuctions(data);
                }
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }
                if (activityRes.ok) {
                    const data = await activityRes.json();
                    const formatted = data.map(b => ({
                        id: b.bid_id,
                        user: (b.bidder_id === (currentUser?.user_id || currentUser?.id)) ? 'You' : b.bidder_name,
                        action: 'placed a bid',
                        amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.amount),
                        target: `on ${b.land_title}`,
                        time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    setActivities(formatted);
                }
            } catch (err) {
                console.error("Failed to fetch market data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();

        // Poll every 30s as a fallback to keep bids in sync for all users
        const pollInterval = setInterval(fetchMarketData, 30000);

        // Build socket URL: strip /api suffix if present
        const socketUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[AuctionHouse] Socket connected:', newSocket.id);
        });

        newSocket.on('bid_update', (update) => {
            // Update the specific auction card with the new highest bid
            setAuctions(prev => prev.map(a =>
                a.auction_id === update.auction_id
                    ? { ...a, current_highest_bid: update.highest_bid, bidders: (parseInt(a.bidders || 0) + 1) }
                    : a
            ));

            // Build activity item using the bidder_name sent from server
            const myId = currentUser?.user_id || currentUser?.id;
            const displayName = update.bidder_id === myId ? 'You' : (update.bidder_name || 'A user');

            const newActivity = {
                id: Date.now(),
                user: displayName,
                action: 'placed a bid',
                amount: new Intl.NumberFormat('en-IN', {
                    style: 'currency', currency: 'INR', maximumFractionDigits: 0
                }).format(update.highest_bid),
                time: 'Just now'
            };
            setActivities(prev => [newActivity, ...prev].slice(0, 10));
        });

        newSocket.on('new_auction', (newAuction) => {
            setAuctions(prev => [newAuction, ...prev]);
            showToast("New land auction just went live!", "success");
        });

        return () => {
            clearInterval(pollInterval);
            newSocket.close();
        };
    }, [currentUser]);

    const handlePlaceBid = async (auctionId, currentBid) => {
        const amount = parseFloat(currentBid) + 50000; // Auto-increment bid by 50k for demo
        try {
            const token = localStorage.getItem('planora_token') || localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auctions/${auctionId}/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bidder_id: currentUser?.user_id || currentUser?.id,
                    amount: amount
                })
            });

            if (response.ok) {
                showToast(`Bid of ${formatCurrency(amount)} placed successfully!`, "success");
            } else {
                const err = await response.json();
                showToast(err.error || "Failed to place bid", "error");
            }
        } catch (err) {
            showToast("Network error while placing bid", "error");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getTimeRemaining = (endTime) => {
        const total = Date.parse(endTime) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        return { days, hours, minutes, seconds, total };
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3 text-[#A65D4D]">
                        <Gavel size={24} />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Real-Time Marketplace</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-[#2A1F1D]">Auction House</h1>
                    <p className="text-[#8C7B70] max-w-xl">
                        Bid on exclusive land properties verified by Planora. Experience transparent, secure, and real-time property acquisition.
                    </p>
                </div>

                <div className="flex items-center bg-white p-2 rounded-2xl border border-[#E3DACD] shadow-sm">
                    <div className="px-6 py-2 border-r border-[#E3DACD]/50 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Live Auctions</p>
                        <p className="text-2xl font-serif font-bold text-[#2A1F1D]">{stats.live_auctions}</p>
                    </div>
                    <div className="px-6 py-2 text-center text-[#C06842]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8C7B70]">Total Bidders</p>
                        <p className="text-2xl font-serif font-bold">{stats.total_bidders}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Auction Cards Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {loading ? (
                                <div className="col-span-full h-64 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-[#C06842] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#8C7B70] font-bold animate-pulse">Syncing with Live Marketplace...</p>
                                </div>
                            ) : auctions.length === 0 ? (
                                <div className="col-span-full h-64 flex flex-col items-center justify-center space-y-4 bg-white rounded-[2.5rem] border border-[#E3DACD]/50">
                                    <AlertCircle className="text-[#8C7B70] w-12 h-12 opacity-50" />
                                    <p className="text-[#8C7B70] font-medium">No live auctions at the moment. Check back later!</p>
                                </div>
                            ) : (
                                auctions.map((auction, index) => (
                                    <AuctionCard
                                        key={auction.auction_id}
                                        auction={auction}
                                        index={index}
                                        formatCurrency={formatCurrency}
                                        getTimeRemaining={getTimeRemaining}
                                        onPlaceBid={() => handlePlaceBid(auction.auction_id, auction.current_highest_bid)}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Bidding Activity Feed */}
                    <div className="bg-[#FDFCF8] border border-[#E3DACD] rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-serif font-bold text-xl text-[#2A1F1D] flex items-center">
                                <Activity className="mr-3 text-[#C06842]" size={20} />
                                Live Activity
                            </h3>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-bold text-green-600 uppercase">Live</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {activities.map(activity => (
                                <ActivityItem key={activity.id} {...activity} />
                            ))}
                        </div>

                        <button className="w-full mt-8 py-4 bg-[#F9F7F2] text-[#8C7B70] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E3DACD]/20 transition-colors">
                            View Full History
                        </button>
                    </div>

                    {/* How it works Promo */}
                    <div className="bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <Wallet className="mb-4 text-[#A65D4D]" size={32} />
                            <h3 className="font-serif font-bold text-xl mb-2">Secure Deposits</h3>
                            <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                Our automated escrow system ensures your bid amount is locked safely and refunded instantly if you are outbid.
                            </p>
                            <button className="flex items-center space-x-2 text-[#A65D4D] font-bold text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                <span>Learn More</span>
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <ShieldCheck size={180} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuctionCard = ({ auction, index, formatCurrency, getTimeRemaining, onPlaceBid }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(auction.end_time));

    useEffect(() => {
        const timer = setInterval(() => {
            const newTime = getTimeRemaining(auction.end_time);
            setTimeLeft(newTime);
            if (newTime.total <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [auction.end_time]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-[2.5rem] overflow-hidden border border-[#E3DACD] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
        >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={auction.images || 'https://images.unsplash.com/photo-1500382017468-9049fee74aed?auto=format&fit=crop&q=80&w=800'}
                    alt={auction.land_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${auction.status === 'Hot' ? 'bg-orange-500/80 border-orange-400 text-white' :
                        auction.status === 'Ending Soon' ? 'bg-red-500/80 border-red-400 text-white' :
                            'bg-white/80 border-[#E3DACD] text-[#2A1F1D]'
                        }`}>
                        {auction.status}
                    </span>
                </div>

                {/* Favorite Button */}
                <div className="absolute top-4 right-4 flex items-center bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white">
                    <Users size={12} className="mr-1.5" />
                    <span className="text-[10px] font-bold">{auction.bidders}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-serif font-bold text-xl text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{auction.land_title || 'Untitled Land'}</h3>
                        <div className="flex items-center text-[#8C7B70] text-xs mt-1">
                            <MapPin size={12} className="mr-1" />
                            {auction.location}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#F9F7F2] p-3 rounded-2xl border border-[#E3DACD]/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70] mb-1">Current Bid</p>
                        <p className="text-base font-bold text-[#A65D4D]">{formatCurrency(auction.current_highest_bid)}</p>
                    </div>
                    <div className="bg-[#F9F7F2] p-3 rounded-2xl border border-[#E3DACD]/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#8C7B70] mb-1">Area</p>
                        <p className="text-base font-bold text-[#2A1F1D]">{auction.area || 'N/A'}</p>
                    </div>
                </div>

                {/* Timer or Status Section */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between py-4 border-t border-[#E3DACD]/30">
                        <div className="flex flex-col">
                            {timeLeft.total > 0 && auction.status !== 'completed' ? (
                                <>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C7B70] mb-1 flex items-center">
                                        <Timer size={10} className="mr-1" /> Time Remaining
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-[#2A1F1D]">{String(timeLeft.hours).padStart(2, '0')}</span>
                                            <span className="text-[8px] font-bold text-[#8C7B70] uppercase tracking-tighter">Hr</span>
                                        </div>
                                        <span className="text-[#E3DACD]">:</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-[#2A1F1D]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                            <span className="text-[8px] font-bold text-[#8C7B70] uppercase tracking-tighter">Min</span>
                                        </div>
                                        <span className="text-[#E3DACD]">:</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-[#A65D4D]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                            <span className="text-[8px] font-bold text-[#8C7B70] uppercase tracking-tighter">Sec</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[#A65D4D] uppercase tracking-widest flex items-center gap-1">
                                        <History size={12} /> Auction Ended
                                    </span>
                                    <p className="text-[10px] text-[#8C7B70] font-bold mt-1">
                                        {auction.status === 'completed' ? 'Winner Announced' : 'Verifying Final Bid...'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            disabled={timeLeft.total <= 0 || auction.status === 'completed'}
                            onClick={onPlaceBid}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${timeLeft.total > 0 && auction.status !== 'completed'
                                ? 'bg-[#2A1F1D] text-white shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] hover:-translate-y-1'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }`}
                        >
                            {auction.status === 'completed' ? 'Sold' : timeLeft.total <= 0 ? 'Closed' : 'Place Bid'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ActivityItem = ({ user, action, amount, target, time }) => (
    <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-xl bg-[#F9F7F2] flex items-center justify-center border border-[#E3DACD]/50 text-[#C06842] font-bold text-xs uppercase">
            {user.split(' ')[0][0]}
        </div>
        <div className="flex-1">
            <p className="text-xs text-[#2A1F1D] leading-tight">
                <span className="font-black">{user}</span> {action}
                {amount && <span className="text-[#A65D4D] font-bold ml-1">{amount}</span>}
                {target && <span className="text-[#2A1F1D] font-bold ml-1">{target}</span>}
            </p>
            <p className="text-[10px] text-[#8C7B70] mt-1">{time}</p>
        </div>
    </div>
);

export default AuctionHouse;
