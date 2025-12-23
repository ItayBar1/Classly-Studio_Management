import React from 'react';

const Gallery: React.FC = () => {
  const images = [
    '../images/gallery1.png',
    '../images/gallery2.png',
    '../images/gallery3.png',
    '../images/gallery4.png',
    '../images/gallery5.png',
    '../images/gallery6.png',
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
