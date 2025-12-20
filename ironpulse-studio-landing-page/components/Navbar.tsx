import React, { useState, useEffect } from 'react';
import { Menu, X, Dumbbell, User, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-brand-dark/95 shadow-lg backdrop-blur-sm py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Right Side - Auth & Logo (RTL Layout) */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="bg-brand-orange p-2 rounded-full">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                IRON<span className="text-brand-orange">PULSE</span>
              </span>
            </div>

            {/* Desktop Auth Links - Requested specifically on the right (start in RTL) */}
            <div className="hidden md:flex items-center gap-4 border-l border-slate-700 pl-6">
              <button className="flex items-center gap-2 text-sm font-bold text-white hover:text-brand-orange transition-colors">
                <LogIn className="w-4 h-4" />
                כניסה
              </button>
              <button className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-lg shadow-orange-500/20">
                <User className="w-4 h-4" />
                הרשמה
              </button>
            </div>
          </div>

          {/* Left Side - Navigation Links (End in RTL) */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#classes" className="text-slate-300 hover:text-white font-medium transition-colors">אימונים</a>
            <a href="#trainers" className="text-slate-300 hover:text-white font-medium transition-colors">המאמנים</a>
            <a href="#about" className="text-slate-300 hover:text-white font-medium transition-colors">עלינו</a>
            <a href="#contact" className="text-slate-300 hover:text-white font-medium transition-colors">צור קשר</a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <div className="flex flex-col gap-3 mb-4 p-4 bg-slate-800/50 rounded-lg">
                <button className="w-full text-center py-2 text-white font-bold border border-slate-600 rounded-lg">כניסה למנויים</button>
                <button className="w-full text-center py-2 bg-brand-orange text-white font-bold rounded-lg">הרשמה לסטודיו</button>
             </div>
            <a href="#classes" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">אימונים</a>
            <a href="#trainers" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">המאמנים</a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">עלינו</a>
            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">צור קשר</a>
          </div>
        </div>
      )}
    </nav>
  );
};