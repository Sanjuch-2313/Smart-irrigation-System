const CultivationPlan = require("../models/CultivationPlan");

exports.createPlan = async (req, res) => {
  try {
    const { userId, crop, soilType, month } = req.body;

    if (!userId || !crop || !soilType || !month) {
      return res.status(400).json({ message: "userId, crop, soilType, and month are required" });
    }

    const plan = await CultivationPlan.create({
      userId,
      crop: String(crop).trim(),
      soilType: String(soilType).trim(),
      month: String(month).trim(),
      sensorConnected: true,
    });

    return res.status(201).json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLatestPlanByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const plan = await CultivationPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!plan) {
      return res.status(404).json({ success: false, message: "No cultivation plan found" });
    }

    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
