const mongoose = require('mongoose');

const irrigationLogSchema = new mongoose.Schema(
  {
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    waterUsed: {
      type: Number,
    },
    triggeredBy: {
      type: String,
      enum: ['manual', 'schedule', 'auto'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'cancelled'],
      default: 'running',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

irrigationLogSchema.index({ zone: 1, startedAt: -1 });

module.exports = mongoose.model('IrrigationLog', irrigationLogSchema);
