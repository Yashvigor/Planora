import React from 'react';

const PlanoraLogo = ({
    className = "w-10 h-10",
    iconOnly = false,
    textColor = "#2A1F1D",
    accentColor = "#C06842",
    showText = true
}) => {
    // Helper to get hex from tailwind text-[color]
    const getHex = (color) => {
        if (!color) return "";
        if (color.startsWith('text-[')) {
            const match = color.match(/\[(.*?)\]/);
            return match ? match[1] : color;
        }
        return color; // Assume it's already a hex or valid color
    };

    const strokeColor = getHex(textColor);
    const primaryAccent = getHex(accentColor);

    return (
        <div className={`flex items-center gap-3 w-auto group`}>
            {/* Logo Icon Container */}
            <div className={`${className} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Background */}
                    <rect x="5" y="5" width="110" height="110" rx="28" fill="#FDFCF8" />

                    <g transform="translate(26, 26)">
                        {/* The specific geometry for the Isometric P Logo */}

                        {/* 1. Left Vertical Column (Dark) */}
                        <path d="M0 68 V22 L22 11 V57 L0 68" fill="#2A1F1D" />

                        {/* 2. Top-Left Angled Bar (Medium) */}
                        <path d="M0 22 L44 0 L66 11 L22 33 L0 22" fill="#C06842" />

                        {/* 3. Top-Right Vertical Column (Dark) */}
                        <path d="M66 11 V46 L44 57 V22 L66 11" fill="#2A1F1D" />

                        {/* 4. Bottom-Right Angled Bar (Medium) */}
                        <path d="M66 46 L22 68 L22 45 L44 34 L44 57 L66 46" fill="#C06842" />

                        {/* 5. Center Square/Shadow (Darkest) */}
                        <path d="M22 33 L44 22 V57 L22 68 V33" fill="#4A342E" opacity="0.4" />
                    </g>
                </svg>
            </div>

            {/* Logo Text */}
            {(showText && !iconOnly) && (
                <span className={`font-serif font-bold text-2xl tracking-tight transition-colors duration-300`} style={{ color: strokeColor }}>
                    Plan<span style={{ color: primaryAccent }}>ora</span>
                </span>
            )}
        </div>
    );
};

export default PlanoraLogo;
