const Attendance = require('../models/Attendance');
const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const User = require('../models/User');
const { emitAttendanceUpdate } = require('../socket/socketHandler');
const { sendLowAttendanceWarning } = require('../utils/emailService');

// @desc    Scan QR Code & Mark Attendance
// @route   POST /api/attendance/scan
// @access  Private (Student)
const scanQR = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR data string is required' });
    }

    let parsedQR;
    try {
      parsedQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid QR Code format' });
    }

    const { lectureId, token, expiresAt } = parsedQR;

    if (!lectureId || !token) {
      return res.status(400).json({ success: false, message: 'Malformed QR Code payload' });
    }

    // 1. Verify Lecture Existence and Active Status
    const lecture = await Lecture.findById(lectureId).populate('course', 'name code semester section');
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture session not found' });
    }

    if (lecture.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This lecture session is no longer active' });
    }

    // 2. Validate Token Match
    if (lecture.qrToken !== token) {
      return res.status(400).json({ success: false, message: 'Expired or invalid QR code. Please scan the newly generated QR code on screen.' });
    }

    // 3. Validate Expiry Time
    const now = new Date();
    const expiry = new Date(lecture.expiryTime);
    if (now > expiry) {
      return res.status(400).json({ success: false, message: 'QR code has expired. Please wait for the teacher to refresh the QR.' });
    }

    // 4. Validate Student Section & Semester match course
    const student = await User.findById(req.user._id);
    if (student.section !== lecture.section || student.semester !== lecture.semester) {
      return res.status(403).json({
        success: false,
        message: `Course section (${lecture.section}) / semester (${lecture.semester}) does not match your section (${student.section}) / semester (${student.semester})`,
      });
    }

    // 5. Prevent Duplicate Attendance
    const existingAttendance = await Attendance.findOne({
      lectureId: lecture._id,
      studentId: student._id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Your attendance for this lecture has already been marked!',
        alreadyMarked: true,
      });
    }

    // 6. Record Attendance
    const attendance = await Attendance.create({
      lectureId: lecture._id,
      studentId: student._id,
      courseId: lecture.course._id,
      timestamp: new Date(),
      status: 'present',
      verifiedByQR: true,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'name rollNumber email avatar section departmentName')
      .populate('courseId', 'name code');

    // 7. Emit Live Socket.IO event to Teacher Dashboard
    emitAttendanceUpdate(lecture._id.toString(), populatedAttendance);

    // 8. Calculate student percentage in this course & check for low attendance warning
    const totalCourseLectures = await Lecture.countDocuments({ course: lecture.course._id, status: { $ne: 'active' } }) + 1;
    const studentCourseAttended = await Attendance.countDocuments({ studentId: student._id, courseId: lecture.course._id });
    const attendancePercentage = Math.round((studentCourseAttended / totalCourseLectures) * 100);

    if (attendancePercentage < 75) {
      // Async trigger low attendance alert email
      sendLowAttendanceWarning(student.email, student.name, lecture.course.name, attendancePercentage);
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully! 🎉',
      attendance: populatedAttendance,
      coursePercentage: attendancePercentage,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this lecture.' });
    }
    next(error);
  }
};

// @desc    Get Student Enrolled Courses
// @route   GET /api/student/courses
// @access  Private (Student)
const getStudentCourses = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id);

    // Find courses matching student's section and semester
    const courses = await Course.find({
      semester: student.semester,
      section: student.section,
    }).populate('teacher', 'name email avatar');

    // Calculate attendance percentage for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const totalLectures = await Lecture.countDocuments({ course: course._id });
        const attendedLectures = await Attendance.countDocuments({
          studentId: student._id,
          courseId: course._id,
        });

        const percentage = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 100;

        return {
          ...course.toObject(),
          totalLectures,
          attendedLectures,
          percentage,
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Attendance History
// @route   GET /api/attendance/history
// @access  Private (Student)
const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const attendances = await Attendance.find({ studentId: req.user._id })
      .populate('courseId', 'name code credits')
      .populate('lectureId', 'startTime teacher')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: attendances.length,
      attendances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Stats & Graph Data
// @route   GET /api/student/stats
// @access  Private (Student)
const getStudentStats = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId);

    const courses = await Course.find({ semester: student.semester, section: student.section });
    const courseIds = courses.map((c) => c._id);

    const totalLectures = await Lecture.countDocuments({ course: { $in: courseIds } });
    const totalAttended = await Attendance.countDocuments({ studentId });

    const overallPercentage = totalLectures > 0 ? Math.round((totalAttended / totalLectures) * 100) : 100;

    // Monthly attendance distribution
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: monthNames[date.getMonth()],
        attended: 0,
        total: 0,
      };
    });

    const attendances = await Attendance.find({ studentId });
    attendances.forEach((att) => {
      const monthIdx = new Date(att.timestamp).getMonth();
      const currentMonth = new Date().getMonth();
      const diff = currentMonth - monthIdx;
      if (diff >= 0 && diff < 6) {
        monthlyStats[5 - diff].attended += 1;
      }
    });

    res.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalLectures,
        totalAttended,
        overallPercentage,
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanQR,
  getStudentCourses,
  getStudentAttendanceHistory,
  getStudentStats,
};
