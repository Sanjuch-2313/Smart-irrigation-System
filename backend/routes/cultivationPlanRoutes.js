const express = require("express");
const router = express.Router();
const cultivationPlanController = require("../controllers/cultivationPlanController");

router.post("/", cultivationPlanController.createPlan);
router.get("/user/:userId/latest", cultivationPlanController.getLatestPlanByUser);

module.exports = router;
