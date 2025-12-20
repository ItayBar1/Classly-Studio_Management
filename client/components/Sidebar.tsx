import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Search // New icon for browsing courses
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userRole: string; // Added prop for role awareness
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, userRole }) => {
  useEffect(() => {
    console.info('Sidebar mounted', { userRole });
    return () => console.info('Sidebar unmounted');
  }, [userRole]);

  // Define menu items alongside authorization rules
  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'לוח בקרה',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
    },
    {
      id: 'browse',
      label: 'הרשמה לקורסים',
      icon: Search,
      roles: ['STUDENT'] // Students only
    },
    {
      id: 'schedule',
      label: 'מערכת שעות',
      icon: Calendar,
      roles: ['ADMIN', 'INSTRUCTOR']
    },
    {
      id: 'students',
      label: 'תלמידים',
      icon: Users,
      roles: ['ADMIN', 'INSTRUCTOR']
    },
    {
      id: 'payments',
      label: 'תשלומים',
      icon: CreditCard,
      roles: ['ADMIN'] // Admin only for now (students pay inside registration/dashboard)
    },
    {
      id: 'administration',
      label: 'ניהול',
      icon: Users, // Changed icon to distinguish
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'settings',
      label: 'הגדרות',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  // Filter menu items according to the current role
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed right-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-indigo-500">❖</span> Classly
        </h1>
        <p className="text-xs text-slate-400 mt-1">ניהול סטודיו {userRole === 'STUDENT' ? 'אישי' : 'מתקדם'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              console.info('Sidebar navigation clicked', { tab: item.id });
              setActiveTab(item.id);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            console.info('Sidebar logout clicked');
            onLogout?.();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span>יציאה</span>
        </button>
      </div>
    </div>
  );
};
