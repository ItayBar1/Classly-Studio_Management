import React from 'react';
import TestimonialCard from './TestimonialCard';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      quote: "סטודיו הריקוד הטוב בעיר! המדריכים מדהימים והקהילה כל כך מסבירת פנים. צמחתי כל כך כרקדנית כאן.",
      author: 'יעל כהן',
      role: 'תלמידה',
    },
    {
      quote: "התחלתי כמתחיל גמור והרגשתי כל כך מאוים להתחיל. שיעורי המתחילים מושלמים והמורים כל כך סבלניים. ממליץ בחום!",
      author: 'דוד לוי',
      role: 'תלמיד',
    },
    {
      quote: "מקום פנטסטי לא רק ללמוד לרקוד, אלא גם להתאמן. שיעורי הכושר סופר כיפיים ויעילים.",
      author: 'صوفي دوبوا',
      role: 'תלמידה',
    },
  ];

  return (
    <section className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          מה התלמידים שלנו אומרים
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
            />
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-xl text-slate-300">4.8/5 מתוך 500+ תלמידים מרוצים</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
