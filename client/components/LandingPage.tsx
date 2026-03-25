import React from "react";
import { Helmet } from "react-helmet-async";
import Hero from "./landing/Hero";
import Studios from "./landing/Studio";
import Instructors from "./landing/Instructors";
import Testimonials from "./landing/Testimonials";
import Contact from "./landing/FinalCTA";

const SITE_URL = "https://classly-studio-management.uk";

// JSON-LD structured data — static, defined once at module level (rendering-hoist-jsx)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Classly",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
      },
      description: "מערכת ניהול סטודיו חכמה לחוגי ספורט, מחול ופילאטיס",
      inLanguage: "he",
    },
    {
      "@type": "Person",
      name: "אלי כהן",
      jobTitle: "מדריך",
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Person",
      name: "נועה לוי",
      jobTitle: "מדריכה",
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Person",
      name: "רון גל",
      jobTitle: "מדריך",
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Person",
      name: "שיר אל",
      jobTitle: "מדריכה",
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Person",
      name: "גיא זאב",
      jobTitle: "מדריך",
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <>
      <Helmet>
        <title>Classly | מערכת ניהול סטודיו חכמה</title>
        <meta
          name="description"
          content="מערכת מתקדמת לניהול סטודיו לחוגים. פתרון חכם להרשמה מקוונת לשיעורים, ניהול תלמידים, מעקב תשלומים ומערכת שעות דינמית."
        />
        <link rel="canonical" href={SITE_URL + "/"} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div
        className="min-h-screen flex justify-center p-4 md:p-8 font-sans antialiased text-white"
        style={{
          backgroundColor: "#120e1c",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(176, 38, 255, 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(0, 210, 255, 0.1) 0%, transparent 40%)",
        }}
      >
        <div
          className="bg-dark-bg rounded-[2rem] overflow-hidden w-full max-w-6xl flex flex-col gap-8 p-6 md:p-12"
          style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        >
          {/* Header */}
          <header className="flex justify-between items-center w-full mb-8">
            <div className="text-2xl font-bold text-white tracking-widest">
              Classly
            </div>
            <nav className="hidden md:flex gap-6 text-sm text-gray-300">
              <a className="hover:text-white transition cursor-pointer">ראשי</a>
              <a className="hover:text-white transition cursor-pointer">
                קצת עלינו
              </a>
              <a className="hover:text-white transition cursor-pointer">
                סגנונות
              </a>
              <a className="hover:text-white transition cursor-pointer">
                הצוות
              </a>
            </nav>
            <button
              onClick={onLoginClick}
              className="border border-neon-blue rounded-full px-4 py-1.5 text-sm text-neon-blue shadow-neon-blue hover:bg-neon-blue hover:text-white transition"
            >
              התחברות למנויים
            </button>
          </header>

          {/* Page Sections */}
          <div className="flex flex-col gap-16">
            <Hero onLoginClick={onLoginClick} />
            <Studios />
            <Instructors />
            <Testimonials />
            <Contact onLoginClick={onLoginClick} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
