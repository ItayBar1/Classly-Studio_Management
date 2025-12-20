import React from 'react';
import { TrainingClass } from '../types';
import { Clock, BarChart } from 'lucide-react';

const classesData: TrainingClass[] = [
  {
    id: '1',
    title: 'קרוספיט אקסטרים',
    description: 'אימון פונקציונלי המשלב כוח, סיבולת לב ריאה וגמישות בקצב גבוה.',
    intensity: 'High',
    duration: '60 דק׳',
    image: '/images/crossfit extreme.png'
  },
  {
    id: '2',
    title: 'יוגה כוח',
    description: 'חיזוק שרירי הליבה ושיפור הגמישות דרך תנוחות יוגה דינמיות.',
    intensity: 'Medium',
    duration: '50 דק׳',
    image: '/images/yoga power.avif'
  },
  {
    id: '3',
    title: 'אימון רצועות TRX',
    description: 'עבודה כנגד משקל גוף לחיטוב ועיצוב כל שרירי הגוף.',
    intensity: 'High',
    duration: '45 דק׳',
    image: '/images/trx training.avif'
  },
  {
    id: '4',
    title: 'קיקבוקסינג',
    description: 'שריפת קלוריות מטורפת בשילוב תנועות מעולם אומנויות הלחימה.',
    intensity: 'High',
    duration: '55 דק׳',
    image: '/images/kickboxing.avif'
  }
];

export const Classes: React.FC = () => {
  return (
    <section id="classes" className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="text-right">
            <h2 className="text-brand-orange font-bold uppercase tracking-wider mb-2">מגוון האימונים שלנו</h2>
            <h3 className="text-3xl md:text-4xl font-black text-white">מצא את האימון שמתאים לך</h3>
          </div>
          <button className="hidden md:block text-white border-b-2 border-brand-orange pb-1 hover:text-brand-orange transition-colors font-bold">
            צפה בכל האימונים
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classesData.map((cls) => (
            <div key={cls.id} className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer">
              <img 
                src={cls.image} 
                alt={cls.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90 transition-opacity"></div>
              
              <div className="absolute bottom-0 right-0 left-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                  <span className="flex items-center text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded">
                    <Clock className="w-3 h-3 ml-1" />
                    {cls.duration}
                  </span>
                  <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    <BarChart className="w-3 h-3 ml-1" />
                    {cls.intensity === 'High' ? 'עצימות גבוהה' : 'עצימות בינונית'}
                  </span>
                </div>
                
                <h4 className="text-2xl font-bold text-white mb-2">{cls.title}</h4>
                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 line-clamp-2">
                  {cls.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="md:hidden mt-8 w-full py-3 text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors font-bold">
            צפה בכל האימונים
        </button>
      </div>
    </section>
  );
};