import React from 'react';
import { useMockApp } from '../../../hooks/useMockApp';
import {
    Palette, Layout, Image, CheckCircle,
    Box, ShoppingBag, Clock, ArrowUpRight, Plus
} from 'lucide-react';

const InteriorDashboard = () => {
    const { currentUser } = useMockApp();

    return (
        <div className="space-y-8 max-w-7xl mx-auto font-sans pb-24 md:pb-10 bg-[#FDFCF8] min-h-screen p-4 md:p-8">
            {/* Header */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white group animate-fade-in">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A1F1D] to-[#5D4037] z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06842]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#E68A2E] text-xs font-bold uppercase tracking-widest mb-3">
                            <Palette size={14} /> Design Studio
                        </div>
                        <h1 className="text-4xl font-serif font-bold mb-3 text-[#FDFCF8]">Studio Decor</h1>
                        <p className="text-[#B8AFA5] font-medium flex items-center gap-2">
                            Interior Design & Styling <span className="w-1 h-1 rounded-full bg-[#E68A2E]"></span> {currentUser?.name}
                        </p>
                    </div>
                    <div className="flex -space-x-4 mt-4 md:mt-0 items-center">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-12 rounded-full border-2 border-[#2A1F1D] bg-[#F9F7F2] relative hover:z-10 transition-transform hover:scale-110">
                                <img
                                    src={`https://i.pravatar.cc/150?img=${i + 10}`}
                                    alt="Team"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-2 border-[#2A1F1D] bg-[#C06842] text-white flex items-center justify-center font-bold text-sm relative hover:z-10 transition-transform hover:scale-110 cursor-pointer shadow-lg shadow-[#C06842]/30">
                            +4
                        </div>
                    </div>
                </div>
            </div>

            {/* Design Stages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-75">
                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm relative group overflow-hidden hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-5 bg-[#F9F7F2] rounded-bl-3xl border-b border-l border-[#E3DACD]/50 text-[#8C7B70] group-hover:bg-[#2A1F1D] group-hover:text-white transition-all duration-300">
                        <Layout size={24} />
                    </div>
                    <h3 className="font-bold text-xl font-serif text-[#2A1F1D] mb-2 mt-2">Space Planning</h3>
                    <p className="text-xs text-[#8C7B70] uppercase tracking-wider font-bold mb-6">Living Room & Kitchen Layouts</p>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full mb-3 overflow-hidden">
                        <div className="bg-green-600 h-full rounded-full w-full shadow-[0_0_10px_rgba(22,163,74,0.3)]"></div>
                    </div>
                    <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold inline-block">Completed</span>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm relative group overflow-hidden hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-5 bg-[#F9F7F2] rounded-bl-3xl border-b border-l border-[#E3DACD]/50 text-[#8C7B70] group-hover:bg-[#C06842] group-hover:text-white transition-all duration-300">
                        <Palette size={24} />
                    </div>
                    <h3 className="font-bold text-xl font-serif text-[#2A1F1D] mb-2 mt-2">Moodboards</h3>
                    <p className="text-xs text-[#8C7B70] uppercase tracking-wider font-bold mb-6">Color Palette & Textures</p>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full mb-3 overflow-hidden">
                        <div className="bg-[#E68A2E] h-full rounded-full w-[80%] shadow-[0_0_10px_rgba(230,138,46,0.3)]"></div>
                    </div>
                    <span className="bg-[#E68A2E]/10 text-[#E68A2E] border border-[#E68A2E]/20 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold inline-block">In Review</span>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm relative group overflow-hidden hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-5 bg-[#F9F7F2] rounded-bl-3xl border-b border-l border-[#E3DACD]/50 text-[#8C7B70] group-hover:bg-[#2A1F1D] group-hover:text-white transition-all duration-300">
                        <ShoppingBag size={24} />
                    </div>
                    <h3 className="font-bold text-xl font-serif text-[#2A1F1D] mb-2 mt-2">Procurement</h3>
                    <p className="text-xs text-[#8C7B70] uppercase tracking-wider font-bold mb-6">Furniture & Fitting Orders</p>
                    <div className="w-full bg-[#E3DACD]/30 h-1.5 rounded-full mb-3 overflow-hidden">
                        <div className="bg-[#C06842] h-full rounded-full w-[20%] shadow-[0_0_10px_rgba(192,104,66,0.3)]"></div>
                    </div>
                    <span className="bg-[#C06842]/10 text-[#C06842] border border-[#C06842]/20 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold inline-block">Started</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in delay-100">
                {/* Visuals Gallery */}
                <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-serif font-bold text-2xl text-[#2A1F1D]">Design Gallery</h3>
                        <button className="text-xs font-bold text-[#C06842] hover:bg-[#C06842]/10 px-4 py-2 rounded-xl transition-colors uppercase tracking-wide flex items-center gap-2">
                            <Plus size={14} /> Upload New
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1616486338812-3dadae4b4fab?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=300'
                        ].map((img, i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm border border-[#E3DACD]/30">
                                <img src={img} alt="Design" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-[#2A1F1D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 text-white">
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Material Selection */}
                <div className="glass-card p-8 rounded-[2rem] border border-[#E3DACD]/40 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-serif font-bold text-2xl text-[#2A1F1D]">Material Selection</h3>
                        <button className="text-xs font-bold text-[#8C7B70] hover:text-[#2A1F1D] transition-colors uppercase tracking-wide">
                            View All
                        </button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { cat: 'Flooring', item: 'Italian Marble - Statuario', status: 'Approved', img: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&q=80&w=100' },
                            { cat: 'Wall Paint', item: 'Asian Paints - Royale Cream', status: 'Pending', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=100' },
                            { cat: 'Lighting', item: 'Warm White COB Lights', status: 'Selected', img: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&q=80&w=100' },
                        ].map((mat, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E3DACD]/50 hover:bg-white hover:border-[#C06842]/30 hover:shadow-md transition-all group">
                                <img src={mat.img} alt={mat.item} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                <div className="flex-1">
                                    <p className="text-[10px] text-[#8C7B70] uppercase font-bold tracking-wider mb-1">{mat.cat}</p>
                                    <h4 className="font-bold text-[#2A1F1D] group-hover:text-[#C06842] transition-colors">{mat.item}</h4>
                                </div>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border ${mat.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                    mat.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                        'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                    {mat.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3.5 bg-[#2A1F1D] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2A1F1D]/20 hover:bg-[#C06842] transition-colors uppercase tracking-wide">
                        + Add New Material
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InteriorDashboard;
