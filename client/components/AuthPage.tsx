import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, Phone, Loader2, ArrowRight, Building, AlertTriangle } from 'lucide-react';
import { UserService, InvitationService } from '../services/api';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Invitation State
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);
  const [invitedStudio, setInvitedStudio] = useState<{ name: string, id: string } | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studioSerial, setStudioSerial] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setInviteToken(token);
      validateToken(token);
      setIsLogin(false); // Auto switch to register
    }
  }, []);

  const validateToken = async (token: string) => {
    setValidationLoading(true);
    try {
      const res = await InvitationService.validate(token);
      if (res.valid) {
        setInvitedRole(res.role);
        if (res.studio) {
          setInvitedStudio(res.studio);
          setStudioSerial(res.studio.serial_number || ''); // Pre-fill but readonly
        }
      } else {
        setError('קישור ההזמנה אינו תקין או פג תוקף. תועבר להרשמה רגילה.');
      }
    } catch (err) {
      setError('שגיאה באימות ההזמנה. אנא נסה שנית.');
    } finally {
      setValidationLoading(false);
    }
  };

  const getTitle = () => {
    if (isLogin) return 'כניסה למערכת';
    if (invitedRole === 'ADMIN') return 'הרשמת מנהל סטודיו';
    if (invitedRole === 'INSTRUCTOR') return 'הרשמת מדריך';
    return 'הרשמת תלמיד / הורה';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Registration
        let studioId = invitedStudio?.id || null;

        // If regular registration (no token), validate studio serial manually
        if (!inviteToken) {
          try {
            const validation = await UserService.validateStudio(studioSerial);
            if (!validation.valid || !validation.studio) {
              throw new Error('מספר סטודיו לא תקין. אנא וודא את המספר מול הסטודיו.');
            }
            studioId = validation.studio.id;
          } catch (validationError: any) {
            if (validationError.response && validationError.response.status === 404) {
              throw new Error('לא נמצא סטודיו עם המספר הסידורי שהוזן.');
            }
            throw validationError;
          }
        }

        // 1. Sign up as STUDENT (Secure Default)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
              // We send STUDENT always, backend upgrades if token is valid.
              // Note: We send studio_id so they are linked immediately as pending/student
              role: 'STUDENT',
              studio_id: studioId
            },
          },
        });

        if (signUpError) throw signUpError;

        // 2. If there's an invite token, claim it to upgrade role
        if (inviteToken && authData.user) {
          try {
            // Wait for session to be established (auto sign in)
            // If email confirmation is off, we are signed in.
            // If on, we can't do this yet -> User clicks link in email -> logs in -> then what?
            // For now assuming Auto-Confirm is ON or user will be prompted to check email.
            // If they are not signed in, this call might fail 401. 
            // But usually signUp returns a session if configured.

            if (authData.session) {
              await InvitationService.accept(inviteToken);
              // REFRESH SESSION to get the new role (Admin/Instructor)
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('Session refresh failed:', refreshError);
              }
              setMessage('ההרשמה הסתיימה בהצלחה! חשבונך שודרג בהתאם להזמנה.');
            } else {
              setMessage('ההרשמה בוצעה. נא לאמת את המייל. ההזמנה תופעל לאחר הכניסה הראשונה.');
              // TODO: Persist token to local storage to retry accept on first login? 
              // For MVP we assume session exists or manual flow.
            }

          } catch (acceptError) {
            console.error('Failed to accept invite', acceptError);
            // User is created but upgrade failed. 
            setError('ההרשמה בוצעה אך הייתה שגיאה בקבלת ההזמנה. אנא פנה למנהל המערכת.');
          }
        } else {
          setMessage('נשלח מייל לאימות החשבון. יש לאשר את הכתובת לפני הכניסה.');
        }
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
        <div className="bg-indigo-600 p-8 text-center relative">
          <h1 className="text-3xl font-bold text-white mb-2">Classly</h1>
          <p className="text-indigo-100">פלטפורמה לניהול סטודיו וחוגים</p>
          {invitedRole && (
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
              <User size={12} />
              {invitedRole === 'ADMIN' ? 'הזמנת מנהל' : 'הזמנת מדריך'}
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-8 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              התחברות
            </button>
            <button
              onClick={() => { if (!inviteToken) setIsLogin(false); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {inviteToken ? 'הרשמה (מוזמן)' : 'הרשמה'}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">

            {/* Context Message for Invites */}
            {!isLogin && inviteToken && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-4 text-center">
                <p className="text-sm text-indigo-800 font-medium">
                  {invitedRole === 'INSTRUCTOR' ? 'הוזמנת להצטרף כצוות הוראה' : 'הוזמנת לנהל את הסטודיו'}
                </p>
                {invitedStudio && <p className="text-xs text-indigo-600 mt-1">עבור: {invitedStudio.name}</p>}
              </div>
            )}

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
                  <label className="text-sm font-medium text-slate-700">מספר סטודיו</label>
                  <div className="relative">
                    <Building className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={studioSerial}
                      onChange={(e) => setStudioSerial(e.target.value)}
                      readOnly={!!inviteToken} // Readonly if invited
                      className={`w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${inviteToken ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      placeholder="הזן מספר סטודיו"
                    />
                  </div>
                  {!inviteToken && <p className="text-xs text-slate-400">יש לקבל את המספר הזה מבעל הסטודיו</p>}
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
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || validationLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading || validationLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'כניסה למערכת' : getTitle()}
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