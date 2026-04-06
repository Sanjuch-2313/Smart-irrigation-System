const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, required: true },
  email: { type: String, unique: true, sparse: true }, // Optional for backward compatibility
  password: String, // Optional for backward compatibility
  faceEmbedding: [Number], // 128-dimensional embedding array
  role: {
    type: String,
    enum: ["farmer", "officer", "admin"],
    default: "farmer"
  },
  faceVerified: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);