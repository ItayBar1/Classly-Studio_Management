import React from 'react';

export const Gallery: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">תוצאות מדברות בעד עצמן</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            הצטרפו למאות מתאמנים שכבר עשו את השינוי. האווירה אצלנו מחשמלת, האנרגיות בשמיים, והגוף שלכם יודה לכם.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 h-[500px]">
            {/* Large Image Left */}
            <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group">
                <img src="/images/Male athlete training.avif" alt="Male athlete training" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            
            {/* Small Images */}
            <div className="relative rounded-2xl overflow-hidden group">
                <img src="/images/Female athlete training.avif" alt="Female athlete training" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="relative rounded-2xl overflow-hidden group">
                <img src="/images/male runner.png" alt="Male runner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="relative rounded-2xl overflow-hidden group">
                <img src="/images/group training.avif" alt="Group training" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
             <div className="relative rounded-2xl overflow-hidden group">
                <img src="/images/strength-training.avif" alt="Strength training" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
        </div>
       </div>
    </section>
  );
};