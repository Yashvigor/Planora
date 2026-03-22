import React, { useState } from 'react';
import { Star, X, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../Common/Button';

const RatingModal = ({ isOpen, onClose, project, currentUser, onComplete }) => {
    const [ratings, setRatings] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !project) return null;

    // Filter team members based on rater role
    // Professionals (WorkerHome/Architect) don't rate (usually).
    // Land Owner rates Contractor + all other Pros.
    // Contractor rates all other Pros.
    const raterRole = currentUser?.sub_category || currentUser?.role;
    const isOwner = raterRole === 'Land Owner';
    const isContractor = raterRole === 'Contractor';

    // The team list from backend includes current user if they are a professional.
    // We must filter out the rater themselves.
    // Also Land Owner is not in the team list usually (they are the owner field).
    const teamToRate = project.team?.filter(member => member.user_id !== (currentUser.user_id || currentUser.id)) || [];

    const handleRating = (userId, value) => {
        setRatings(prev => ({ ...prev, [userId]: value }));
    };

    const submitRatings = async () => {
        const payload = Object.entries(ratings).map(([userId, rating]) => ({
            rated_user_id: userId,
            rating
        }));

        if (payload.length === 0) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${project.project_id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('planora_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    rater_id: currentUser.user_id || currentUser.id,
                    ratings: payload
                })
            });

            if (res.ok) {
                onComplete();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit ratings');
            }
        } catch (err) {
            console.error('Rating error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#2A1F1D]/80 backdrop-blur-xl">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20"
            >
                <div className="p-8 border-b border-[#E3DACD]/40 flex justify-between items-center bg-[#FDFCF8]">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-[#2A1F1D] tracking-tight">Rate Your Team</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C06842] mt-1">Project: {project.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-[#8C7B70] hover:text-red-500 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                    {teamToRate.length === 0 ? (
                        <div className="text-center py-20 opacity-40">
                            <User size={48} className="mx-auto mb-4" />
                            <p className="font-serif italic">No other team members assigned to this project.</p>
                        </div>
                    ) : teamToRate.map(member => (
                        <div key={member.user_id} className="bg-[#FDFCF8] p-6 rounded-[2rem] border border-[#E3DACD]/50 flex items-center justify-between group hover:border-[#C06842]/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#2A1F1D] text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                                    {member.name?.[0]}
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-[#2A1F1D]">{member.name}</h4>
                                    <p className="text-[9px] font-black uppercase text-[#C06842] tracking-widest">{member.assigned_role || member.sub_category}</p>
                                </div>
                            </div>

                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => handleRating(member.user_id, star)}
                                        className={`p-1.5 transition-all duration-300 ${
                                            (ratings[member.user_id] || 0) >= star 
                                                ? 'text-[#E68A2E] scale-110' 
                                                : 'text-[#E3DACD] hover:text-[#E68A2E]/50'
                                        }`}
                                    >
                                        <Star size={24} fill={(ratings[member.user_id] || 0) >= star ? 'currentColor' : 'transparent'} strokeWidth={1.5} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 border-t border-[#E3DACD]/40 bg-[#FDFCF8] flex items-center justify-between">
                    <p className="text-[9px] font-black font-sans uppercase tracking-[0.1em] text-[#8C7B70]">
                        {Object.keys(ratings).length} of {teamToRate.length} members rated
                    </p>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button 
                            variant="primary" 
                            onClick={submitRatings}
                            disabled={isSubmitting || Object.keys(ratings).length === 0}
                        >
                            {isSubmitting ? 'Finalizing...' : 'Submit All Ratings'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RatingModal;
