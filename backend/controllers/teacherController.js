const crypto = require('crypto');
const QRCode = require('qrcode');
const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const { emitQRUpdate, emitLectureEnded } = require('../socket/socketHandler');

// Helper to generate QR data string & Base64 QR Image
const generateQRDataAndImage = async (lectureId, token, expiresAt) => {
  const qrPayload = JSON.stringify({
    lectureId: lectureId.toString(),
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  });

  const qrImageData = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#1E1B4B',
      light: '#FFFFFF',
    },
  });

  return { qrPayload, qrImageData };
};

// @desc    Start a new lecture session and generate dynamic QR Code
// @route   POST /api/lecture/start
// @access  Private (Teacher)
const startLecture = async (req, res, next) => {
  try {
    const { courseId, semester, section, durationSeconds = 30 } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // End any existing active lecture by this teacher
    await Lecture.updateMany(
      { teacher: req.user._id, status: 'active' },
      { status: 'ended' }
    );

    const token = crypto.randomBytes(16).toString('hex');
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + durationSeconds * 1000);

    const lecture = await Lecture.create({
      course: courseId,
      teacher: req.user._id,
      qrToken: token,
      startTime,
      expiryTime,
      durationSeconds,
      semester: semester || course.semester || 1,
      section: section || course.section || 'A',
      status: 'active',
    });

    const { qrImageData } = await generateQRDataAndImage(lecture._id, token, expiryTime);

    res.status(201).json({
      success: true,
      message: 'Lecture started successfully',
      lecture: {
        _id: lecture._id,
        course: {
          _id: course._id,
          name: course.name,
          code: course.code,
        },
        semester: lecture.semester,
        section: lecture.section,
        qrToken: lecture.qrToken,
        startTime: lecture.startTime,
        expiryTime: lecture.expiryTime,
        durationSeconds: lecture.durationSeconds,
        status: lecture.status,
        qrImageData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate/Refresh dynamic QR Code (auto-refreshes every 30s)
// @route   POST /api/qr/generate
// @access  Private (Teacher)
const refreshQR = async (req, res, next) => {
  try {
    const { lectureId } = req.body;

    let lecture = await Lecture.findById(lectureId);
    if (!lecture || lecture.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Lecture is not active' });
    }

    const newToken = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    const expiryTime = new Date(now.getTime() + (lecture.durationSeconds || 30) * 1000);

    lecture.qrToken = newToken;
    lecture.expiryTime = expiryTime;
    await lecture.save();

    const { qrImageData } = await generateQRDataAndImage(lecture._id, newToken, expiryTime);

    const qrData = {
      lectureId: lecture._id,
      qrToken: newToken,
      expiryTime,
      qrImageData,
    };

    // Emit live QR update to Socket.IO clients watching this lecture
    emitQRUpdate(lecture._id.toString(), qrData);

    res.json({
      success: true,
      qrData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End active lecture session
// @route   POST /api/lecture/end
// @access  Private (Teacher)
const endLecture = async (req, res, next) => {
  try {
    const { lectureId } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    lecture.status = 'ended';
    await lecture.save();

    emitLectureEnded(lecture._id.toString());

    res.json({
      success: true,
      message: 'Lecture session ended successfully',
      lectureId: lecture._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently active lecture for teacher with live student attendance list
// @route   GET /api/lecture/active
// @access  Private (Teacher)
const getActiveLecture = async (req, res, next) => {
  try {
    const lecture = await Lecture.findOne({
      teacher: req.user._id,
      status: 'active',
    }).populate('course', 'name code semester section');

    if (!lecture) {
      return res.json({ success: true, active: false, lecture: null });
    }

    // Get attendance records so far
    const attendances = await Attendance.find({ lectureId: lecture._id })
      .populate('studentId', 'name rollNumber email avatar section departmentName')
      .sort({ timestamp: -1 });

    const { qrImageData } = await generateQRDataAndImage(lecture._id, lecture.qrToken, lecture.expiryTime);

    res.json({
      success: true,
      active: true,
      lecture: {
        ...lecture.toObject(),
        qrImageData,
      },
      attendances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get previous lecture history for teacher
// @route   GET /api/lecture/history
// @access  Private (Teacher)
const getLectureHistory = async (req, res, next) => {
  try {
    const lectures = await Lecture.find({ teacher: req.user._id })
      .populate('course', 'name code departmentName')
      .sort({ createdAt: -1 });

    // Attach total student attendance count to each lecture
    const lectureHistory = await Promise.all(
      lectures.map(async (lec) => {
        const count = await Attendance.countDocuments({ lectureId: lec._id });
        return {
          ...lec.toObject(),
          totalPresent: count,
        };
      })
    );

    res.json({
      success: true,
      count: lectureHistory.length,
      lectures: lectureHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses assigned to this teacher
// @route   GET /api/teacher/courses
// @access  Private (Teacher)
const getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startLecture,
  refreshQR,
  endLecture,
  getActiveLecture,
  getLectureHistory,
  getTeacherCourses,
};
