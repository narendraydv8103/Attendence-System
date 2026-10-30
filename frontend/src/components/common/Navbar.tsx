import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { QrCode, LogOut, User as UserIcon, Shield, GraduationCap, BookOpen } from 'lucide-react';

interface NavbarProps {
  onOpenScanModal?: () => void;
  onOpenStartLectureModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScanModal, onOpenStartLectureModal }) => {
  const { user, logout } = useAuth();

  const roleBadges = {
    admin: { label: 'Admin', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Shield },
    teacher: { label: 'Faculty', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: BookOpen },
    student: { label: 'Student', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: GraduationCap },
  };

  const currentBadge = user ? roleBadges[user.role] : roleBadges.student;
  const BadgeIcon = currentBadge.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
                SmartQR
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO v2.0
              </span>
            </div>
          </div>

          {/* Quick Action Button for Role */}
          <div className="flex items-center gap-4">
            {user?.role === 'student' && onOpenScanModal && (
              <button
                onClick={onOpenScanModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Attendance</span>
              </button>
            )}

            {user?.role === 'teacher' && onOpenStartLectureModal && (
              <button
                onClick={onOpenStartLectureModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Start Lecture QR</span>
              </button>
            )}

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-100 leading-none mb-1">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${currentBadge.color}`}>
                      <BadgeIcon className="w-2.5 h-2.5" />
                      {currentBadge.label}
                    </span>
                    {user.rollNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {user.rollNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
