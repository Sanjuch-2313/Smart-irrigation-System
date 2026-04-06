const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const otpRoutesModule = require("./routes/otpRoutes");

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const otpRoutes = otpRoutesModule?.default || otpRoutesModule?.router || otpRoutesModule;
if (typeof otpRoutes !== "function") {
  console.error("Invalid otpRoutes export. Expected Express router function.");
  process.exit(1);
}
app.use("/api", otpRoutes);

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in backend/.env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const authRoutesModule = require("./routes/authRoutes");
const authRoutes = authRoutesModule?.default || authRoutesModule?.router || authRoutesModule;
if (typeof authRoutes !== "function") {
  console.error("Invalid authRoutes export. Expected Express router function.");
  process.exit(1);
}
app.use("/api/auth", authRoutes);

const cultivationPlanRoutesModule = require("./routes/cultivationPlanRoutes");
const cultivationPlanRoutes =
  cultivationPlanRoutesModule?.default || cultivationPlanRoutesModule?.router || cultivationPlanRoutesModule;
if (typeof cultivationPlanRoutes !== "function") {
  console.error("Invalid cultivationPlanRoutes export. Expected Express router function.");
  process.exit(1);
}
app.use("/api/cultivation-plans", cultivationPlanRoutes);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});