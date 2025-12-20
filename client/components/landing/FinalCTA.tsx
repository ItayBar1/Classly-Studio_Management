import React from 'react';

const FinalCTA: React.FC = () => {
  return (
    <section className="bg-indigo-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          מוכנים להתחיל לרקוד?
        </h2>
        <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto" dir="rtl">
          הצעד הראשון שלכם לעבר גרסה בטוחה ומלאת הבעה של עצמכם נמצא במרחק לחיצה. הזמינו שיעור ניסיון עוד היום והצטרפו לקהילה התוססת שלנו!
        </p>
        <button className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg">
          הזמינו שיעור ניסיון
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
