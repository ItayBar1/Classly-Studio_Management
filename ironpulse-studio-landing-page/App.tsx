import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Classes } from './components/Classes';
import { Gallery } from './components/Gallery';
import { LeadForm } from './components/LeadForm';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark selection:bg-brand-orange selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Classes />
        <Gallery />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
};

export default App;