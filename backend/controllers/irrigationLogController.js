const IrrigationLog = require('../models/IrrigationLog');

// GET /api/logs
const getLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.zone) filter.zone = req.query.zone;
    if (req.query.status) filter.status = req.query.status;

    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const logs = await IrrigationLog.find(filter)
      .populate('zone', 'name')
      .populate('schedule', 'name')
      .sort({ startedAt: -1 })
      .limit(limit);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/logs  — start irrigation
const startIrrigation = async (req, res) => {
  try {
    const log = await IrrigationLog.create({ ...req.body, startedAt: new Date(), status: 'running' });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/logs/:id/stop  — stop irrigation
const stopIrrigation = async (req, res) => {
  try {
    const log = await IrrigationLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    const endedAt = new Date();
    const duration = Math.round((endedAt - log.startedAt) / 1000 / 60);

    log.endedAt = endedAt;
    log.duration = duration;
    log.status = 'completed';
    if (req.body.waterUsed) log.waterUsed = req.body.waterUsed;
    if (req.body.notes) log.notes = req.body.notes;
    await log.save();

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/logs/:id/cancel
const cancelIrrigation = async (req, res) => {
  try {
    const log = await IrrigationLog.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', endedAt: new Date() },
      { new: true }
    );
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/logs/:id
const deleteLog = async (req, res) => {
  try {
    const log = await IrrigationLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLogs, startIrrigation, stopIrrigation, cancelIrrigation, deleteLog };
