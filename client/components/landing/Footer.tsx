import React from 'react';
import { Twitter, Instagram, Facebook } from 'lucide-react';

interface FooterProps {
  onLoginClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onLoginClick }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-2">
              <span className="text-indigo-500">❖</span> Classly
            </h3>
            <p className="text-slate-400">שחררו את הרקדן שבפנים.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">צרו קשר</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white">info@classly.com</a></li>
              <li><a href="#" className="hover:text-white">(123) 456-7890</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">משפטי</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white">מדיניות פרטיות</a></li>
              <li><a href="#" className="hover:text-white">תנאי שימוש</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">חשבון</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={onLoginClick} className="hover:text-white text-right w-full">
                  כניסה / הרשמה
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-8 flex flex-col sm:flex-row-reverse justify-between items-center">
          <p className="text-slate-500">&copy; {new Date().getFullYear()} Classly. כל הזכויות שמורות.</p>
          <div className="flex space-x-4 space-x-reverse mt-4 sm:mt-0">
            <a href="#" className="text-slate-500 hover:text-white"><Twitter size={20} /></a>
            <a href="#" className="text-slate-500 hover:text-white"><Instagram size={20} /></a>
            <a href="#" className="text-slate-500 hover:text-white"><Facebook size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
