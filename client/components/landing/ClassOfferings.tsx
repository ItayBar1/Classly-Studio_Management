import React from 'react';
import ClassCard from './ClassCard';

const ClassOfferings: React.FC = () => {
  const classes = [
    {
      title: 'היפ-הופ',
      description: 'למדו את הצעדים והגרוב העדכניים בשיעור המלא באנרגיה.',
      level: 'כל הרמות',
      duration: '60 דקות',
    },
    {
      title: 'עכשווי',
      description: 'בטאו את עצמכם דרך תנועות זורמות וסיפור סיפורים רגשי.',
      level: 'בינוני',
      duration: '75 דקות',
    },
    {
      title: 'סלסה',
      description: 'חוו את התשוקה והקצב של הריקוד הלטיני.',
      level: 'מתחילים',
      duration: '60 דקות',
    },
    {
      title: 'הילס',
      description: 'בנו ביטחון ונוכחות במה בשיעור המעצים הזה.',
      level: 'בינוני',
      duration: '75 דקות',
    },
    {
      title: 'ג\'אז פאנק',
      description: 'שילוב של ג\'אז, היפ-הופ ופאנק. חד ומהנה.',
      level: 'כל הרמות',
      duration: '60 דקות',
    },
    {
      title: 'דאנספיטנס',
      description: 'אימון גוף מלא שמרגיש יותר כמו מסיבה מאשר מטלה.',
      level: 'כל הרמות',
      duration: '50 דקות',
    },
  ];

  return (
    <section className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          מצאו את השיעור המושלם עבורכם
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <ClassCard
              key={index}
              title={classItem.title}
              description={classItem.description}
              level={classItem.level}
              duration={classItem.duration}
            />
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
            גלו את מערכת השעות המלאה
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClassOfferings;
