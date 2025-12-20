import React from "react";

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/gym background.avif"
          alt="Gym background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center md:text-right flex-grow flex items-center pt-24 pb-32 md:pb-0">
        <div className="md:w-2/3 lg:w-1/2">
          <h2 className="text-brand-orange font-bold text-lg md:text-xl uppercase tracking-wider mb-4 animate-fade-in-up">
            ברוכים הבאים ל-IRONPULSE
          </h2>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 drop-shadow-lg">
            הגוף שתמיד רצית <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-orange to-orange-400">
              במרחק אימון אחד
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 font-light leading-relaxed max-w-xl">
            הצטרפו למהפכת הכושר. ציוד מתקדם, מאמנים מהשורה הראשונה ואווירה
            שתגרום לכם להתמכר לתוצאות.
          </p>
        </div>
      </div>

      {/* Stats - Now positioned with safe spacing */}
      <div className="relative z-10 w-full bg-slate-900/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-slate-700 md:border-none py-6 md:py-0 md:absolute md:bottom-10 md:left-0 md:right-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl md:bg-slate-800/50 md:backdrop-blur-md md:p-6 md:rounded-2xl md:border md:border-slate-700 mx-auto md:mr-0">
            <div className="text-center border-l border-slate-600 pl-6">
              <span className="block text-3xl font-black text-white">50+</span>
              <span className="text-sm text-slate-400">שיעורים שבועיים</span>
            </div>
            <div className="text-center border-l border-slate-600 pl-6">
              <span className="block text-3xl font-black text-white">12</span>
              <span className="text-sm text-slate-400">מאמנים מוסמכים</span>
            </div>
            <div className="text-center">
              <span className="block text-3xl font-black text-white">100%</span>
              <span className="text-sm text-slate-400">התחייבות לתוצאות</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
