import React from "react";

import gallery1Webp from "../../images/gallery1.webp";
import gallery1Png from "../../images/gallery1.png";
import gallery2Webp from "../../images/gallery2.webp";
import gallery2Png from "../../images/gallery2.png";
import gallery3Webp from "../../images/gallery3.webp";
import gallery3Png from "../../images/gallery3.png";
import gallery4Webp from "../../images/gallery4.webp";
import gallery4Png from "../../images/gallery4.png";
import gallery5Webp from "../../images/gallery5.webp";
import gallery5Png from "../../images/gallery5.png";
import gallery6Webp from "../../images/gallery6.webp";
import gallery6Png from "../../images/gallery6.png";

const images = [
  { webp: gallery1Webp, png: gallery1Png },
  { webp: gallery2Webp, png: gallery2Png },
  { webp: gallery3Webp, png: gallery3Png },
  { webp: gallery4Webp, png: gallery4Png },
  { webp: gallery5Webp, png: gallery5Png },
  { webp: gallery6Webp, png: gallery6Png },
];

const Gallery: React.FC = () => {
  return (
    <section className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          היכנסו לעולם שלנו
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map(({ webp, png }, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-lg">
              <picture>
                <source srcSet={webp} type="image/webp" />
                <img
                  src={png}
                  alt={`תמונת סטודיו למחול ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover aspect-square transition-transform transform hover:scale-110"
                />
              </picture>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
