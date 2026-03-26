import React, { useState } from "react";

const instructors = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRD4vxyiyi5rIz_HfhddLDA6LFvnxqZAW8Rb7dNwT9xzgIupp-qdyG_rVjysPwbDzde3fG2dlh4JjP4DHIo79KkZWCNCn1i1jZO35Z7eR-gIvgcvBi-1A9v0HfxzkMGD9mvGg5YzWjLC9BhuWJhRiOSUG8DIBgT_Z53tM9-i57C9Akcl4SadQ4bV9DaIId4tQofY4PBcHXxzCxc-dYzszGYeN_zP_dUO0R7aZuohHsDwX2LO6THUlwks37wibgVemo9iuJRzY_9M8",
    name: "אלי כהן",
    accent: "neon-blue" as const,
    featured: false,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-Hm-bXzRJa5eDXo5wm-1UXCBZst7qUELOTFfiRZAhB6DNRxFInM-ZURj9zNUWzO4X7eADZkLVmGhBwb1iWHssR0alafZytT0b7NHHcz2zigXSq_siZVXV55H6SF-9AOPvYPgAVYbHfxYEgAaDgW7pJrCR0wU-qrA5RLI0dSl9s0Hi9SJV7WdVNffmcFkjB_yVD5IhbeXALePPc7kHaKy2cR2Tc_d4BiRCXO8lejJ4sCytaDXaDICtWEddav-1R_Qt0A0vm-lVmp8",
    name: "נועה לוי",
    accent: "neon-purple" as const,
    featured: true,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEk4w-z1S1w7YQeA2LnsSoiU_1fysSM6VJQIdJZPdqqPRAoiZoWKbJLKn1TuaMK3OgpcqDLD5fmEcbJLDmIpo3aq_zBy72Q1fNbG5Gzo2znYdAeRTw1PKwl1SOhD9P80dpWkOIKY90Llk9KMcaPnXAyxVh8-QmnNR3_4WbipianPETFBmqH8WnEh7EUAXJIiaSvXZWk1DnOQGxSQaBGlCaQHcVSSNSd1Kyng1tYhwcwa1NIfx9YaO-XDYi9sjE1HzGoog2xGrXNePk",
    name: "רון גל",
    accent: null,
    featured: false,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBF3xqtAaVWI7r7LwM3g1VpxZzKnJJau2EHn9LFJxbR-5YmUDmwTyJWO4TO71LNtkPHTYvAcqJjotsIogpPP9XDnElEehFHZDlH5g37Ix5XCtFwoeQUiObsRaifj_K40A0Fq3X_xEPRNeUx5XDkIBhTmhKcqtPnC0ojf7cXqbYlRFYdEjiOVFyuBa8QymHgdWSWD1AKlMHpdm2MDRxmdcaBLv_ed-M7hn8W_ltq6NeNzA9I5q54faAqOFL1kTlcxndI0WusFKsARG4",
    name: "שיר אל",
    accent: null,
    featured: false,
    hiddenOnMobile: true,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuADfuz7wwI4PmAzo1eWowvxUtQ__YobN47a4C3WD5scdxldUlm0-S7EadleI0rQ38sENCnmx3UhziaCHVVlf8x35W7UkqVicoVICEQ5eUjvZC_L3TBEesMgX_0r8Vhp2j20wVzI9VaDNYMfC1AzyF-2KZr3v21FalyZ39xPRVGIiLFLTnTuwsPqOTKR9K_k7eQyjXmNo6Hl5N6ImpBj_lddA9SzK87sNdRRU12lz7WYol8k2_9Ky0rKSA2Rz5MnSGDNtSVpbgK6BXQ",
    name: "גיא זאב",
    accent: "neon-blue" as const,
    featured: false,
    hiddenOnMobile: true,
  },
];

const Instructors: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  const prev = () =>
    setActiveIndex((i) => (i - 1 + instructors.length) % instructors.length);
  const next = () => setActiveIndex((i) => (i + 1) % instructors.length);

  return (
    <section className="bg-panel-bg rounded-[2rem] p-8 border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">המדריכים שלנו</h2>
        <p className="text-gray-400 text-sm">הצוות המקצועי שילווה אתכם</p>
      </div>
      <div className="flex items-center justify-between gap-2 relative">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white z-10 flex-shrink-0"
        >
          &lt;
        </button>
        <div className="flex justify-around flex-1 relative">
          {instructors.map((instructor, i) => {
            const isActive = i === activeIndex;
            const borderClass =
              instructor.accent === "neon-purple"
                ? "border-neon-purple shadow-neon-purple"
                : instructor.accent === "neon-blue"
                  ? "border-neon-blue shadow-neon-blue"
                  : "border-gray-600";

            return (
              <div
                key={i}
                className={`flex flex-col items-center relative group cursor-pointer${
                  instructor.hiddenOnMobile ? " hidden md:flex" : ""
                }`}
                onClick={() => setActiveIndex(i)}
              >
                {instructor.accent === "neon-blue" && (
                  <div className="absolute inset-0 bg-neon-blue rounded-full blur-md opacity-0 group-hover:opacity-50 transition -z-10 scale-110"></div>
                )}
                {instructor.accent === "neon-purple" && isActive && (
                  <div className="absolute inset-0 bg-neon-purple rounded-full blur-md opacity-20 -z-10 scale-110"></div>
                )}
                <img
                  alt={instructor.name}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 object-cover transition${
                    isActive ? " -translate-y-2" : " opacity-70"
                  } ${borderClass}`}
                  src={instructor.src}
                />
                <span
                  className={`text-xs mt-2 ${
                    isActive
                      ? instructor.accent === "neon-purple"
                        ? "font-bold text-white"
                        : "text-gray-300"
                      : "text-gray-400"
                  }`}
                >
                  {instructor.name}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={next}
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white z-10 flex-shrink-0"
        >
          &gt;
        </button>
      </div>
    </section>
  );
};

export default Instructors;
