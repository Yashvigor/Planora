import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import PlanoraLogo from './common/PlanoraLogo';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
      ? 'bg-[#F9F7F2]/80 backdrop-blur-xl border-b border-[#EAE0D5] py-4 shadow-sm'
      : 'bg-transparent py-6'
      }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="cursor-pointer group" onClick={() => navigate('/')}>
          <PlanoraLogo
            className="w-10 h-10"
            textColor={scrolled ? "text-[#3E2B26]" : "text-[#3E2B26]"}
            accentColor="text-[#A65D3B]"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-[#5D4037] hover:text-[#A65D3B] transition-colors tracking-wide relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#A65D3B] transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-[#5D4037] hover:text-[#A65D3B] transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/login', { state: { role: 'owner' } })}
            className="px-6 py-2.5 rounded-xl bg-[#3E2B26] text-white text-sm font-bold hover:bg-[#A65D3B] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-[#3E2B26] p-2 hover:bg-[#EAE0D5] rounded-full transition-colors">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-[#F9F7F2] border-b border-[#EAE0D5] p-6 flex flex-col space-y-4 md:hidden animate-fade-in shadow-2xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-[#3E2B26] hover:text-[#A65D3B] text-lg font-bold py-2 border-b border-[#EAE0D5]/50"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => { navigate('/login'); setIsOpen(false); }}
              className="w-full py-3 text-[#3E2B26] font-bold border border-[#EAE0D5] rounded-xl hover:bg-[#EAE0D5] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => { navigate('/login'); setIsOpen(false); }}
              className="w-full py-3 bg-[#3E2B26] text-white rounded-xl font-bold hover:bg-[#A65D3B] transition-colors shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
