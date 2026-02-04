import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    CheckSquare, Camera, Clock, AlertTriangle,
    MapPin, User, Phone, Star, Briefcase, Calendar,
    MessageCircle, Activity, Shield, Construction,
    Home, Bell, ArrowRight, Wrench
} from 'lucide-react';

// --- Utility Components ---
const SectionHeader = ({ title }) => (
    <h3 className="text-lg font-bold font-serif text-[#2A1F1D] mb-4 flex items-center gap-2">
        {title}
    </h3>
);

const Card = ({ children, className = "" }) => (
    <div className={`glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm hover:shadow-md transition-all ${className}`}>
        {children}
    </div>
);

// --- Sub-Components ---

const WorkerProfile = ({ currentUser }) => {
    // Mock Profile Data
    const profile = {
        fullName: currentUser?.name || 'Worker Name',
        role: currentUser?.role?.replace('_', ' ') || 'Site Worker',
        mobile: '+91 98765 43210',
        altContact: '+91 91234 56789',
        address: 'Sector 4, Gandhinagar, Gujarat',
        idStatus: 'Verified',
        experience: '5 Years',
        primarySkill: 'Brick Laying',
        subSkills: ['Plastering', 'Tiling'],
        tools: ['Trowel', 'Level Pipe', 'Drill'],
        availableFrom: 'Immediately',
        workingHours: '9:00 AM - 6:00 PM',
        basis: 'Contract',
        rating: 4.8,
        projectsCompleted: 12
    };

    return (
        <div className="space-y-6">
            <Card className="flex flex-col items-center bg-gradient-to-b from-white to-[#F9F7F2]">
                <div className="w-24 h-24 bg-[#2A1F1D] text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 border-4 border-[#FDFCF8] shadow-lg">
                    {profile.fullName[0]}
                </div>
                <h2 className="text-2xl font-bold font-serif text-[#2A1F1D]">{profile.fullName}</h2>
                <p className="text-[#8C7B70] font-medium capitalize flex items-center gap-1 mt-1">
                    <Construction size={16} /> {profile.role}
                </p>
                <div className="flex items-center gap-1 text-[#E68A2E] mt-3 bg-[#E68A2E]/10 px-4 py-1.5 rounded-full border border-[#E68A2E]/20">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-sm">{profile.rating}</span>
                    <span className="text-xs text-[#C06842] font-bold">({profile.projectsCompleted} Projects)</span>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <SectionHeader title="Basic Identity" />
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Phone size={14} /> Mobile</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.mobile}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><MapPin size={14} /> Location</span>
                            <span className="font-bold text-[#2A1F1D] text-right max-w-[50%]">{profile.address}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Shield size={14} /> ID Status</span>
                            <span className="font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100"><CheckSquare size={14} /> {profile.idStatus}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader title="Skills & Availability" />
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Briefcase size={14} /> Experience</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.experience}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E3DACD]/40 pb-3">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Wrench size={14} /> Main Skill</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.primarySkill}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-[#8C7B70] flex items-center gap-2 font-medium"><Clock size={14} /> Hours</span>
                            <span className="font-bold text-[#2A1F1D]">{profile.workingHours}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <SectionHeader title="Expertise" />
                <div className="flex flex-wrap gap-2">
                    {profile.subSkills.concat(profile.tools).map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F9F7F2] text-[#5D4037] text-xs font-bold rounded-xl border border-[#D8CFC4] hover:border-[#C06842] transition-colors">
                            {skill}
                        </span>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const WorkerHome = ({ currentUser }) => {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Master Bedroom Flooring', status: 'In Progress', time: '4h 30m', priority: 'High' },
        { id: 2, title: 'Kitchen Backsplash', status: 'Pending', time: '0h', priority: 'Medium' },
        { id: 3, title: 'Guest Bath Grouting', status: 'Done', time: '2h 15m', priority: 'Low' },
    ]);

    const handleTaskToggle = (id) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, status: t.status === 'Done' ? 'Pending' : 'Done' } : t
        ));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-panel p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white group">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] z-0"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C06842]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-2">{currentUser?.role?.replace('_', ' ')}</p>
                            <h1 className="text-3xl font-bold font-serif mb-4 text-[#FDFCF8]">Hello, {currentUser?.name}</h1>
                        </div>
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-green-300">Active</span>
                        </div>
                    </div>

                    <div className="mt-4 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                        <div>
                            <p className="text-[10px] text-[#B8AFA5] uppercase tracking-widest font-bold">Assigned Project</p>
                            <p className="font-bold text-sm md:text-base text-[#FDFCF8] mt-1">Skyline Heights - Block A</p>
                        </div>
                        <ArrowRight size={18} className="text-[#C06842]" />
                    </div>
                    <div className="mt-3 flex gap-4 text-xs font-medium text-[#B8AFA5]">
                        <span className="flex items-center gap-1"><Clock size={12} /> Shift: 9AM - 6PM</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-blue-600"><Briefcase size={40} /></div>
                    <p className="text-[10px] font-bold uppercase text-[#8C7B70] tracking-widest mb-1">Pending</p>
                    <p className="text-3xl font-bold text-[#2A1F1D] font-serif">2</p>
                </div>
                <div className="glass-card p-5 rounded-2xl border border-[#E3DACD]/40 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-green-600"><Clock size={40} /></div>
                    <p className="text-[10px] font-bold uppercase text-[#8C7B70] tracking-widest mb-1">Logged</p>
                    <p className="text-3xl font-bold text-[#2A1F1D] font-serif">6<span className="text-base text-[#8C7B70]">h</span> 30<span className="text-base text-[#8C7B70]">m</span></p>
                </div>
            </div>

            {/* Tasks */}
            <div>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="font-bold text-xl text-[#2A1F1D] font-serif">Today's Tasks</h2>
                    <span className="text-xs font-bold bg-[#F9F7F2] border border-[#D8CFC4] px-3 py-1.5 rounded-lg text-[#5D4037] hover:bg-[#E3DACD] transition-colors cursor-pointer">View All</span>
                </div>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id}
                            onClick={() => handleTaskToggle(task.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${task.status === 'Done' ? 'bg-[#F9F7F2] border-transparent opacity-60' : 'bg-white border-[#E3DACD] hover:border-[#C06842] shadow-sm hover:shadow-md'
                                }`}>
                            <div className="flex items-center space-x-4">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.status === 'Done' ? 'bg-[#2A1F1D] border-[#2A1F1D]' : 'border-[#D8CFC4] group-hover:border-[#C06842]'
                                    }`}>
                                    {task.status === 'Done' && <CheckSquare size={14} className="text-white" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${task.status === 'Done' ? 'text-[#8C7B70] line-through' : 'text-[#2A1F1D]'}`}>
                                        {task.title}
                                    </h3>
                                    <p className="text-[10px] text-[#8C7B70] flex items-center mt-1 font-medium">
                                        <Clock size={10} className="mr-1" /> {task.time} • <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{task.priority}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button className="bg-[#2A1F1D] text-white p-4 rounded-2xl shadow-lg shadow-[#2A1F1D]/20 flex flex-col items-center justify-center hover:bg-[#C06842] transition-colors active:scale-95 group">
                    <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs tracking-wide">Upload Photo</span>
                </button>
                <button className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl flex flex-col items-center justify-center hover:bg-red-100 transition-colors active:scale-95 group">
                    <AlertTriangle size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs tracking-wide">Report Issue</span>
                </button>
            </div>
        </div>
    );
};

const WorkerMessages = () => (
    <div className="space-y-4">
        <div className="glass-card p-4 rounded-2xl border border-[#E3DACD]/40 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#E68A2E]/10 rounded-full flex items-center justify-center text-[#E68A2E] font-bold text-xs border border-[#E68A2E]/20">SE</div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-[#2A1F1D] text-sm">Site Engineer</h4>
                    <span className="text-[10px] text-[#8C7B70] font-bold">10:30 AM</span>
                </div>
                <p className="text-xs text-[#5D4037] line-clamp-2">Please verify the cement mix ratio for the ground floor slab today.</p>
            </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#E3DACD]/40 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#C06842]/10 rounded-full flex items-center justify-center text-[#C06842] font-bold text-xs border border-[#C06842]/20">CM</div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-[#2A1F1D] text-sm">Contractor Manager</h4>
                    <span className="text-[10px] text-[#8C7B70] font-bold">Yesterday</span>
                </div>
                <p className="text-xs text-[#5D4037] line-clamp-2">Material delivery is scheduled for tomorrow morning.</p>
            </div>
        </div>

        <div className="fixed bottom-24 left-4 right-4 md:hidden">
            <button className="w-full bg-[#2A1F1D] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 flex items-center justify-center gap-2 hover:bg-[#C06842] transition-colors">
                <MessageCircle size={18} /> Start New Chat
            </button>
        </div>

        <div className="hidden md:block mt-8">
            <button className="w-full bg-[#2A1F1D] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#2A1F1D]/20 flex items-center justify-center gap-2 hover:bg-[#C06842] transition-colors">
                <MessageCircle size={18} /> Start New Chat
            </button>
        </div>
    </div>
);


const WorkerDashboard = ({ roleType }) => {
    const { currentUser } = useMockApp();
    const [activeTab, setActiveTab] = useState('home');

    return (
        <div className="max-w-md mx-auto md:max-w-4xl font-sans pb-24 min-h-screen bg-[#FDFCF8]">
            {/* Top Bar for Desktop/Tablet */}
            <div className="hidden md:flex justify-between items-center p-6 bg-[#FDFCF8] border-b border-[#E3DACD] mb-6 sticky top-0 z-30 backdrop-blur-sm bg-[#FDFCF8]/90">
                <h2 className="font-bold text-xl text-[#2A1F1D] font-serif flex items-center gap-2">
                    <Construction className="text-[#C06842]" /> Planora Site Connect
                </h2>
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-[#F9F7F2] rounded-full text-[#5D4037] transition-colors"><Bell size={20} /></button>
                    <div className="w-9 h-9 bg-[#2A1F1D] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">
                        {currentUser?.name?.[0]}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 animate-fade-in">
                {activeTab === 'home' && <WorkerHome currentUser={currentUser} />}
                {activeTab === 'profile' && <WorkerProfile currentUser={currentUser} />}
                {activeTab === 'messages' && <WorkerMessages />}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[#E3DACD] p-2 pb-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-50 md:hidden">
                <div className="flex justify-around items-center">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'home' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">Home</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'messages' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <MessageCircle size={24} strokeWidth={activeTab === 'messages' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">Chat</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all w-16 ${activeTab === 'profile' ? 'text-[#C06842] bg-[#C06842]/10' : 'text-[#B8AFA5] hover:bg-[#F9F7F2]'}`}
                    >
                        <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold mt-1">Profile</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default WorkerDashboard;
