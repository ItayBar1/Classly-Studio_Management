import React from 'react';

interface InstructorCardProps {
  name: string;
  specialty: string;
  bio: string;
  image: string;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ name, specialty, bio, image }) => {
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <img src={image} alt={name} className="w-48 h-48 rounded-full object-cover shadow-lg" />
      </div>
      <h3 className="text-2xl font-bold text-white mt-6 mb-2">{name}</h3>
      <p className="text-indigo-400 font-semibold mb-2">{specialty}</p>
      <p className="text-slate-400 max-w-xs mx-auto" dir="rtl">{bio}</p>
    </div>
  );
};

export default InstructorCard;
