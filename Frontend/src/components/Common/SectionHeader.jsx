import React from 'react';

const SectionHeader = ({ title, subtitle, action, alignment = 'left', className = "" }) => {
    return (
        <div className={`flex flex-col md:flex-row justify-between items-${alignment === 'left' ? 'start' : 'center'} gap-4 mb-6 ${className}`}>
            <div className={`space-y-1 ${alignment === 'center' ? 'text-center' : ''}`}>
                <h3 className="text-xl font-serif font-black text-[#2A1F1D] tracking-tight">{title}</h3>
                {subtitle && <p className="text-[9px] text-[#8C7B70] font-black uppercase tracking-[0.2em]">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
};

export default SectionHeader;
