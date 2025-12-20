import React from 'react';

const Gallery: React.FC = () => {
  const images = [
    'https://images.unsplash.com/photo-1547484392-0e8cf518775f?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522849646337-a8da1b4a1a88?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542491523-d6c547285639?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531744046892-3c220a448d56?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547476856-14c514d7c86a?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547484392-0e8cf518775f?q=80&w=2070&auto=format&fit=crop',
  ];

  return (
    <section className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          היכנסו לעולם שלנו
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((src, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-lg">
              <img src={src} alt={`תמונת סטודיו למחול ${index + 1}`} className="w-full h-full object-cover aspect-square transition-transform transform hover:scale-110" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
