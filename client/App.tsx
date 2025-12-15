import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { ClassSchedule } from './components/ClassSchedule';
import { AuthPage } from './components/AuthPage';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // בדיקת Session קיים
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // האזנה לשינויים בסטטוס ההתחברות
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'schedule':
        return <ClassSchedule />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <h2 className="text-2xl font-bold text-slate-300 mb-2">בקרוב...</h2>
            <p>המודול {activeTab} נמצא כרגע בפיתוח.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  // אם אין משתמש מחובר, הצג את עמוד ההתחברות
  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="ltr">
      {/* הערה: הוספתי פרופ 'onLogout' ל-Sidebar. 
         יש לעדכן את הקומפוננטה Sidebar כדי שתקבל ותשתמש בו בכפתור ה-Sign Out.
      */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        // @ts-ignore - יש להוסיף את הפרופ הזה ל-Sidebar.tsx
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-end mb-8">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{session.user.user_metadata.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 uppercase">{session.user.user_metadata.role || 'Member'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border-2 border-white shadow-sm cursor-pointer">
              {session.user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto animate-fadeIn">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;