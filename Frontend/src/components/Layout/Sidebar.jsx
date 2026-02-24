import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Map, FolderPlus, Users, MessageSquare, Settings, LogOut,
    Shield, FileText, Scale, DollarSign, Package, Palette, CheckSquare,
    Hammer, Camera, PencilRuler, Briefcase
} from 'lucide-react';
import { useMockApp } from '../../hooks/useMockApp';
import PlanoraLogo from '../common/PlanoraLogo';

/**
 * 🧭 Sidebar Navigation Component
 * 
 * Purpose: Provides dynamic, role-based navigation.
 * 
 * Logic:
 * 1. Checks `currentUser.role` from the global MockAppContext.
 * 2. Renders a set of common links (Dashboard, Messages) for everyone.
 * 3. Appends role-specific links (e.g., 'My Lands' for Land Owners, 
 *    'Work Board' for Contractors) to customize the app experience.
 */
const Sidebar = ({ isOpen, onClose }) => {
    const { currentUser, logout, messages } = useMockApp();

    // Safety check for messages array
    const unreadCount = Array.isArray(messages)
        ? messages.filter(m => m.receiver === currentUser?.email && !m.read).length
        : 0;

    const getMenuItems = () => {
        // Common sections for ALL roles
        const commonSections = [
            { icon: LayoutDashboard, label: 'Control Center', path: '/dashboard' },
            // Verifications moved to role-specific check
            { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
            {
                icon: MessageSquare,
                label: 'Messages',
                path: '/dashboard/messages',
                badge: unreadCount > 0 ? unreadCount : null
            },
            { icon: DollarSign, label: 'Payments', path: '/dashboard/payments' },
        ];

        // Role-specific additional sections
        let roleSpecificSections = [];
        const role = currentUser?.role;

        // "Verifications" is only for Admin
        if (['admin'].includes(role)) {
            commonSections.splice(1, 0, { icon: Shield, label: 'Verifications', path: '/dashboard/verifications' });
        }

        switch (role) {
            case 'admin':
                roleSpecificSections = [
                    { icon: Users, label: 'User Management', path: '/dashboard/users' },
                    { icon: FolderPlus, label: 'Project & Site', path: '/dashboard/projects' },
                ];
                break;

            case 'land_owner':
                roleSpecificSections = [
                    { icon: Map, label: 'My Lands', path: '/dashboard/lands' },
                    { icon: FolderPlus, label: 'My Projects', path: '/dashboard/projects' },
                    { icon: Users, label: 'Find Professionals', path: '/dashboard/find-pros' },
                ];
                break;

            case 'architect':
            case 'civil_engineer':
            case 'structural_engineer':
                roleSpecificSections = [
                    { icon: PencilRuler, label: 'Drawings', path: '/dashboard/drawings' },
                    { icon: LayoutDashboard, label: 'Design Status', path: '/dashboard/design-status' },
                    { icon: CheckSquare, label: 'Approvals', path: '/dashboard/approvals' },
                ];
                break;

            case 'interior_designer':
            case 'false_ceiling':
            case 'fabrication':
                roleSpecificSections = [
                    { icon: Package, label: 'Materials', path: '/dashboard/materials' },
                    { icon: Palette, label: 'Designs', path: '/dashboard/designs' },
                    { icon: FileText, label: 'Quotations', path: '/dashboard/quotations' },
                ];
                break;

            case 'contractor':
            case 'mason':
            case 'electrician':
            case 'plumber':
            case 'carpenter':
            case 'tile_fixer':
            case 'painter':
                roleSpecificSections = [
                    { icon: Hammer, label: 'Work Board', path: '/dashboard/workboard' },
                    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
                    { icon: Camera, label: 'Photo Reports', path: '/dashboard/reports' },
                ];
                if (role === 'contractor') {
                    roleSpecificSections.push({ icon: Users, label: 'Find Professionals', path: '/dashboard/find-pros' });
                }
                break;

            default:
                roleSpecificSections = [];
        }

        // Combine: common sections first, then role-specific
        return [...commonSections, ...roleSpecificSections];
    };

    const menuItems = getMenuItems();

    // -- Planora Premium Theme Colors --
    return (
        <aside className={`${isOpen ? 'w-72' : 'w-24'} bg-[#FDFCF8] border-r border-[#E3DACD] shadow-2xl transition-all duration-300 flex flex-col z-20 font-sans h-screen`}>
            {/* Logo Area */}
            <div className={`h-28 flex items-center ${isOpen ? 'justify-start px-8' : 'justify-center'} border-b border-[#E3DACD]/50`}>
                <PlanoraLogo
                    className={isOpen ? "w-10 h-10" : "w-12 h-12"}
                    iconOnly={!isOpen}
                    showText={false}
                />
                {isOpen && (
                    <div className="ml-3">
                        <span className="font-serif font-bold text-2xl tracking-tight block leading-none text-[#2A1F1D]">Plan<span className="text-[#A65D4D]">ora</span></span>
                        <span className="text-[10px] text-[#C06842] font-bold uppercase tracking-[0.25em] mt-1 block">Workspace</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-5 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-4 rounded-xl transition-all relative group duration-300 font-medium ${isActive
                                ? 'bg-gradient-to-r from-[#2A1F1D] to-[#4A342E] shadow-lg shadow-[#2A1F1D]/20 text-white'
                                : 'text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#C06842]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative flex-shrink-0">
                                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isOpen ? '' : 'mx-auto'}`} strokeWidth={isActive ? 2.5 : 2} />
                                    {!isOpen && item.badge && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-[#C06842] text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#FDFCF8] animate-pulse shadow-sm">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                {isOpen && (
                                    <div className="flex-1 flex justify-between items-center ml-4 overflow-hidden">
                                        <span className={`text-sm tracking-wide whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                                        {item.badge && (
                                            <span className="bg-[#C06842] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Active Accent Bar (Left) */}
                                {isActive && isOpen && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C06842] rounded-r-full"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto p-5 pb-8 space-y-4">
                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-xl transition-all font-bold text-sm border ${isActive
                            ? 'bg-[#F9F7F2] text-[#C06842] border-[#E3DACD] shadow-sm'
                            : 'border-transparent text-[#8C7B70] hover:bg-[#F9F7F2] hover:text-[#5D4037]'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Settings className={`w-5 h-5 ${isOpen ? '' : 'mx-auto'}`} strokeWidth={isActive ? 2.5 : 2} />
                            {isOpen && <span className="ml-4">Settings</span>}
                        </>
                    )}
                </NavLink>

                <div className={`mt-4 bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-[#E3DACD] shadow-sm hover:shadow-md transition-shadow duration-300 ${isOpen ? '' : 'flex flex-col items-center justify-center'}`}>
                    {isOpen ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-[#2A1F1D] to-[#4A342E] flex items-center justify-center text-white font-serif font-bold text-sm shadow-md border-2 border-[#FDFCF8]">
                                    {currentUser?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-bold text-[#2A1F1D] truncate">{currentUser?.name}</p>
                                    <p className="text-[10px] text-[#C06842] font-bold uppercase tracking-wider truncate">{currentUser?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <button onClick={logout} className="text-[#8C7B70] hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors group">
                                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={logout} className="text-[#8C7B70] hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors" title="Logout">
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
