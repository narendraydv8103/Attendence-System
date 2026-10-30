const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qrToken: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiryTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'expired'],
      default: 'active',
    },
    semester: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      default: 'A',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lecture', lectureSchema);
