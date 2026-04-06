const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

/**
 * Euclidean distance between two 128-dim face descriptors.
 * face-api.js uses L2 distance; threshold 0.5 = lenient, 0.4 = strict.
 */
const euclideanDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = Number(a[i]) - Number(b[i]);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Validate that a value is a clean 128-element float array.
 * Returns the clean array or null.
 */
const validateEmbedding = (embedding) => {
  if (!Array.isArray(embedding) || embedding.length !== 128) return null;
  const clean = embedding.map(Number);
  if (clean.some((v) => !Number.isFinite(v))) return null;
  return clean;
};


exports.checkPhoneExists = async (req, res) => {
  try {
    const phone = String(req.params.phone || "").replace(/\D/g, "");
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    const user = await User.findOne({ phone }).select("_id");
    if (!user) return res.status(404).json({ message: "Phone number not registered" });
    return res.status(200).json({ exists: true });
  } catch (error) {
    return res.status(500).json({ message: "Failed to validate phone number" });
  }
};

// Register with phone + face biometric
exports.register = async (req, res) => {
  try {
    const { phone, faceEmbedding, name, role } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone.toString())) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    const cleanEmbedding = validateEmbedding(faceEmbedding);
    if (!cleanEmbedding) {
      console.error("[Register] Invalid embedding:", Array.isArray(faceEmbedding) ? faceEmbedding.length : typeof faceEmbedding);
      return res.status(400).json({ message: "Invalid face embedding. Must be 128-dimensional float array." });
    }

    console.log(`[Register] Storing embedding length=${cleanEmbedding.length} for phone=${phone}`);

    const user = new User({
      phone,
      name: name || "User",
      faceEmbedding: cleanEmbedding,
      role: role || "farmer",
      faceVerified: true,
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, phone: user.phone, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("[Register] Error:", error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};

// Login with phone + face biometric
exports.login = async (req, res) => {
  try {
    const { phone, faceEmbedding } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone.toString())) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Phone number not registered. Please register first." });
    }

    const inputEmbedding = validateEmbedding(faceEmbedding);
    if (!inputEmbedding) {
      console.error("[Login] Invalid input embedding length:", Array.isArray(faceEmbedding) ? faceEmbedding.length : typeof faceEmbedding);
      return res.status(400).json({ message: "Invalid face embedding received." });
    }

    const storedEmbedding = validateEmbedding(user.faceEmbedding);
    if (!storedEmbedding) {
      console.error("[Login] Stored embedding invalid for phone:", phone);
      return res.status(400).json({ message: "Stored face data is invalid. Please register again." });
    }

    const distance = euclideanDistance(storedEmbedding, inputEmbedding);
    const THRESHOLD = Number(process.env.FACE_DISTANCE_THRESHOLD || 0.55);

    console.log(`[Login] phone=${phone} distance=${distance.toFixed(4)} threshold=${THRESHOLD}`);

    if (distance > THRESHOLD) {
      return res.status(401).json({
        message: `Face not recognised (distance ${distance.toFixed(2)}). Please rescan.`,
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: { id: user._id, phone: user.phone, name: user.name, role: user.role, faceVerified: true },
    });
  } catch (error) {
    console.error("[Login] Error:", error);
    res.status(500).json({ message: "Login failed: " + error.message });
  }
};

// Legacy email/password registration (for backward compatibility)
exports.registerEmail = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "farmer",
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Email registration failed: " + error.message });
  }
};

// Legacy email/password login (for backward compatibility)
exports.loginEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify password
    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Email login failed: " + error.message });
  }
};
