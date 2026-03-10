import React, { useState, useEffect, Suspense, lazy } from "react";
import { Sidebar } from "./components/Sidebar";
import { MobileDrawer } from "./components/MobileDrawer";
import { Loader2, Menu } from "lucide-react";
import { AuthService, UserService, getStoredUser } from "./services/api";
import type { User } from "./types/types";

// --- Lazy Load Components (Code Splitting) ---

// Landing & Auth (Default Exports assumed based on original code)
const LandingPage = lazy(() => import("./components/LandingPage"));
const ResetPassword = lazy(() =>
  import("./components/ResetPassword").then((module) => ({
    default: module.ResetPassword,
  }))
);

// AuthPage was imported as named { AuthPage }
const AuthPage = lazy(() =>
  import("./components/AuthPage").then((module) => ({
    default: module.AuthPage,
  }))
);

// Admin components (Named Exports)
const Dashboard = lazy(() =>
  import("./components/admin/Dashboard").then((module) => ({
    default: module.Dashboard,
  }))
);
const StudentManagement = lazy(() =>
  import("./components/admin/StudentManagement").then((module) => ({
    default: module.StudentManagement,
  }))
);
const ClassSchedule = lazy(() =>
  import("./components/admin/ClassSchedule").then((module) => ({
    default: module.ClassSchedule,
  }))
);
const Payments = lazy(() =>
  import("./components/admin/Payments").then((module) => ({
    default: module.Payments,
  }))
);
const Administration = lazy(() =>
  import("./components/admin/Administration/Administration").then((module) => ({
    default: module.Administration,
  }))
);
const Settings = lazy(() =>
  import("./components/admin/Settings").then((module) => ({
    default: module.Settings,
  }))
);

// Super Admin components (Named Exports)
const PlatformAdministration = lazy(() =>
  import("./components/super-admin/PlatformAdministration").then((module) => ({
    default: module.PlatformAdministration,
  }))
);
const SuperAdminDashboard = lazy(() =>
  import("./components/super-admin/SuperAdminDashboard").then((module) => ({
    default: module.SuperAdminDashboard,
  }))
);

// Instructor components (Named Exports)
const InstructorDashboard = lazy(() =>
  import("./components/instructor/InstructorDashboard").then((module) => ({
    default: module.InstructorDashboard,
  }))
);
const InstructorStudents = lazy(() =>
  import("./components/instructor/InstructorStudents").then((module) => ({
    default: module.InstructorStudents,
  }))
);
const InstructorSchedule = lazy(() =>
  import("./components/instructor/InstructorSchedule").then((module) => ({
    default: module.InstructorSchedule,
  }))
);

