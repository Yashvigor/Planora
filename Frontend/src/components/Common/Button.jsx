import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    icon: Icon, 
    loading = false, 
    disabled = false,
    ...props 
}) => {
    const variants = {
        primary: 'bg-[#2A1F1D] text-white hover:bg-[#C06842] shadow-lg shadow-[#2A1F1D]/10',
        secondary: 'bg-[#E3DACD] text-[#2A1F1D] hover:bg-[#C06842] hover:text-white',
        outline: 'bg-transparent border-2 border-[#E3DACD] text-[#2A1F1D] hover:border-[#C06842] hover:text-[#C06842]',
        ghost: 'bg-transparent text-[#8C7B70] hover:text-[#2A1F1D] hover:bg-[#F9F7F2]',
        danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white'
    };

    const sizes = {
        sm: 'px-3 py-2 text-[9px]',
        md: 'px-5 py-3 text-[10px]',
        lg: 'px-7 py-4 text-[11px]'
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={disabled || loading}
            className={`
                relative overflow-hidden inline-flex items-center justify-center gap-2 
                rounded-2xl font-black uppercase tracking-[0.15em] transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]} ${sizes[size]} ${className}
            `}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : Icon && <Icon size={18} />}
            {children}
        </motion.button>
    );
};

export default Button;
