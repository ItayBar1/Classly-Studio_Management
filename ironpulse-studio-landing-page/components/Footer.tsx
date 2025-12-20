import React from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 pt-16 pb-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <span className="font-black text-3xl tracking-tight text-white">
                  IRON<span className="text-brand-orange">PULSE</span>
                </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6">
              סטודיו בוטיק לאימוני כושר פונקציונליים וקבוצתיים. אנו מאמינים במקצועיות, יחס אישי והתמדה כדרך חיים.
            </p>
            <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-slate-800 transition-all">
                    <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-slate-800 transition-all">
                    <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:bg-slate-800 transition-all">
                    <Twitter className="w-5 h-5" />
                </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">ניווט מהיר</h4>
            <ul className="space-y-4">
              <li><a href="#about" className="text-slate-400 hover:text-brand-orange transition-colors">אודות הסטודיו</a></li>
              <li><a href="#classes" className="text-slate-400 hover:text-brand-orange transition-colors">מערכת שעות</a></li>
              <li><a href="#trainers" className="text-slate-400 hover:text-brand-orange transition-colors">הצוות שלנו</a></li>
              <li><a href="#" className="text-slate-400 hover:text-brand-orange transition-colors">שאלות ותשובות</a></li>
              <li><a href="#" className="text-slate-400 hover:text-brand-orange transition-colors">תקנון הסטודיו</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">צור קשר</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-brand-orange mt-1 flex-shrink-0" />
                <span className="text-slate-400">הברזל 15, רמת החייל, תל אביב</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-brand-orange flex-shrink-0" />
                <span className="text-slate-400">03-123-4567</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-brand-orange flex-shrink-0" />
                <span className="text-slate-400">info@ironpulse.co.il</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 text-center">
            <p className="text-slate-600 text-sm">
                © {new Date().getFullYear()} IronPulse Studio. כל הזכויות שמורות.
            </p>
        </div>
      </div>
    </footer>
  );
};