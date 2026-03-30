import React, { useRef, useState } from "react";

// rendering-hoist-jsx: static data at module level
const testimonials = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5zPT5PBCOUvGYvF3cWAMCLtxsnwrV9FKrBVlBNA6S_UBdyFf-8S3pUrgp8ucHrHavaz1khkPY5uJ38tAnnJeTefAAe2om8ZFe63WlLN14wjz_DOas7GT6CT3fsV6B7U6W_79ttBKO0ZSvDUryi3hQ37USDfziZFB8YgEysMrscXtNq9rK1bLx2XaLDhxPqP-iLkK38goyHT2VdhE8WuHSqUwFMrM7tZKe0-9jYBcuSXZO8q_8O4YqQNNKNdOqpJwLAu7L5ZBuFJM",
    name: "אורן",
    text: '"הצטרפתי לסטודיו לפני חצי שנה וזה פשוט שינה לי את החיים. המורים מקצועיים והאווירה מדהימה. ממליץ בחום!"',
    stars: true,
    variant: "featured",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuARoKVtJvyDB2hhBkPTTrm06Ms8sN50FFOjY6io0TkpgM271bnXMTggn60KbfGB48OF99XoRVVcmtqEUKxr1UXbB3W65Xke1JDsHi6GWtTdn17EYMTwJsMoq5FM1N08zNigJHEOdRf3dF7tGGf6Z_k3W_1lwx70CqIkJ_HSgHpZS4iJJ-Q7Q8nLs1uyJac9WFR6ZOONACJI93Ck7drFtTQh0aWZS9mdL_Olavw59NOzlcn9KXAbFXqzfV34_a0To4VTePMQtr3-fWk",
    name: "מאיה",
    text: '"מקום מושלם ללמוד לרקוד. היחס האישי וההשקעה של הצוות ניכרים בכל שיעור. לא יכולה לחכות לשיעור הבא."',
    stars: true,
    variant: "shimmer",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDv8kOhbrgB8he8lerKKHiXaLUjVSeMgI0eW1Y7P1Zr1LNpmtDsxQ9QcLzyxEn0ml_1r8bLGDALGMnK-T3dy8InYgQIH0Qc4XANb8f8wk3ldfx1L5M_VYihwxLc9R0_v2GS857fv5QmvlDNV82tjzyK09xXA4xd39_vbYqdLVFMNFzojuWAZAMY4MwkFhQiXCXwXGvAURauR4HUVCBUJVHyCyt5-chZH_7lzJk7aYUxu0a8gpDg_oJ3kSRpIYJU-WqMT7VsqQ33aJY",
    name: "דניאל",
    text: '"חוויה מדהימה של תנועה ומוזיקה. צוות אלופים שנותנים את הנשמה."',
    stars: false,
    variant: "dim",
  },
];

const Testimonials: React.FC = () => {
  const [activeDot, setActiveDot] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollTo = (index: number) => {
    cardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    setActiveDot(index);
  };

  const prev = () => scrollTo(Math.max(0, activeDot - 1));
  const next = () => scrollTo(Math.min(testimonials.length - 1, activeDot + 1));

  return (
    <section>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">מה התלמידים שלנו אומרים</h2>
        <p className="text-gray-400 text-sm">סיפורי ההצלחה של התלמידים שלנו</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Prev arrow */}
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-neon-blue hover:shadow-neon-blue transition-all duration-300 flex-shrink-0 text-xl"
        >
          ›
        </button>

        {/* Cards */}
        <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory flex-1">
          {testimonials.map((t, i) => (
            <div
              key={i}
              ref={(el) => (cardRefs.current[i] = el)}
              className={`glass-panel rounded-2xl p-6 min-w-[280px] snap-center relative overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-105${
                t.variant === "featured"
                  ? " border-neon-purple shadow-neon-purple"
                  : " border-gray-700"
              }`}
            >
              {t.variant === "shimmer" && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(176,38,255,0.2)] to-transparent -skew-x-12 pointer-events-none" />
              )}
              {t.variant === "dim" && (
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[rgba(176,38,255,0.2)] to-transparent skew-x-12 opacity-50 pointer-events-none" />
              )}
              {(t.variant === "featured" || t.variant === "shimmer") && (
                <div className="absolute top-4 left-4 text-neon-purple text-4xl opacity-50 select-none">
                  "
                </div>
              )}
              <div className="flex flex-col items-center mb-4 relative z-10">
                <img
                  alt={t.name}
                  className={`w-12 h-12 rounded-full mb-2 border-2 ${
                    t.variant === "featured"
                      ? "border-neon-purple"
                      : t.variant === "dim"
                        ? "border-gray-600 opacity-50"
                        : "border-gray-600"
                  }`}
                  src={t.src}
                />
              </div>
              <p
                className={`text-sm text-center mb-4 leading-relaxed relative z-10 ${
                  t.variant === "dim" ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {t.text}
              </p>
              <div
                className={`text-center font-bold relative z-10 ${
                  t.variant === "featured"
                    ? "text-neon-purple"
                    : t.variant === "dim"
                      ? "text-gray-500"
                      : ""
                }`}
              >
                {t.name}
              </div>
              {t.stars && (
                <div className="flex justify-center mt-2 text-neon-purple text-xs relative z-10">
                  ★ ★ ★ ★ ★
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-neon-blue hover:shadow-neon-blue transition-all duration-300 flex-shrink-0 text-xl"
        >
          ‹
        </button>
      </div>

      {/* Dot indicators — count matches testimonials */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, dot) => (
          <button
            key={dot}
            onClick={() => scrollTo(dot)}
            className={`w-2 h-2 rounded-full transition ${
              dot === activeDot ? "bg-white" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
