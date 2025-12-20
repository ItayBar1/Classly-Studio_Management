import React from 'react';
import Hero from './landing/Hero';
import Testimonials from './landing/Testimonials';
import ClassOfferings from './landing/ClassOfferings';
import Gallery from './landing/Gallery';
import Instructors from './landing/Instructors';
import Studio from './landing/Studio';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const handlePrimaryCtaClick = () => {
    console.log('Primary CTA clicked');
  };

  const handleSecondaryCtaClick = () => {
    console.log('Secondary CTA clicked');
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen" dir="rtl">
      <header className="fixed top-0 left-0 right-0 bg-slate-900 bg-opacity-80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="text-2xl font-bold text-white">
              <span className="text-indigo-500">❖</span> Classly
            </div>
            <nav>
              <button
                onClick={onLoginClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                התחברות / הרשמה
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main>
        <Hero 
          onPrimaryCtaClick={handlePrimaryCtaClick}
          onSecondaryCtaClick={handleSecondaryCtaClick}
        />
        <Testimonials />
        <ClassOfferings />
        <Gallery />
        <Instructors />
        <Studio />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer onLoginClick={onLoginClick} />
    </div>
  );
};

export default LandingPage;
