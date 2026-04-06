const SensorData = require('../models/SensorData');

// POST /api/sensors
const addSensorData = async (req, res) => {
  try {
    const data = await SensorData.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/sensors?zone=<id>&limit=50
const getSensorData = async (req, res) => {
  try {
    const filter = {};
    if (req.query.zone) filter.zone = req.query.zone;

    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const data = await SensorData.find(filter)
      .populate('zone', 'name')
      .sort({ recordedAt: -1 })
      .limit(limit);

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sensors/latest?zone=<id>
const getLatestSensorData = async (req, res) => {
  try {
    const filter = {};
    if (req.query.zone) filter.zone = req.query.zone;

    const data = await SensorData.findOne(filter)
      .populate('zone', 'name')
      .sort({ recordedAt: -1 });

    if (!data) return res.status(404).json({ success: false, message: 'No sensor data found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/sensors/:id
const deleteSensorData = async (req, res) => {
  try {
    const record = await SensorData.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Sensor record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addSensorData, getSensorData, getLatestSensorData, deleteSensorData };
