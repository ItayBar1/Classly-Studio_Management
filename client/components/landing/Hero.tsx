import React from 'react';

interface HeroProps {
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onPrimaryCtaClick, onSecondaryCtaClick }) => {
  return (
    <section className="relative h-screen flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524594152303-9fdc38a3c31d?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="relative z-10 px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
          שחררו את הרקדן שבפנים
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          חוו את חדוות התנועה בקהילה תומכת ואנרגטית.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onPrimaryCtaClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
          >
            הזמינו שיעור ניסיון
          </button>
          <button
            onClick={onSecondaryCtaClick}
            className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-white hover:text-slate-900 transition-colors"
          >
            צפו בשיעורים
          </button>
        </div>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white max-w-3xl mx-auto">
          <div className="text-center">
            <p className="font-bold text-lg">מתאים למתחילים</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">קבוצות קטנות</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">מאמנים מובילים</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">מיקום מרכזי</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
