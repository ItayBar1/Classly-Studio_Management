import React from 'react';
import { Flame, Users, Timer, Trophy } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Flame className="w-8 h-8 text-brand-orange" />,
      title: "אימונים בעצימות גבוהה",
      description: "שיטות אימון חדשניות ששורפות שומן ובוצות שריר בזמן שיא."
    },
    {
      icon: <Users className="w-8 h-8 text-brand-orange" />,
      title: "קהילה תומכת",
      description: "להתאמן עם אנשים שדוחפים אותך קדימה. אצלנו כולם משפחה."
    },
    {
      icon: <Timer className="w-8 h-8 text-brand-orange" />,
      title: "גמישות בשעות",
      description: "מערכת שעות רחבה מ-6 בבוקר ועד 10 בלילה, בכל יום בשבוע."
    },
    {
      icon: <Trophy className="w-8 h-8 text-brand-orange" />,
      title: "ציוד מקצועי",
      description: "מכשור מתקדם מהמותגים המובילים בעולם לחווית אימון מושלמת."
    }
  ];

  return (
    <section id="about" className="py-20 bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-brand-orange font-bold uppercase tracking-wider mb-2">למה דווקא אנחנו</h2>
          <h3 className="text-3xl md:text-4xl font-black text-white">יותר מסתם חדר כושר</h3>
          <div className="w-24 h-1 bg-brand-orange mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-800 p-8 rounded-2xl hover:bg-slate-750 transition-colors border border-slate-700 hover:border-brand-orange/50 group">
              <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};