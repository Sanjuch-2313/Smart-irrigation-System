const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema(
  {
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    soilMoisture: {
      type: Number,
      min: 0,
      max: 100,
    },
    temperature: {
      type: Number,
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100,
    },
    rainfall: {
      type: Number,
      min: 0,
    },
    lightIntensity: {
      type: Number,
      min: 0,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sensorDataSchema.index({ zone: 1, recordedAt: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
