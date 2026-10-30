import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Course } from '../../types';
import API from '../../services/api';
import { Play, BookOpen, Clock, RefreshCw } from 'lucide-react';

interface StartLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted: (lecture: any) => void;
}

export const StartLectureModal: React.FC<StartLectureModalProps> = ({
  isOpen,
  onClose,
  onStarted,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [semester, setSemester] = useState<number>(4);
  const [section, setSection] = useState<string>('A');
  const [duration, setDuration] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/teacher/courses');
      if (res.data.success && res.data.courses) {
        setCourses(res.data.courses);
        if (res.data.courses.length > 0) {
          setSelectedCourse(res.data.courses[0]._id);
          setSemester(res.data.courses[0].semester || 4);
          setSection(res.data.courses[0].section || 'A');
        }
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const found = courses.find((c) => c._id === courseId);
    if (found) {
      setSemester(found.semester || 4);
      setSection(found.section || 'A');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
      const res = await API.post('/lecture/start', {
        courseId: selectedCourse,
        semester,
        section,
        durationSeconds: duration,
      });

      if (res.data.success && res.data.lecture) {
        onStarted(res.data.lecture);
        onClose();
      }
    } catch (err) {
      console.error('Failed to start lecture:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Lecture Session" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Select Assigned Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
          >
            {courses.length === 0 ? (
              <option value="">No courses assigned yet</option>
            ) : (
              courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name} (Sec {course.section || 'A'})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Semester
            </label>
            <input
              type="number"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              min={1}
              max={8}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Section
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> QR Code Refresh Interval
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
          >
            <option value={15}>15 Seconds (High Security)</option>
            <option value={30}>30 Seconds (Recommended)</option>
            <option value={60}>60 Seconds (Standard)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedCourse}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Launching Session...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Launch Dynamic QR Session</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
