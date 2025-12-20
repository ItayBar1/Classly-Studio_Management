import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export const LeadForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Logic to send data would go here
  };

  return (
    <section id="contact" className="relative py-24 bg-brand-orange overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">מוכנים להתחיל?</h2>
        <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto font-medium">
          השאירו פרטים ונחזור אליכם לקביעת אימון ניסיון חינם ללא התחייבות. 
          הצעד הראשון לשינוי מתחיל כאן.
        </p>

        {submitted ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md mx-auto animate-fade-in text-slate-800">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">תודה שנרשמת!</h3>
            <p className="text-slate-600">הפרטים התקבלו בהצלחה. נציג שלנו יצור איתך קשר בהקדם.</p>
            <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm text-slate-500 underline hover:text-brand-orange"
            >
                שלח טופס נוסף
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl shadow-2xl max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="שם מלא" 
              required
              className="flex-1 px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-orange text-slate-900 placeholder-slate-400 outline-none"
            />
            <input 
              type="tel" 
              placeholder="טלפון" 
              required
              className="flex-1 px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-brand-orange text-slate-900 placeholder-slate-400 outline-none"
            />
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              שריין מקום
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
        
        <p className="mt-6 text-white/60 text-sm">
          * ההרשמה לאימון ניסיון מגיל 16 ומעלה
        </p>
      </div>
    </section>
  );
};