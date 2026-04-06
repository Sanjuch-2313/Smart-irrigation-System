const express = require("express");
const axios = require("axios");

const router = express.Router();
let otpStore = {};

router.post("/send-otp", async (req, res) => {
  const { mobile } = req.body;

  const otp = Math.floor(1000 + Math.random() * 9000);
  otpStore[mobile] = otp;

  try {
    await axios.get(`https://api.authkey.io/request?authkey=YOUR_API_KEY&mobile=91${mobile}&country_code=91&sid=YOUR_SENDER_ID&otp=${otp}`);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json("OTP failed");
  }
});

router.post("/verify-otp", (req, res) => {
  const { mobile, otp } = req.body;

  if (otpStore[mobile] == otp) {
    delete otpStore[mobile];
    return res.json({ success: true });
  }

  return res.status(400).json("Invalid OTP");
});

module.exports = router;
