import React from 'react';
import { Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title = "Under Construction", message = "We are currently building this feature. Check back soon!" }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <Construction className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 max-w-md mb-8">{message}</p>
            <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default ComingSoon;
