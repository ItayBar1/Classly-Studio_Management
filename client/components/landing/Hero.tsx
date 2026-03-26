import React from "react";

interface HeroProps {
  onLoginClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginClick }) => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between gap-8">
      {/* Dancer image – order-2 on desktop so it appears on the left in RTL */}
      <div className="flex-1 order-2 md:order-1 relative">
        <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-neon-purple to-neon-blue opacity-20 blur-2xl rounded-full"></div>
          <img
            alt="Dancer"
            className="relative z-10 w-full h-full object-cover rounded-3xl"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0JX0WPfLfvIcv8ZlIWO23bkv8cmTy86t4JTfug6HwiXp7Zq9PAd4fIPtlj94Zohqbweyt2ttH9LElapp2a2Gf_aHU2rgPLM_hl3ngUKKMurKUxUxuk_La8aVJSqt2nmHMU6Gag5RUjGuO4aOeFO1fM9YsRha2pRP8HTfyrcdpbtdaoGvGwEkmZodcg72oqGCbtEdBmU0orROUfSE48XhZRizXzHS8JSrrn6_oFpjFHFIiGF0SN5vkHsCz0n-Ge4GikrpRIcpC1Fo"
            style={{ filter: "drop-shadow(0 0 20px rgba(0, 210, 255, 0.4))" }}
          />
        </div>
      </div>

      {/* Text content – order-1 so it appears on the right in RTL */}
      <div className="flex-1 order-1 md:order-2 text-right">
        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
          Classly:
          <br />
          <span className="text-white">לגלות את הקצב שלך.</span>
          <br />
          <span className="text-white">לרקוד את החיים.</span>
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mr-auto">
          Classly מזמינה אתכם להצטרף לקהילה. מקום בו כל תנועה היא ביטוי עצמי.
          גלו את הקצב המיוחד שלכם.
        </p>
        <div className="flex justify-end gap-4">
          <button className="bg-neon-purple text-white rounded-full px-8 py-3 font-bold shadow-neon-purple hover:opacity-80 transition">
            למערכת השעות
          </button>
          <button
            onClick={onLoginClick}
            className="border border-neon-blue text-neon-blue rounded-full px-8 py-3 font-bold shadow-neon-blue hover:bg-neon-blue hover:text-white transition"
          >
            הצטרפו עכשיו
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