// Student components (Named Exports)
const StudentDashboard = lazy(() =>
  import("./components/student/StudentDashboard").then((module) => ({
    default: module.StudentDashboard,
  }))
);
const BrowseCourses = lazy(() =>
  import("./components/student/BrowseCourses").then((module) => ({
    default: module.BrowseCourses,
  }))
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string>("STUDENT");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // mobile drawer
  // If an invitation token is present in the URL, skip the LandingPage and go straight to AuthPage
  const [showLogin, setShowLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('token');
  });

  // Keep track of which tabs have been visited to lazy-load them
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set(["dashboard"])
  );

  // Check for reset password route
  const isResetPassword = window.location.pathname === "/reset-password";

  // Accessibility Widget Injection
  useEffect(() => {
    const isA11yEnabled = import.meta.env.VITE_A11Y_WIDGET_ENABLED === "true";
    if (isA11yEnabled) {
      const scriptId = "a11y-widget-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://nagishli.co.il/widget.js"; // Example provider
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        console.info("Accessibility widget injected");
      }
    }
  }, []);

  // Fetch the latest role from the backend (authoritative source)
  const fetchUserRole = async () => {
    try {
      const user = await UserService.getMe();
      if (user?.role) {
        setUserRole(user.role);
        setCurrentUser(user);
        console.info("Role updated from backend", { role: user.role });
      }
    } catch (err) {
      console.error("Failed to fetch user role from backend", err);
      // If we can't fetch the user, the token might be invalid
      AuthService.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  // Initial auth check
  useEffect(() => {
    console.info("App initialization started");
    
    if (AuthService.isAuthenticated()) {
      setIsAuthenticated(true);
      // Load cached user data immediately
      const cachedUser = getStoredUser();
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setUserRole(cachedUser.role || "STUDENT");
      }
      // Then fetch authoritative role from DB
      fetchUserRole().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    console.info("Initial auth check completed");
  }, []);

  useEffect(() => {
    setVisitedTabs((prev) => {
      const newSet = new Set(prev);
      newSet.add(activeTab);
      return newSet;
    });
  }, [activeTab]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      setUserRole(cachedUser.role || "STUDENT");
    }
    fetchUserRole();
  };

  const handleLogout = () => {
    try {
      console.info("User requested logout");
      AuthService.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole("STUDENT");
      setVisitedTabs(new Set(["dashboard"]));
      setActiveTab("dashboard");
      setShowLogin(false);
      console.info("User signed out successfully");
    } catch (error) {
      console.error("Failed to sign out user", error);
    }
  };

  const getComponentForTab = (tabName: string) => {
    switch (tabName) {
      case "dashboard":
        if (userRole === "SUPER_ADMIN") return <SuperAdminDashboard />;
        if (userRole === "ADMIN") return <Dashboard />;
        if (userRole === "INSTRUCTOR") return <InstructorDashboard />;
        return <StudentDashboard activeTab={activeTab} />;

      case "students":
        if (userRole === "ADMIN") return <StudentManagement />;
        if (userRole === "INSTRUCTOR") return <InstructorStudents />;
        return <div>אין הרשאה</div>;

      case "schedule":
        if (userRole === "ADMIN") return <ClassSchedule />;
        if (userRole === "INSTRUCTOR") return <InstructorSchedule />;
        return <div>אין הרשאה</div>;

      case "payments":
        if (userRole === "ADMIN") return <Payments />;
        return <div>אין הרשאה</div>;

      case "administration":
        if (userRole === "SUPER_ADMIN") return <PlatformAdministration />;
        if (userRole === "ADMIN") return <Administration />;
        return <div>אין הרשאה</div>;

      case "settings":
        if (userRole === "ADMIN") return <Settings />;
        return <div>אין הרשאה</div>;

      case "browse":
        if (userRole === "STUDENT") return <BrowseCourses />;
        return <div>אין הרשאה</div>;

      default:
        return <div>המודול בבנייה</div>;
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );

  // Render Suspense fallback for Auth/Reset pages
  if (isResetPassword) {
    return (
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
          </div>
        }
      >
        <ResetPassword onSuccess={() => (window.location.href = "/")} />
      </Suspense>
    );
  }

  // If not authenticated, decide whether to show the LandingPage or the AuthPage
  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
          </div>
        }
      >
        {showLogin ? (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        ) : (
          <LandingPage onLoginClick={() => setShowLogin(true)} />
        )}
      </Suspense>
    );
  }

  // List of all possible tabs for authenticated users
  const allTabs = [
    "dashboard",
    "students",
    "schedule",
    "payments",
    "administration",
    "settings",
    "browse",
  ];

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
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600"
          >
            <Menu size={24} />
          </button>

          {/* User header */}
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700">
                {currentUser?.full_name || "משתמש"}
              </p>
              <p className="text-xs text-slate-500 uppercase">
                {userRole === "SUPER_ADMIN"
                  ? "מנהל פלטפורמה"
                  : userRole === "ADMIN"
                  ? "מנהל מערכת"
                  : userRole === "INSTRUCTOR"
                  ? "מדריך"
                  : "סטודנט"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {currentUser?.email?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto animate-fadeIn">
          {allTabs.map((tab) => {
            // Keep tabs alive if they were visited
            if (!visitedTabs.has(tab) && activeTab !== tab) return null;

            return (
              <div key={tab} className={activeTab === tab ? "block" : "hidden"}>
                <Suspense
                  fallback={
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                    </div>
                  }
                >
                  {getComponentForTab(tab)}
                </Suspense>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
