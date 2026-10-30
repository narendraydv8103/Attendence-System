const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');
const { protect, authorize } = require('./middlewares/authMiddleware');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { generateExcelReport, generatePDFReport } = require('./utils/exportHelpers');

// Import Controllers
const authController = require('./controllers/authController');
const teacherController = require('./controllers/teacherController');
const studentController = require('./controllers/studentController');
const adminController = require('./controllers/adminController');

// Import Models for Seeding
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const Lecture = require('./models/Lecture');
const Attendance = require('./models/Attendance');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS & JSON parsing
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
initSocket(io);

// Connect to Database & Seed Sample Data if empty
connectDB().then(async () => {
  await seedInitialData();
});

// Seed Initial Demo Data
async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial demo data...');

      // 1. Department
      const dept = await Department.create({
        name: 'Computer Science & Engineering',
        code: 'CSE',
      });

      // 2. Admin User
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@college.edu',
        password: 'password123',
        role: 'admin',
        department: dept._id,
        departmentName: dept.name,
      });

      // 3. Teacher User
      const teacher = await User.create({
        name: 'Dr. Sarah Jenkins',
        email: 'teacher@college.edu',
        password: 'password123',
        role: 'teacher',
        department: dept._id,
        departmentName: dept.name,
        employeeId: 'EMP-1001',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      });

      dept.HOD = teacher._id;
      await dept.save();

      // 4. Students
      const student1 = await User.create({
        name: 'Alex Rivera',
        email: 'student@college.edu',
        password: 'password123',
        role: 'student',
        department: dept._id,
        departmentName: dept.name,
        semester: 4,
        section: 'A',
        rollNumber: 'CS-2024-001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });

      const student2 = await User.create({
        name: 'Maya Patel',
        email: 'maya@college.edu',
        password: 'password123',
        role: 'student',
        department: dept._id,
        departmentName: dept.name,
        semester: 4,
        section: 'A',
        rollNumber: 'CS-2024-002',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      });

      const student3 = await User.create({
        name: 'David Kim',
        email: 'david@college.edu',
        password: 'password123',
        role: 'student',
        department: dept._id,
        departmentName: dept.name,
        semester: 4,
        section: 'A',
        rollNumber: 'CS-2024-003',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });

      // 5. Courses
      const course1 = await Course.create({
        name: 'Advanced Web Development',
        code: 'CS401',
        departmentName: dept.name,
        teacher: teacher._id,
        semester: 4,
        section: 'A',
        credits: 4,
      });

      const course2 = await Course.create({
        name: 'Database Management Systems',
        code: 'CS402',
        departmentName: dept.name,
        teacher: teacher._id,
        semester: 4,
        section: 'A',
        credits: 4,
      });

      // 6. Sample Past Lecture & Attendance Records
      const pastLecture = await Lecture.create({
        course: course1._id,
        teacher: teacher._id,
        qrToken: 'demo_token_123',
        startTime: new Date(Date.now() - 86400000), // Yesterday
        expiryTime: new Date(Date.now() - 86400000 + 1800000),
        durationSeconds: 30,
        semester: 4,
        section: 'A',
        status: 'ended',
      });

      await Attendance.create({
        lectureId: pastLecture._id,
        studentId: student1._id,
        courseId: course1._id,
        timestamp: new Date(Date.now() - 86400000),
        status: 'present',
        verifiedByQR: true,
      });

      await Attendance.create({
        lectureId: pastLecture._id,
        studentId: student2._id,
        courseId: course1._id,
        timestamp: new Date(Date.now() - 86400000 + 10000),
        status: 'present',
        verifiedByQR: true,
      });

      console.log('Seed data successfully populated!');
      console.log('--- DEMO CREDENTIALS ---');
      console.log('Admin:    admin@college.edu   / password123');
      console.log('Teacher:  teacher@college.edu / password123');
      console.log('Student:  student@college.edu / password123');
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

// Routes Definition

// Auth Routes
app.post('/api/auth/register', authController.registerUser);
app.post('/api/auth/login', authController.loginUser);
app.post('/api/auth/refresh', authController.refreshToken);
app.get('/api/auth/me', protect, authController.getMe);
app.put('/api/auth/profile', protect, authController.updateProfile);

// Teacher & Lecture Routes
app.post('/api/lecture/start', protect, authorize('teacher', 'admin'), teacherController.startLecture);
app.post('/api/qr/generate', protect, authorize('teacher', 'admin'), teacherController.refreshQR);
app.post('/api/lecture/end', protect, authorize('teacher', 'admin'), teacherController.endLecture);
app.get('/api/lecture/active', protect, authorize('teacher', 'admin'), teacherController.getActiveLecture);
app.get('/api/lecture/history', protect, authorize('teacher', 'admin'), teacherController.getLectureHistory);
app.get('/api/teacher/courses', protect, authorize('teacher', 'admin'), teacherController.getTeacherCourses);

// Student & Attendance Routes
app.post('/api/attendance/scan', protect, authorize('student'), studentController.scanQR);
app.get('/api/student/courses', protect, authorize('student'), studentController.getStudentCourses);
app.get('/api/attendance/history', protect, studentController.getStudentAttendanceHistory);
app.get('/api/student/stats', protect, authorize('student'), studentController.getStudentStats);

// Admin Routes
app.get('/api/dashboard', protect, authorize('admin'), adminController.getAdminDashboard);
app.post('/api/admin/user', protect, authorize('admin'), adminController.createUser);
app.get('/api/admin/users', protect, authorize('admin'), adminController.getUsers);
app.delete('/api/admin/user/:id', protect, authorize('admin'), adminController.deleteUser);
app.post('/api/admin/department', protect, authorize('admin'), adminController.createDepartment);
app.get('/api/admin/departments', protect, authorize('admin'), adminController.getDepartments);
app.post('/api/admin/course', protect, authorize('admin'), adminController.createCourse);
app.get('/api/admin/courses', protect, authorize('admin'), adminController.getCourses);

// Export Reports Routes
app.get('/api/reports/excel', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { lectureId, courseId } = req.query;
    const filter = {};
    if (lectureId) filter.lectureId = lectureId;
    if (courseId) filter.courseId = courseId;

    const records = await Attendance.find(filter)
      .populate('studentId', 'name rollNumber departmentName')
      .populate('courseId', 'name code');

    const buffer = await generateExcelReport(records, 'Attendance_Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.xlsx');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

app.get('/api/reports/pdf', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { lectureId, courseId } = req.query;
    const filter = {};
    if (lectureId) filter.lectureId = lectureId;
    if (courseId) filter.courseId = courseId;

    const records = await Attendance.find(filter)
      .populate('studentId', 'name rollNumber departmentName')
      .populate('courseId', 'name code');

    generatePDFReport(records, res, 'Attendance_Report');
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Attendance Backend API is running perfectly! 🚀' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
