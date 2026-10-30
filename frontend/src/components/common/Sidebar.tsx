import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  BookOpen,
  History,
  Users,
  Building2,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab }) => {
  const navItems = {
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'courses', label: 'My Courses', icon: BookOpen },
      { id: 'history', label: 'Attendance History', icon: History },
      { id: 'profile', label: 'My Profile', icon: User },
    ],
    teacher: [
      { id: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard },
      { id: 'courses', label: 'Assigned Courses', icon: BookOpen },
      { id: 'history', label: 'Lecture History', icon: History },
      { id: 'reports', label: 'Export Reports', icon: FileSpreadsheet },
      { id: 'profile', label: 'Profile', icon: User },
    ],
    admin: [
      { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
      { id: 'users', label: 'Manage Users', icon: Users },
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'courses', label: 'All Courses', icon: BookOpen },
      { id: 'reports', label: 'System Reports', icon: FileSpreadsheet },
      { id: 'profile', label: 'Profile Settings', icon: User },
    ],
  };

  const currentNav = navItems[role] || navItems.student;

  return (
    <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 shrink-0">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
