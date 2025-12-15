import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, Phone, Briefcase, Loader2, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('STUDENT');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // התחברות
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // הרשמה
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
              role: role,
              // ב-Supabase נהוג להשתמש ב-Trigger בבסיס הנתונים כדי להעתיק את המידע
              // מטבלת auth.users לטבלת public.users
            },
          },
        });
        if (error) throw error;
        setMessage('נשלח מייל לאימות החשבון. יש לאשר את הכתובת לפני הכניסה.');
      }
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בתהליך האימות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Classly</h1>
          <p className="text-indigo-100">פלטפורמה לניהול סטודיו וחוגים</p>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-8 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">שם מלא</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="ישראל ישראלי"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">טלפון</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="050-0000000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">תפקיד</label>
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-3 text-slate-400" size={18} />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="STUDENT">תלמיד / הורה</option>
                      <option value="INSTRUCTOR">מדריך</option>
                      <option value="ADMIN">מנהל סטודיו</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">דואר אלקטרוני</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'כניסה למערכת' : 'הרשמה'}
                  <ArrowRight size={18} className="rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            בכניסה למערכת אתה מסכים לתנאי השימוש ומדיניות הפרטיות
          </p>
        </div>
      </div>
    </div>
  );
};