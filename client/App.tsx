import React, { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Sidebar } from "./components/Sidebar";
import { MobileDrawer } from "./components/MobileDrawer"; // Import the new component
import LandingPage from "./components/LandingPage"; // Import the new LandingPage component

// Admin components
import { Dashboard } from "./components/admin/Dashboard";
import { StudentManagement } from "./components/admin/StudentManagement";
import { ClassSchedule } from "./components/admin/ClassSchedule";
import { Payments } from "./components/admin/Payments";
import { Administration } from "./components/admin/Administration/Administration";
// Super Admin components
import { PlatformAdministration } from "./components/super-admin/PlatformAdministration";
import { SuperAdminDashboard } from "./components/super-admin/SuperAdminDashboard";
import { Settings } from "./components/admin/Settings";

// Instructor components
import { InstructorDashboard } from "./components/instructor/InstructorDashboard";
import { InstructorStudents } from "./components/instructor/InstructorStudents";
import { InstructorSchedule } from "./components/instructor/InstructorSchedule";

// Student components
import { StudentDashboard } from "./components/student/StudentDashboard";
import { BrowseCourses } from "./components/student/BrowseCourses";

import { AuthPage } from "./components/AuthPage";
import { ResetPassword } from "./components/ResetPassword"; // Import ResetPassword
import { Loader2, Menu } from "lucide-react";
import { UserService } from "./services/api";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string>("STUDENT");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // mobile drawer
  const [showLogin, setShowLogin] = useState(false); // LandingPage vs AuthPage

  // Keep track of which tabs have been visited to lazy-load them
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["dashboard"]));

  // Check for reset password route
  const isResetPassword = window.location.pathname === '/reset-password';

  // Accessibility Widget Injection
  useEffect(() => {
    const isA11yEnabled = import.meta.env.VITE_A11Y_WIDGET_ENABLED === 'true';
    if (isA11yEnabled) {
      const scriptId = 'a11y-widget-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://nagishli.co.il/widget.js'; // Example provider
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        console.info('Accessibility widget injected');
      }
    }
  }, []);

  // Fetch the latest role from the backend (authoritative source)
  const fetchUserRole = async () => {
    try {
      const user = await UserService.getMe();
      if (user?.role) {
        setUserRole(user.role);
        console.info("Role updated from backend", { role: user.role });
      }
    } catch (err) {
      console.error("Failed to fetch user role from backend", err);
    }
  };

  useEffect(() => {
    console.info('App initialization started');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Optimistically set from metadata first (fast)
        if (session.user.user_metadata?.role) {
          setUserRole(session.user.user_metadata.role);
        }
        // Then fetch authoritative role from DB (reliable)
        fetchUserRole();
      }
      setLoading(false);
      console.info('Initial session check completed');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        if (session.user.user_metadata?.role) {
          setUserRole(session.user.user_metadata.role);
        }
        fetchUserRole();
      }
    });

    return () => {
      console.info('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setVisitedTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(activeTab);
      return newSet;
    });
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      console.info('User requested logout');
      await supabase.auth.signOut();
      setUserRole("STUDENT");
      setVisitedTabs(new Set(["dashboard"]));
      setActiveTab("dashboard");
      console.info('User signed out successfully');
    } catch (error) {
      console.error('Failed to sign out user', error);
    }
  };

  const getComponentForTab = (tabName: string) => {
    // ... (rest of the function remains the same)
    switch (tabName) {
      case "dashboard":
        if (userRole === 'SUPER_ADMIN') return <SuperAdminDashboard />;
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

      case "administration":
        if (userRole === 'SUPER_ADMIN') return <PlatformAdministration />;
        if (userRole === 'ADMIN') return <Administration />;
        return <div>אין הרשאה</div>;

      case "settings":
        if (userRole === 'ADMIN') return <Settings />;
        return <div>אין הרשאה</div>;

      case "browse":
        if (userRole === 'STUDENT') return <BrowseCourses />;
        return <div>אין הרשאה</div>;

      default:
        return <div>המודול בבנייה</div>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  if (isResetPassword) {
    return <ResetPassword onSuccess={() => window.location.href = '/'} />;
  }

  // If there's no session, decide whether to show the LandingPage or the AuthPage
  if (!session) {
    return showLogin ? <AuthPage /> : <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  // List of all possible tabs for authenticated users
  const allTabs = ["dashboard", "students", "schedule", "payments", "administration", "settings", "browse"];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Desktop Sidebar - hidden on small screens */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userRole={userRole}
        />
      </div>
      
      {/* Mobile Drawer */}
      <MobileDrawer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userRole={userRole}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className="flex-1 md:mr-64 p-4 sm:p-8">
        <header className="flex justify-end items-center mb-8">
          {/* Hamburger Menu - visible only on small screens */}
          <button onClick={() => setIsDrawerOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-indigo-600">
            <Menu size={24} />
          </button>
          
          {/* User header reused from previous version */}
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700">
                {session.user.user_metadata.full_name || "משתמש"}
              </p>
              <p className="text-xs text-slate-500 uppercase">
                {userRole === 'SUPER_ADMIN' ? 'מנהל פלטפורמה' : userRole === 'ADMIN' ? 'מנהל מערכת' : userRole === 'INSTRUCTOR' ? 'מדריך' : 'סטודנט'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {session.user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {allTabs.map(tab => {
            if (!visitedTabs.has(tab) && activeTab !== tab) return null;
            return (
              <div key={tab} className={activeTab === tab ? "block" : "hidden"}>
                {getComponentForTab(tab)}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;