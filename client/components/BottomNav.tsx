import React, { useEffect } from "react";
import {
  getCurrentTheme,
  toggleTheme as toggleThemeMode,
  type ThemeMode,
} from "../utils/theme";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  LogOut,
  Search,
  Sun,
  Moon,
} from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userRole: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  userRole,
}) => {
  const [theme, setTheme] = React.useState<ThemeMode>(() => getCurrentTheme());
  const isDarkMode = theme === "dark";

  useEffect(() => {
    const syncTheme = () => setTheme(getCurrentTheme());
    window.addEventListener("classly-theme-change", syncTheme as EventListener);
    return () =>
      window.removeEventListener(
        "classly-theme-change",
        syncTheme as EventListener
      );
  }, []);

  const toggleTheme = () => {
    setTheme(toggleThemeMode());
  };

  const allMenuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "ראשי",
      roles: ["ADMIN", "INSTRUCTOR", "STUDENT", "SUPER_ADMIN"],
    },
    { id: "browse", icon: Search, label: "קורסים", roles: ["STUDENT"] },
    {
      id: "schedule",
      icon: Calendar,
      label: "מערכת",
      roles: ["ADMIN", "INSTRUCTOR"],
    },
    {
      id: "students",
      icon: Users,
      label: "תלמידים",
      roles: ["ADMIN", "INSTRUCTOR"],
    },
    { id: "payments", icon: CreditCard, label: "תשלומים", roles: ["ADMIN"] },
    {
      id: "administration",
      icon: Users,
      label: "ניהול",
      roles: ["ADMIN", "SUPER_ADMIN"],
    },
  ];

  const menuItems = allMenuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-around px-1 py-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200 min-w-0 relative ${
              activeTab === item.id
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <item.icon
              size={20}
              strokeWidth={activeTab === item.id ? 2.5 : 1.8}
            />
            <span
              className={`text-[10px] mt-0.5 truncate max-w-full ${
                activeTab === item.id ? "font-semibold" : "font-medium"
              }`}
            >
              {item.label}
            </span>
            {activeTab === item.id && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg text-slate-400 hover:text-indigo-500 transition-all duration-200 min-w-0 dark:text-slate-500 dark:hover:text-indigo-400"
        >
          {isDarkMode ? (
            <Sun size={20} strokeWidth={1.8} />
          ) : (
            <Moon size={20} strokeWidth={1.8} />
          )}
          <span className="text-[10px] mt-0.5 font-medium">
            {isDarkMode ? "בהיר" : "כהה"}
          </span>
        </button>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg text-slate-400 hover:text-red-500 transition-all duration-200 min-w-0 dark:text-slate-500 dark:hover:text-red-400"
        >
          <LogOut size={20} strokeWidth={1.8} />
          <span className="text-[10px] mt-0.5 font-medium">יציאה</span>
        </button>
      </div>
    </nav>
  );
};
