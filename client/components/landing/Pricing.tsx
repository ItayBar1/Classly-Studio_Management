import React from 'react';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      title: 'שיעור ניסיון',
      price: 'חינם',
      period: '/שיעור ראשון',
      features: ['התנסו בשיעור אחד על חשבוננו', 'הכירו את המדריכים', 'קבלו תחושה של הסטודיו'],
      cta: 'הזמינו שיעור ניסיון',
      primary: false,
    },
    {
      title: 'כרטיסיית 10 שיעורים',
      price: '₪450',
      period: '/10 שיעורים',
      features: ['תקף ל-3 חודשים', 'גמישות בקביעת שיעורים', 'גישה לכל סוגי השיעורים', 'חיסכון של 10% לשיעור'],
      cta: 'התחילו עכשיו',
      primary: true,
    },
    {
      title: 'מנוי חודשי ללא הגבלה',
      price: '₪600',
      period: '/לחודש',
      features: ['שיעורים ללא הגבלה', 'עדיפות ברישום', 'גישה לסדנאות בחינם', 'התמורה הטובה ביותר לרקדנים קבועים'],
      cta: 'ללא הגבלה',
      primary: false,
    },
  ];

  return (
    <section className="bg-slate-900 py-20" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          מצאו תוכנית שמתאימה לכם
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`border-2 rounded-xl p-8 flex flex-col ${
                plan.primary ? 'border-indigo-500' : 'border-slate-700'
              }`}
            >
              <h3 className="text-2xl font-bold text-white mb-2">{plan.title}</h3>
              <p className="text-slate-400 mb-6">{plan.period}</p>
              <p className="text-5xl font-extrabold text-white mb-6">{plan.price}</p>
              <ul className="space-y-3 text-slate-300 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check size={20} className="text-indigo-400 ml-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`${
                  plan.primary
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-transparent border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white'
                } font-bold py-3 px-8 rounded-lg transition-colors`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
