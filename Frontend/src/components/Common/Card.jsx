import React from 'react';

const Card = ({ children, className = "", variant = 'glass', onClick }) => {
    const styles = {
        glass: 'bg-white/40 backdrop-blur-md border border-[#E3DACD]/40',
        flat: 'bg-white border border-[#E3DACD]/50',
        dark: 'bg-[#2A1F1D] text-white border-none shadow-2xl shadow-[#2A1F1D]/20'
    };

    return (
        <div 
            onClick={onClick}
            className={`rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-xl hover:shadow-[#C06842]/5 ${styles[variant]} ${onClick ? 'cursor-pointer hover:border-[#C06842]/30 active:scale-[0.99]' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
