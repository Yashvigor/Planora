import React from 'react';
import { Hammer, Linkedin, Twitter, Instagram } from 'lucide-react';
import PlanoraLogo from './common/PlanoraLogo';

const Footer = () => {
    return (
        <footer className="pt-24 pb-12 bg-[#2C2420] text-[#D8CFC4] border-t border-[#3E2B26]">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="md:col-span-1">
                        <PlanoraLogo
                            className="w-10 h-10 mb-6"
                            textColor="#FDFCF8"
                            accentColor="#A65D4D"
                        />
                        <p className="text-[#8C7B70] text-sm leading-relaxed mb-6">
                            The intelligent operating system for modern construction management.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-[#8C7B70] hover:text-[#A65D3B] transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="text-[#8C7B70] hover:text-[#A65D3B] transition-colors"><Linkedin size={20} /></a>
                            <a href="#" className="text-[#8C7B70] hover:text-[#A65D3B] transition-colors"><Instagram size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-[#EAE0D5]">Platform</h4>
                        <ul className="space-y-4 text-sm text-[#8C7B70]">
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">Find Professionals</a></li>
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">Post a Project</a></li>
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">Pricing</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-[#EAE0D5]">Company</h4>
                        <ul className="space-y-4 text-sm text-[#8C7B70]">
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-[#A65D3B] transition-colors">Legal</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-[#EAE0D5]">Contact</h4>
                        <ul className="space-y-4 text-sm text-[#8C7B70]">
                            <li>support@planora.com</li>
                            <li>+1 (800) PLANORA</li>
                            <li>Austin, Texas</li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-white/5 pt-8 text-center text-[#5D4037] text-sm">
                    <p>© 2026 Planora Technologies. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
