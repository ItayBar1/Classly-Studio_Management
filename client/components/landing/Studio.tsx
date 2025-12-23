import React from 'react';
import { MapPin, Clock, Shirt, Zap } from 'lucide-react';

const Studio: React.FC = () => {
  return (
    <section className="bg-slate-800 py-20" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              האווירה והמקום
            </h2>
            <div className="space-y-6 text-slate-300">
              <div className="flex items-start">
                <MapPin size={24} className="text-indigo-400 ml-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">המיקום שלנו</h3>
                  <p>שדרות הריקודים 123, גרוב סיטי, 12345</p>
                  <p className="text-sm text-slate-400">(מידע זמני: חניית רחוב בשפע זמינה אחרי 18:00)</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock size={24} className="text-indigo-400 ml-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">שעות פתיחה</h3>
                  <p>שני - חמישי: 16:00 - 22:00</p>
                  <p>שבת - ראשון: 10:00 - 18:00</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shirt size={24} className="text-indigo-400 ml-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">מה להביא</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>בגדים נוחים ונושמים</li>
                    <li>נעליים מתאימות (סניקרס, עקבים וכו')</li>
                    <li>בקבוק מים</li>
                    <li>גישה חיובית!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="h-96 bg-slate-700 rounded-lg shadow-lg flex items-center justify-center">
            <p className="text-slate-400">מקום למפת הגעה</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Studio;
