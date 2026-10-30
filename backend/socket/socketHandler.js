let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join a lecture room for live teacher dashboard sync
    socket.on('join_lecture_room', (lectureId) => {
      socket.join(lectureId);
      console.log(`Socket ${socket.id} joined lecture room: ${lectureId}`);
    });

    // Leave lecture room
    socket.on('leave_lecture_room', (lectureId) => {
      socket.leave(lectureId);
      console.log(`Socket ${socket.id} left lecture room: ${lectureId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};

// Emit live attendance to room
const emitAttendanceUpdate = (lectureId, attendanceData) => {
  if (ioInstance) {
    ioInstance.to(lectureId).emit('attendance_marked', attendanceData);
  }
};

// Emit dynamic QR refresh to room
const emitQRUpdate = (lectureId, qrData) => {
  if (ioInstance) {
    ioInstance.to(lectureId).emit('qr_refreshed', qrData);
  }
};

// Emit lecture end event
const emitLectureEnded = (lectureId) => {
  if (ioInstance) {
    ioInstance.to(lectureId).emit('lecture_ended', { lectureId });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitAttendanceUpdate,
  emitQRUpdate,
  emitLectureEnded,
};
