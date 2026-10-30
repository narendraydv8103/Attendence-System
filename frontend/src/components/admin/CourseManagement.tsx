import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Course, User } from '../../types';
import { BookOpen, Plus, UserCheck } from 'lucide-react';
import { Modal } from '../common/Modal';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentName, setDepartmentName] = useState('Computer Science & Engineering');
  const [teacherId, setTeacherId] = useState('');
  const [semester, setSemester] = useState(4);
  const [section, setSection] = useState('A');
  const [credits, setCredits] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        API.get('/admin/courses'),
        API.get('/admin/users?role=teacher'),
      ]);

      if (cRes.data.success) setCourses(cRes.data.courses);
      if (tRes.data.success) {
        setTeachers(tRes.data.users);
        if (tRes.data.users.length > 0) setTeacherId(tRes.data.users[0]._id);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await API.post('/admin/course', {
        name,
        code,
        departmentName,
        teacherId,
        semester,
        section,
        credits,
      });

      if (res.data.success) {
        setIsAddModalOpen(false);
        setName('');
        setCode('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create course:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Curriculum Courses
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Manage academic subjects, assign faculty teachers, and set credit weights.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No courses created yet.</div>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs border border-indigo-500/20">
                  {course.code}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Sem {course.semester || 1} • Sec {course.section || 'A'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{course.name}</h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Faculty: {course.teacher?.name || 'Unassigned'}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{course.departmentName || 'Computer Science'}</span>
                <span className="font-bold text-indigo-400">{course.credits || 3} Credits</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Course" maxWidth="md">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CS201"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Faculty Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              {teachers.length === 0 ? (
                <option value="">No teachers available</option>
              ) : (
                teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.employeeId || t.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Semester
              </label>
              <input
                type="number"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                min={1}
                max={8}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Section
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Credits
              </label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                min={1}
                max={6}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
          >
            {isSubmitting ? 'Saving Course...' : 'Create & Assign Course'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
