import React from "react";

const studioImages = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwUXRetI9w9ea4-totNBlKptSs05gER-VN3P181HIP6Yf-Pw8UkMZ8M6Qzjvyt-bBKssdXGhDDWDtUN22EeC87VnJDNWgNedEMMD5VDTX9sBJ3uN8wEUQMSOZnD1gUwPzyfEjHnwOBqSn1VgCnwMmYo5JRcuoyNfasGImKD75qVR2rGgBl1-pMTveSVqpYv6jCz92PjRiO5CsPlLHwYOAEg3UXqJz1bHxhf0eMv4EJMUUysUafzUobEVVLLTnugVmdIuqN_tOPqTg",
    alt: "Studio",
    featured: false,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuALGHisSq8X1-Rdv8pPj_AvgWWg4SncuWDmExQLeUKfx6w6aMrIYGCQq4auW4VcFM0ycvMO21gPwksHR1g3BYDRdM1e9bdJ7tXt1JIihawM9HbJn3K85jKzAOrTaJr23QJkb50EOgY8w32OnbmxC3ufYF4lRYU8lNHUSkwwVYGbdKSk8aRR4_UwznOxVbEXMVxHXNCsazVosxdFlye-PfLey3TFxdrtDdRzTl1GheMsU-oCB3fPr0hTweh0EtyQSau_heOgfrc2t0o",
    alt: "Tel Aviv Studio",
    featured: true,
    name: "סטודיו תל אביב",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzngjpT4u_BY0ffAAjLt6DNvyVUGG1eUZCFguwsmBXF9bJVXf2X41bp0wFcJRWvIGvfh38P3hLjsG1mafqrfO6l0_EEfu1C-REjIeUfVgvP0MQaR9biCtuBl36w9aOX4VSw9H9cpIKlIsSc1vmnYX2jjb1V_AqK_tyozqL_9EN31YYwUnREp2Lh4c_jLNlCEFDSuJ6sSTQusXfzdjva-p0r89GbuN6a7uA8tApPwVxtrZhMYuVGM_bTJwFNMrQCkmgn4BupyhxRPg",
    alt: "Studio",
    featured: false,
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNOJWAVJUSauDdU8PHdnJGPhprP-OZRhbEmdG2tqtce5SV-Y_U_JXjniTQgobZuSe-dT-y1fpdHhfIqxJgFGrrXz8g2qIr28mmC2v-oUS8MM8ztVr1OEVvVhcippLO7ikAyS1-oomvedyPmgrV8AmdlShlYuhjrEnY-Odh1YlXnM8QPIazoRuVXZWMrwkamstJBkG8SEl81xvmB-lL3Y35zuSo-bmWsJx9F0JBH_I5PMmQ24Ht3SJS9FNogxxH4yaxGE51qonGr3k",
    alt: "Studio",
    featured: false,
    hiddenOnMobile: true,
  },
];

const Studio: React.FC = () => {
  return (
    <section className="bg-panel-bg rounded-[2rem] p-8 border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">הסטודיואים שלנו</h2>
        <p className="text-gray-400 text-sm">בואו לרקוד באחד מהסניפים שלנו</p>
      </div>
      <div className="flex gap-4 justify-center items-end">
        {studioImages.map((studio, i) =>
          studio.featured ? (
            <div
              key={i}
              className="rounded-xl overflow-hidden border-2 border-neon-purple shadow-neon-purple w-32 h-40 relative -translate-y-2 flex-shrink-0"
            >
              <img
                alt={studio.alt}
                className="w-full h-full object-cover"
                src={studio.src}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent p-3 text-center">
                <div className="font-bold text-sm mb-1">{studio.name}</div>
                <button className="bg-neon-purple text-white text-xs px-3 py-1 rounded-full shadow-neon-purple">
                  קראו עוד
                </button>
              </div>
            </div>
          ) : (
            <div
              key={i}
              className={`rounded-xl overflow-hidden border border-gray-700 w-24 h-32 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition cursor-pointer flex-shrink-0${
                studio.hiddenOnMobile ? " hidden md:block" : ""
              }`}
            >
              <img
                alt={studio.alt}
                className="w-full h-full object-cover"
                src={studio.src}
              />
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default Studio;
