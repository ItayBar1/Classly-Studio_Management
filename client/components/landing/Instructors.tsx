import React from 'react';
import InstructorCard from './InstructorCard';

const Instructors: React.FC = () => {
  const instructors = [
    {
      name: 'אלכס רילי',
      specialty: 'היפ-הופ וסגנון אורבני',
      bio: 'פיינליסט World of Dance וניסיון של 10+ שנים בהוראה.',
      image: 'https://images.unsplash.com/photo-1542491523-d6c547285639?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'מריה גרסיה',
      specialty: 'עכשווי ולירי',
      bio: 'רקדנית ראשית לשעבר בלהקת הבלט הלאומית.',
      image: 'https://images.unsplash.com/photo-1522849646337-a8da1b4a1a88?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'חן לי',
      specialty: 'ג\'אז פאנק והילס',
      bio: 'כוריאוגרפית לאמנים בינלאומיים ופרסומות.',
      image: 'https://images.unsplash.com/photo-1531744046892-3c220a448d56?q=80&w=2070&auto=format&fit=crop',
    },
  ];

  return (
    <section className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          הכירו את המדריכים המובילים שלנו
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {instructors.map((instructor, index) => (
            <InstructorCard
              key={index}
              name={instructor.name}
              specialty={instructor.specialty}
              bio={instructor.bio}
              image={instructor.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Instructors;
