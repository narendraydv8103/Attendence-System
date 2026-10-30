export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  departmentName?: string;
  semester?: number;
  section?: string;
  rollNumber?: string;
  employeeId?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  HOD?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  departmentName?: string;
  teacher?: User;
  semester?: number;
  section?: string;
  credits?: number;
  totalLectures?: number;
  attendedLectures?: number;
  percentage?: number;
}

export interface Lecture {
  _id: string;
  course: Course;
  teacher: User | string;
  qrToken: string;
  startTime: string;
  expiryTime: string;
  durationSeconds: number;
  semester: number;
  section: string;
  status: 'active' | 'ended';
  qrImageData?: string;
  totalPresent?: number;
}

export interface Attendance {
  _id: string;
  lectureId: Lecture;
  studentId: User;
  courseId: Course;
  timestamp: string;
  status: 'present' | 'absent';
  verifiedByQR: boolean;
}

export interface StudentStats {
  totalCourses: number;
  totalLectures: number;
  totalAttended: number;
  overallPercentage: number;
  monthlyStats: {
    month: string;
    attended: number;
    total: number;
  }[];
}

export interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    attendanceToday: number;
  };
  charts: {
    monthlyAttendance: { month: string; attendanceCount: number }[];
    deptDistribution: { department: string; studentCount: number }[];
  };
}
