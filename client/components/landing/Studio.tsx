import React, { useState } from "react";

// rendering-hoist-jsx: static data defined at module level, not inside component
const studios = [
  {
    name: "סטודיו תל אביב",
    label: "תל אביב",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuALGHisSq8X1-Rdv8pPj_AvgWWg4SncuWDmExQLeUKfx6w6aMrIYGCQq4auW4VcFM0ycvMO21gPwksHR1g3BYDRdM1e9bdJ7tXt1JIihawM9HbJn3K85jKzAOrTaJr23QJkb50EOgY8w32OnbmxC3ufYF4lRYU8lNHUSkwwVYGbdKSk8aRR4_UwznOxVbEXMVxHXNCsazVosxdFlye-PfLey3TFxdrtDdRzTl1GheMsU-oCB3fPr0hTweh0EtyQSau_heOgfrc2t0o",
  },
  {
    name: "סטודיו הרצליה",
    label: "הרצליה",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwUXRetI9w9ea4-totNBlKptSs05gER-VN3P181HIP6Yf-Pw8UkMZ8M6Qzjvyt-bBKssdXGhDDWDtUN22EeC87VnJDNWgNedEMMD5VDTX9sBJ3uN8wEUQMSOZnD1gUwPzyfEjHnwOBqSn1VgCnwMmYo5JRcuoyNfasGImKD75qVR2rGgBl1-pMTveSVqpYv6jCz92PjRiO5CsPlLHwYOAEg3UXqJz1bHxhf0eMv4EJMUUysUafzUobEVVLLTnugVmdIuqN_tOPqTg",
  },
  {
    name: "סטודיו חיפה",
    label: "חיפה",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzngjpT4u_BY0ffAAjLt6DNvyVUGG1eUZCFguwsmBXF9bJVXf2X41bp0wFcJRWvIWvfh38P3hLjsG1mafqrfO6l0_EEfu1C-REjIeUfVgvP0MQaR9biCtuBl36w9aOX4VSw9H9cpIKlIsSc1vmnYX2jjb1V_AqK_tyozqL_9EN31YYwUnREp2Lh4c_jLNlCEFDSuJ6sSTQusXfzdjva-p0r89GbuN6a7uA8tApPwVxtrZhMYuVGM_bTJwFNMrQCkmgn4BupyhxRPg",
  },
  {
    name: "סטודיו ירושלים",
    label: "ירושלים",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNOJWAVJUSauDdU8PHdnJGPhprP-OZRhbEmdG2tqtce5SV-Y_U_JXjniTQgobZuSe-dT-y1fpdHhfIqxJgFGrrXz8g2qIr28mmC2v-oUS8MM8ztVr1OEVvVhcippLO7ikAyS1-oomvedyPmgrV8AmdlShlYuhjrEnY-Odh1YlXnM8QPIazoRuVXZWMrwkamstJBkG8SEl81xvmB-lL3Y35zuSo-bmWsJx9F0JBH_I5PMmQ24Ht3SJS9FNogxxH4yaxGE51qonGr3k",
  },
];

const Studio: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-panel-bg rounded-[2rem] overflow-hidden border border-gray-800 transition-all duration-500">
      {/* Spotlight viewer */}
      <div className="relative h-[500px] w-full overflow-hidden">
        {studios.map((studio, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={studio.src}
              alt={studio.name}
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-xl">
                {studio.name}
              </h3>
              <button className="bg-neon-purple hover:bg-white hover:text-neon-purple px-10 py-4 rounded-full font-bold shadow-neon-purple transition-all duration-300 transform hover:scale-110">
                קראו עוד
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Thumbnail nav strip */}
      <div className="flex gap-4 p-4 md:p-8 bg-black/40 backdrop-blur-md justify-center items-center">
        {studios.map((studio, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="cursor-pointer group flex flex-col items-center gap-2"
          >
            <div
              className={`w-20 h-28 md:w-24 md:h-32 rounded-xl border-2 overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                i === active
                  ? "border-neon-purple shadow-neon-purple"
                  : "border-gray-700 group-hover:border-neon-purple"
              }`}
            >
              <img
                src={studio.src}
                alt={studio.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span
              className={`text-xs md:text-sm transition-colors duration-300 ${
                i === active
                  ? "text-white"
                  : "text-gray-400 group-hover:text-white"
              }`}
            >
              {studio.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default Studio;
