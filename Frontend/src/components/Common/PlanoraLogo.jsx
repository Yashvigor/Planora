import React from 'react';

const PlanoraLogo = ({
    className = "w-10 h-10",
    iconOnly = false,
    textColor = "#3E2B26",
    accentColor = "#b96a41",
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

                    <g transform="translate(18, 15) scale(0.85)">
                        {/* Main Left Stem & Top Arch (Primary Accent) */}
                        <path d="M10,80 L10,30 L50,0 L90,30 L90,45 L50,15 L25,35 L25,80 Z" fill={primaryAccent} />

                        {/* Right Downward Stem (Primary Accent) */}
                        <path d="M50,45 L50,90 L75,90 L75,65 L90,55 L90,30 Z" fill={primaryAccent} />

                        {/* Dark Shadow - Right Inner */}
                        <path d="M50,0 L90,30 L75,40 L50,20 Z" fill={strokeColor} />

                        {/* Dark Shadow - Bottom Left */}
                        <path d="M10,80 L25,80 L50,60 L50,90 L30,105 Z" fill={strokeColor} />

                        {/* Dark Shadow - Right Outer */}
                        <path d="M75,65 L90,55 L105,65 L75,85 Z" fill={strokeColor} />
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
