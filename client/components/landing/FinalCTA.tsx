import React, { useState } from "react";

interface ContactProps {
  onLoginClick: () => void;
}

const Contact: React.FC<ContactProps> = ({ onLoginClick }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginClick();
  };

  return (
    <section className="bg-panel-bg rounded-[2rem] p-8 border border-gray-800">
      <h2 className="text-3xl font-bold mb-6 text-center">המדריכים:</h2>
      <div
        className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-8"
        style={{
          border: "1px solid rgba(0,210,255,0.3)",
          boxShadow: "0 0 20px rgba(0,210,255,0.15)",
        }}
      >
        {/* Contact form */}
        <form className="flex-1 flex flex-col gap-4" onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold text-right mb-2">השאירו פרטים:</h3>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition text-right"
            placeholder="שם מלא"
            type="text"
          />
          <div className="flex gap-4">
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition text-right"
              placeholder='דוא"ל'
              type="email"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-1/3 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition text-right"
              placeholder="טלפון"
              type="tel"
            />
          </div>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition text-right resize-none"
            placeholder="הודעה"
            rows={3}
          />
          <button
            type="submit"
            className="border border-neon-blue text-neon-blue rounded-full px-8 py-2 font-bold shadow-neon-blue hover:bg-neon-blue hover:text-white transition w-max mx-auto mt-2"
          >
            שלח
          </button>
        </form>

        {/* Map */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-700 min-h-[200px]">
          <img
            alt="Map"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLCQ4Y5t5VFIUAvpoTmnjiOyOeY0UrJTcc57MKPgtDJkHsk6asS1C0HB2XnuA3e8AiwwZTyxcdzkq8ntcQHBaretWY_r-TyKFZuMehweaqAVvH8GCLP-qNXyPLR7hY9x_oKpH6evR7oat4IYjTljJVl5G235Yiv7QD7zXIRLXc805v_YPjacIJ32dAmEHRIhxnwqgmTK8hFmEVd7iR0YPVOREz8GrcsnZV6IuV8jUm43-XYLb-eueiKjCU1DGYG-Z9cSdLv1VKLsw"
          />
          <div
            className="absolute top-1/4 left-1/3 w-3 h-3 bg-neon-purple rounded-full border-2 border-white"
            style={{ boxShadow: "0 0 15px rgba(176, 38, 255, 0.5)" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-neon-blue rounded-full border-2 border-white"
            style={{ boxShadow: "0 0 15px rgba(0, 210, 255, 0.5)" }}
          />
          <div
            className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-neon-purple rounded-full border-2 border-white"
            style={{ boxShadow: "0 0 15px rgba(176, 38, 255, 0.5)" }}
          />
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ filter: "drop-shadow(0 0 5px rgba(0, 210, 255, 0.8))" }}
          >
            <path
              d="M 130 75 Q 180 120 200 150 T 100 220"
              fill="transparent"
              opacity="0.7"
              stroke="#00d2ff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Contact;
