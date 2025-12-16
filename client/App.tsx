import React, { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Sidebar } from "./components/Sidebar";
// ייבוא הקומפוננטות של המנהל
import { Dashboard } from "./components/admin/Dashboard";
import { StudentManagement } from "./components/admin/StudentManagement";
import { ClassSchedule } from "./components/admin/ClassSchedule";
import { Payments } from "./components/admin/Payments";
// ייבוא הקומפוננטות של המדריך (חדשות)
import { InstructorDashboard } from "./components/instructor/InstructorDashboard";
import { InstructorStudents } from "./components/instructor/InstructorStudents";
import { InstructorSchedule } from "./components/instructor/InstructorSchedule";
// ייבוא הקומפוננטות של הסטודנט
import { StudentDashboard } from "./components/student/StudentDashboard";
import { BrowseCourses } from "./components/student/BrowseCourses";

import { AuthPage } from "./components/AuthPage";
import { Loader2 } from "lucide-react";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole("STUDENT");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (userRole === 'ADMIN') return <Dashboard />;
        if (userRole === 'INSTRUCTOR') return <InstructorDashboard />;
        return <StudentDashboard />;
        
      case "students":
        if (userRole === 'ADMIN') return <StudentManagement />;
        if (userRole === 'INSTRUCTOR') return <InstructorStudents />;
        return <div>אין הרשאה</div>;
        
      case "schedule":
        if (userRole === 'ADMIN') return <ClassSchedule />;
        if (userRole === 'INSTRUCTOR') return <InstructorSchedule />;
        return <div>אין הרשאה</div>;
        
      case "payments":
        if (userRole === 'ADMIN') return <Payments />;
        return <div>אין הרשאה</div>;
        
      case "browse":
        if (userRole === 'STUDENT') return <BrowseCourses />;
        return <div>אין הרשאה</div>;
        
      default:
        return <div>המודול בבנייה</div>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;
  if (!session) return <AuthPage />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        // @ts-ignore
        onLogout={handleLogout}
        userRole={userRole}
      />
      <main className="flex-1 mr-64 p-8">
        <header className="flex justify-end mb-8">
           {/* כותרת משתמש זהה לקוד הקודם */}
           <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700">
                {session.user.user_metadata.full_name || "משתמש"}
              </p>
              <p className="text-xs text-slate-500 uppercase">
                {userRole === 'ADMIN' ? 'מנהל מערכת' : userRole === 'INSTRUCTOR' ? 'מדריך' : 'סטודנט'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
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