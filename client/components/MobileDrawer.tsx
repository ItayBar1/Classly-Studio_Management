import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Search,
  X
} from 'lucide-react';

interface MobileDrawerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ activeTab, setActiveTab, onLogout, userRole, isOpen, onClose }) => {
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
      roles: ['STUDENT']
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
      roles: ['ADMIN']
    },
    {
      id: 'administration',
      label: 'ניהול',
      icon: Users,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'settings',
      label: 'הגדרות',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={onClose}></div>
      )}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 text-white flex flex-col shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-indigo-500">❖</span> Classly
          </h1>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
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
              onLogout?.();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span>יציאה</span>
          </button>
        </div>
      </div>
    </>
  );
};
