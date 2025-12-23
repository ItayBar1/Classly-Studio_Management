import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordProps {
  onSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בעדכון הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">איפוס סיסמה</h2>
          <p className="text-slate-600 mt-2">הזן את הסיסמה החדשה שלך למטה.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium text-slate-700">סיסמה חדשה</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-400" size={18} />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="לפחות 8 תווים"
                minLength={8}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">אימות סיסמה</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-400" size={18} />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pr-10 pl-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="הזן שנית את הסיסמה"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'עדכן סיסמה'}
          </button>
        </form>
      </div>
    </div>
  );
};
