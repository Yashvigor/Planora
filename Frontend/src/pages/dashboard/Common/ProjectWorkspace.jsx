import React, { useState } from 'react';
import { useMockApp } from '../../../hooks/useMockApp'; // Adjusted import path
import { MessageSquare, FileText, CheckSquare, Clock, Users, Send, Upload, Paperclip, ChevronRight, MoreVertical, Plus } from 'lucide-react';

const ProjectWorkspace = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { currentUser } = useMockApp();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Clock },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'files', label: 'Files', icon: FileText },
        { id: 'chat', label: 'Team Chat', icon: MessageSquare },
    ];

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-sm border border-[#E3DACD] flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C06842]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-serif font-bold text-[#2A1F1D] mb-1">Oceanview Villa Construction</h1>
                    <p className="text-sm text-[#8C7B70] font-bold flex items-center gap-2">Project ID: #1024 <span className="text-[#E3DACD]">•</span> Status: <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 uppercase tracking-widest text-[10px]">In Progress</span></p>
                </div>
                <div className="flex -space-x-4 relative z-10">
                    {['👷', '👩‍🎨', '👨‍💼'].map((emoji, i) => (
                        <div key={i} className="w-12 h-12 bg-[#F9F7F2] rounded-full flex items-center justify-center border-4 border-white text-xl shadow-sm">
                            {emoji}
                        </div>
                    ))}
                    <div className="w-12 h-12 bg-[#2A1F1D] rounded-full flex items-center justify-center border-4 border-white text-xs font-bold text-white shadow-sm">
                        +4
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#E3DACD] w-fit shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center transition-all ${activeTab === tab.id
                            ? 'bg-[#2A1F1D] text-white shadow-md'
                            : 'text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#5D4037]'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 glass-card rounded-[2.5rem] shadow-sm border border-[#E3DACD]/50 overflow-hidden relative">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="p-8 overflow-y-auto h-full space-y-8">
                        <h3 className="text-xl font-bold font-serif text-[#2A1F1D] flex items-center gap-2">
                            <Clock size={20} className="text-[#C06842]" /> Timeline & Milestones
                        </h3>
                        <div className="relative pl-8 border-l-2 border-[#E3DACD]/50 space-y-10 ml-4">
                            {[
                                { title: 'Foundation Laid', date: 'Oct 15, 2024', status: 'Completed', color: 'bg-green-500' },
                                { title: 'Structural Framework', date: 'Nov 01, 2024', status: 'In Progress', color: 'bg-[#C06842]' },
                                { title: 'Plumbing & Electrical', date: 'Nov 20, 2024', status: 'Pending', color: 'bg-[#E3DACD]' },
                            ].map((milestone, idx) => (
                                <div key={idx} className="relative group">
                                    <div className={`absolute -left-[43px] top-1 w-6 h-6 rounded-full border-4 border-[#FDFCF8] shadow-sm ${milestone.color}`}></div>
                                    <h4 className="font-bold text-[#2A1F1D] text-lg">{milestone.title}</h4>
                                    <p className="text-sm text-[#8C7B70] mt-1 font-medium">{milestone.date} <span className="mx-2 text-[#E3DACD]">•</span> <span className="uppercase text-xs tracking-wider font-bold">{milestone.status}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="p-8 overflow-y-auto h-full">
                        <div className="flex justify-between mb-6">
                            <h3 className="text-xl font-bold font-serif text-[#2A1F1D] flex items-center gap-2">
                                <CheckSquare size={20} className="text-[#C06842]" /> Project Tasks
                            </h3>
                            <button className="text-[#C06842] text-sm font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                                <Plus size={16} /> New Task
                            </button>
                        </div>
                        <div className="space-y-4">
                            {['Approve blueprints', 'Order reinforced steel', 'Site safety inspection'].map((task, i) => (
                                <div key={i} className="flex items-center p-5 bg-[#F9F7F2] rounded-2xl hover:bg-white hover:shadow-md hover:border-[#C06842]/30 border border-transparent transition-all group cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-[#C06842] rounded mr-4" />
                                    <span className="text-[#2A1F1D] font-bold text-sm">{task}</span>
                                    <div className="ml-auto">
                                        <div className="w-8 h-8 bg-[#E3DACD]/50 rounded-full text-[10px] font-bold flex items-center justify-center text-[#5D4037] group-hover:bg-[#2A1F1D] group-hover:text-white transition-colors">JS</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="p-8 overflow-y-auto h-full">
                        <div className="border-3 border-dashed border-[#E3DACD] rounded-[2rem] p-12 text-center hover:bg-[#F9F7F2] hover:border-[#C06842] transition-all cursor-pointer mb-8 group">
                            <div className="w-16 h-16 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-[#8C7B70] group-hover:text-[#C06842]" />
                            </div>
                            <p className="font-bold text-[#2A1F1D] text-lg">Upload Project Files</p>
                            <p className="text-xs text-[#8C7B70] uppercase tracking-widest mt-2 font-bold">PDF, DWG, JPG</p>
                        </div>
                        <h4 className="font-bold mb-4 text-xs text-[#8C7B70] uppercase tracking-widest">Recent Uploads</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-5 border border-[#E3DACD] rounded-2xl hover:shadow-lg hover:border-[#C06842]/30 transition-all bg-[#F9F7F2]/30 group cursor-pointer">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 border border-[#E3DACD]/50 group-hover:scale-105 transition-transform">
                                        <FileText className="w-6 h-6 text-[#C06842]" />
                                    </div>
                                    <p className="font-bold text-[#2A1F1D] text-sm truncate mb-1">Site_Plan_v{i}.pdf</p>
                                    <p className="text-[10px] text-[#8C7B70] font-bold uppercase tracking-wider">2.4 MB • 2 days ago</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full bg-[#fcfcf9]">
                        <div className="flex-1 p-8 overflow-y-auto space-y-6">
                            {[
                                { user: 'Architect', text: 'Updated the elevation drawings defined in the last meeting.', time: '10:30 AM', self: false },
                                { user: 'You', text: 'Great, I will review them with the structural engineer.', time: '10:35 AM', self: true },
                                { user: 'Contractor', text: 'Cement delivery is scheduled for tomorrow morning.', time: '11:00 AM', self: false },
                            ].map((msg, i) => (
                                <div key={i} className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-5 rounded-3xl ${msg.self ? 'bg-[#2A1F1D] text-white rounded-br-none shadow-md' : 'bg-white border border-[#E3DACD] rounded-bl-none shadow-sm'
                                        }`}>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${msg.self ? 'text-[#C06842]' : 'text-[#8C7B70]'}`}>{msg.user}</p>
                                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                        <p className={`text-[10px] text-right mt-2 ${msg.self ? 'text-white/60' : 'text-[#B8AFA5]'}`}>{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-white border-t border-[#E3DACD]/50">
                            <div className="flex items-center space-x-3">
                                <button className="p-3 text-[#8C7B70] hover:text-[#C06842] hover:bg-[#F9F7F2] rounded-xl transition-all"><Paperclip size={20} /></button>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 p-4 bg-[#F9F7F2] border border-transparent focus:border-[#C06842] rounded-xl focus:outline-none transition-all font-medium text-sm placeholder:text-[#B8AFA5] text-[#2A1F1D]"
                                />
                                <button className="p-3 bg-[#2A1F1D] text-white rounded-xl hover:bg-[#C06842] transition-colors shadow-lg shadow-[#2A1F1D]/20"><Send size={20} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectWorkspace;
