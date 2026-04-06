const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Biometric authentication (phone + face)
router.get("/exists/:phone", authController.checkPhoneExists);
router.post("/register", authController.register);
router.post("/login", authController.login);

// Legacy email/password authentication (backward compatibility)
router.post("/register-email", authController.registerEmail);
router.post("/login-email", authController.loginEmail);

module.exports = router;