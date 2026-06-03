import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { Loader2 } from "lucide-react";
import { AuthService, UserService, getStoredUser } from "./services/api";
import type { User } from "./types/types";
import { initializeTheme } from "./utils/theme";

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
const InstructorAttendanceTab = lazy(() =>
  import("./components/instructor/InstructorAttendanceTab").then((module) => ({
    default: module.InstructorAttendanceTab,
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
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string>("STUDENT");

  // Invite token causes the AuthPage to render even on "/"
  const [showLogin, setShowLogin] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (
        params.has("token") || !!sessionStorage.getItem("pendingInviteToken")
      );
    }
    return false;
  });

  const isResetPassword = location.pathname === "/reset-password";

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

  // Initial auth check — reads the HttpOnly cookie via GET /api/auth/me.
  // Cannot inspect the cookie from JavaScript; the server is the source of truth.
  useEffect(() => {
    console.info("App initialization started");

    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token");

    const initialize = async () => {
      // Handle invitation token: clean the URL, then clear any active session
      // so the invite flow starts from a clean state.
      if (inviteToken && !isResetPassword) {
        sessionStorage.setItem("pendingInviteToken", inviteToken);
        navigate(location.pathname, { replace: true }); // strip ?token= from URL
        console.info("Logging out existing user to process new invite token");
        await AuthService.logout().catch(() => {}); // clear cookie if one exists
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole("STUDENT");
        navigate("/auth"); // URL-based navigation to auth page
        setLoading(false);
        return;
      }

      try {
        await AuthService.me(); // throws 401 if no valid session
        setIsAuthenticated(true);
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
          setUserRole(cachedUser.role || "STUDENT");
        }
        fetchUserRole(); // background refresh of full profile
      } catch {
        // 401 — no active session, show landing page
      } finally {
        setLoading(false);
      }
    };

    initialize();
    console.info("Initial auth check completed");
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      setUserRole(cachedUser.role || "STUDENT");
    }
    fetchUserRole();
    navigate("/"); // return to root after login
  };

  const handleLogout = async () => {
    try {
      console.info("User requested logout");
      await AuthService.logout(); // clears HttpOnly cookie server-side
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole("STUDENT");
      setActiveTab("dashboard");
      setShowLogin(false);
      navigate("/"); // return to landing after logout
      console.info("User signed out successfully");
    } catch (error) {
      console.error("Failed to sign out user", error);
    }
  };

  const getComponentForTab = (tabName: string) => {
    switch (tabName) {
      case "dashboard":
        if (userRole === "SUPER_ADMIN") return <SuperAdminDashboard />;
        if (userRole === "ADMIN")
          return <Dashboard onTabChange={setActiveTab} />;
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

      case "attendance":
        if (userRole === "INSTRUCTOR") return <InstructorAttendanceTab />;
        return <div>אין הרשאה</div>;

      case "payments":
        if (userRole === "ADMIN") return <Payments />;
        return <div>אין הרשאה</div>;

      case "administration":
        if (userRole === "SUPER_ADMIN") return <PlatformAdministration />;
        if (userRole === "ADMIN") return <Administration />;
        return <div>אין הרשאה</div>;

      case "browse":
        if (userRole === "STUDENT") return <BrowseCourses />;
        return <div>אין הרשאה</div>;

      default:
        return <div>המודול בבנייה</div>;
    }
  };

  // useMemo MUST be called before any early returns to satisfy Rules of Hooks
  const tabContent = useMemo(
    () => getComponentForTab(activeTab),
    [activeTab, userRole]
  );

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );

  // Render Suspense fallback for Auth/Reset pages
  if (isResetPassword) {
    return (
      <Suspense fallback={<Loader2 />}>
        <ResetPassword
          onSuccess={() => {
            handleAuthSuccess();
            window.history.replaceState({}, document.title, "/");
          }}
        />
      </Suspense>
    );
  }

  // If not authenticated, use URL to determine the view
  if (!isAuthenticated) {
    // Show AuthPage when at /auth or when an invite token triggered the flow
    const showAuthPage = location.pathname === "/auth" || showLogin;
    return (
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
          </div>
        }
      >
        {showAuthPage ? (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        ) : (
          <LandingPage onLoginClick={() => navigate("/auth")} />
        )}
      </Suspense>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-slate-50 font-sans transition-colors duration-200 dark:bg-slate-950 overflow-x-hidden"
      dir="rtl"
    >
      {/* Desktop Sidebar - hidden on small screens */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userRole={userRole}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userRole={userRole}
      />

      <main className="flex-1 md:mr-64 p-4 sm:p-8 pb-24 md:pb-8 min-w-0 overflow-x-hidden">
        <header className="flex justify-end items-center mb-8">
          {/* User header */}
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {currentUser?.full_name || "משתמש"}
              </p>
              <p className="text-xs text-slate-500 uppercase dark:text-slate-400">
                {userRole === "SUPER_ADMIN"
                  ? "מנהל פלטפורמה"
                  : userRole === "ADMIN"
                    ? "מנהל מערכת"
                    : userRole === "INSTRUCTOR"
                      ? "מדריך"
                      : "סטודנט"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-slate-800">
              {currentUser?.email?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto animate-fadeIn">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
              </div>
            }
          >
            {tabContent}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
