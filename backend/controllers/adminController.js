const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');

// @desc    Get Admin Dashboard Stats & Charts Data
// @route   GET /api/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalCourses = await Course.countDocuments();
    
    // Today's attendance count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const attendanceToday = await Attendance.countDocuments({
      timestamp: { $gte: startOfToday },
    });

    // Monthly attendance chart data (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAttendance = Array(6).fill(0).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: monthNames[d.getMonth()],
        attendanceCount: 0,
      };
    });

    const allAttendances = await Attendance.find();
    allAttendances.forEach((att) => {
      const mIdx = new Date(att.timestamp).getMonth();
      const currMonth = new Date().getMonth();
      const diff = currMonth - mIdx;
      if (diff >= 0 && diff < 6) {
        monthlyAttendance[5 - diff].attendanceCount += 1;
      }
    });

    // Department-wise student distribution
    const departments = await Department.find();
    const deptDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({ role: 'student', departmentName: dept.name });
        return {
          department: dept.name,
          studentCount: count,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalCourses,
        attendanceToday,
      },
      charts: {
        monthlyAttendance,
        deptDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new Teacher or Student
// @route   POST /api/admin/user
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, departmentName, semester, section, rollNumber, employeeId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let dept = await Department.findOne({ name: departmentName });

    const user = await User.create({
      name,
      email,
      password: password || 'password123',
      role: role || 'student',
      department: dept ? dept._id : null,
      departmentName: departmentName || 'Computer Science',
      semester: Number(semester) || 1,
      section: section || 'A',
      rollNumber: rollNumber || (role === 'student' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      employeeId: employeeId || (role === 'teacher' ? `EMP-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    });

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with role filter & pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count,
      page: Number(page),
      pages: Math.ceil(count / limit),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/user/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Department
// @route   POST /api/admin/department
// @access  Private (Admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, HOD } = req.body;

    const deptExists = await Department.findOne({ $or: [{ name }, { code }] });
    if (deptExists) {
      return res.status(400).json({ success: false, message: 'Department name or code already exists' });
    }

    const dept = await Department.create({ name, code, HOD });
    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Departments
// @route   GET /api/admin/departments
// @access  Private (Admin)
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().populate('HOD', 'name email');
    res.json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Course & Assign Teacher
// @route   POST /api/admin/course
// @access  Private (Admin)
const createCourse = async (req, res, next) => {
  try {
    const { name, code, departmentName, teacherId, semester, section, credits } = req.body;

    const courseExists = await Course.findOne({ code });
    if (courseExists) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await Course.create({
      name,
      code,
      departmentName: departmentName || 'Computer Science',
      teacher: teacherId || null,
      semester: Number(semester) || 1,
      section: section || 'A',
      credits: Number(credits) || 3,
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Courses
// @route   GET /api/admin/courses
// @access  Private (Admin)
const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email employeeId');
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  createUser,
  getUsers,
  deleteUser,
  createDepartment,
  getDepartments,
  createCourse,
  getCourses,
};
