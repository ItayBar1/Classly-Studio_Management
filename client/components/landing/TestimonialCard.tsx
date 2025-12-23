import React from 'react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, role }) => {
  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
      <p className="text-slate-300 mb-6 text-lg italic" dir="rtl">"{quote}"</p>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500 flex-shrink-0 mr-4"></div>
        <div>
          <p className="font-bold text-white text-lg">{author}</p>
          <p className="text-indigo-400">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
