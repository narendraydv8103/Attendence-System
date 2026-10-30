import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Toast, ToastProps } from '../components/common/Toast';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { StudentHistory } from '../components/student/StudentHistory';
import { QRScannerModal } from '../components/student/QRScannerModal';
import { TeacherDashboard } from '../components/teacher/TeacherDashboard';
import { LectureHistory } from '../components/teacher/LectureHistory';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { UserManagement } from '../components/admin/UserManagement';
import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { CourseManagement } from '../components/admin/CourseManagement';
import { ProfileEditor } from '../components/common/ProfileEditor';
import { StartLectureModal } from '../components/teacher/StartLectureModal';
import { ProjectorModal } from '../components/teacher/ProjectorModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isStartLectureModalOpen, setIsStartLectureModalOpen] = useState<boolean>(false);
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [isProjectorOpen, setIsProjectorOpen] = useState<boolean>(false);

  if (!user) return null;

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const renderContent = () => {
    if (activeTab === 'profile') {
      return <ProfileEditor />;
    }

    if (user.role === 'student') {
      switch (activeTab) {
        case 'dashboard':
        case 'courses':
          return <StudentDashboard onOpenScanModal={() => setIsScanModalOpen(true)} />;
        case 'history':
          return <StudentHistory />;
        default:
          return <StudentDashboard onOpenScanModal={() => setIsScanModalOpen(true)} />;
      }
    }

    if (user.role === 'teacher') {
      switch (activeTab) {
        case 'dashboard':
        case 'courses':
          return <TeacherDashboard />;
        case 'history':
        case 'reports':
          return <LectureHistory />;
        default:
          return <TeacherDashboard />;
      }
    }

    if (user.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'users':
          return <UserManagement />;
        case 'departments':
          return <DepartmentManagement />;
        case 'courses':
          return <CourseManagement />;
        case 'reports':
          return <LectureHistory />;
        default:
          return <AdminDashboard />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      <Navbar
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenStartLectureModal={() => setIsStartLectureModalOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar role={user.role} activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>

      {/* Student QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={(msg, isLow, pct) => {
          addToast('success', msg || 'Attendance marked successfully!');
          if (isLow) {
            addToast('error', `Low Attendance Alert: Course percentage is ${pct}%`);
          }
        }}
        onError={(err) => addToast('error', err)}
      />

      {/* Teacher Start Lecture Modal */}
      <StartLectureModal
        isOpen={isStartLectureModalOpen}
        onClose={() => setIsStartLectureModalOpen(false)}
        onStarted={(lecture) => {
          setActiveLecture(lecture);
          setIsProjectorOpen(true);
          addToast('success', 'Dynamic QR Lecture Session Started!');
        }}
      />

      {/* Teacher Projector Modal */}
      <ProjectorModal
        isOpen={isProjectorOpen}
        onClose={() => setIsProjectorOpen(false)}
        lecture={activeLecture}
        attendances={[]}
        onEndLecture={() => {
          setActiveLecture(null);
          setIsProjectorOpen(false);
          addToast('info', 'Lecture session ended.');
        }}
        onRefreshQR={() => addToast('info', 'QR code refreshed manually.')}
      />
    </div>
  );
};
