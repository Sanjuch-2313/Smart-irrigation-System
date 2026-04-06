import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceScanProctor from "../components/FaceScanProctor";

export default function Register() {
  const [data, setData] = useState({});
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [proctorPassed, setProctorPassed] = useState(false);
  const [proctorReport, setProctorReport] = useState(null);
  const [capturedEmbedding, setCapturedEmbedding] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5002/api/auth";

  // ✅ Mobile validation
  const isValidMobile = (num) => /^[6-9]\d{9}$/.test(num);
  const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);

  // 🔹 Step 1: Send OTP
  const sendOtp = () => {
    if (!data.name || data.name.trim().length < 3) {
      setStatusMessage("Please enter a valid name (at least 3 characters).");
      return;
    }

    const normalizedPhone = normalizePhone(data.mobile);

    if (!isValidMobile(normalizedPhone)) {
      setStatusMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    setData({ ...data, mobile: normalizedPhone });
    setStatusMessage("OTP sent. Use 1234.");
    setStep(2);
  };

  // 🔹 Step 2: Verify OTP
  const verifyOtp = () => {
    if (otp !== "1234") {
      setStatusMessage("Wrong OTP. Enter 1234.");
      return;
    }

    setStatusMessage("OTP verified. Complete face scan.");
    setStep(3);
  };

  const handleFaceComplete = (_faceImage, _embedding, report) => {
    setProctorPassed(true);
    setProctorReport(report || null);
    setCapturedEmbedding(_embedding || null);
  };

  const handleFaceError = (errorMsg) => {
    setProctorPassed(false);
    setCapturedEmbedding(null);
    setStatusMessage(`Face scan failed: ${errorMsg}`);
  };

  // 🔹 Step 4: Register user
  const handleRegister = async () => {
    if (!proctorPassed) {
      setStatusMessage("Complete face scan before registration.");
      return;
    }

    if (!capturedEmbedding || capturedEmbedding.length !== 128) {
      setStatusMessage("Face scan data missing. Please scan again.");
      return;
    }

    try {
      setLoading(true);

      const normalizedPhone = normalizePhone(data.mobile);

      if (!isValidMobile(normalizedPhone)) {
        setStatusMessage("Invalid mobile number format.");
        return;
      }

      const payload = {
        name: data.name?.trim(),
        phone: normalizedPhone,
        role: data.role || "farmer",
        faceEmbedding: capturedEmbedding,
      };

      const res = await axios.post(`${API_BASE}/register`, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setRedirecting(true);
      setCountdown(3);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.code === "ERR_NETWORK"
          ? "Backend not reachable. Start backend server and check DB connection."
          : "Registration failed");
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!redirecting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [redirecting, navigate]);

  return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-green-50 to-lime-100 flex items-center justify-center px-4">

    <div className="w-full max-w-3xl">

      {/* Card */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl p-8 md:p-10 transition-all duration-300">

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-emerald-700">
            🌱 Register to Prakriti Karmamarga
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Smart Irrigation • Secure OTP • AI Face Authentication
          </p>
        </div>

        {/* Status message banner */}
        {statusMessage && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm text-slate-700">
            {statusMessage}
          </div>
        )}

        {/* Steps */}
        <div className="mb-6 flex justify-center gap-3 text-xs">
          <span className={`px-4 py-1 rounded-full font-medium ${
            step >= 1 ? "bg-emerald-500 text-white shadow" : "bg-gray-200"
          }`}>
            Details
          </span>
          <span className={`px-4 py-1 rounded-full font-medium ${
            step >= 2 ? "bg-emerald-500 text-white shadow" : "bg-gray-200"
          }`}>
            OTP
          </span>
          <span className={`px-4 py-1 rounded-full font-medium ${
            step >= 3 ? "bg-emerald-500 text-white shadow" : "bg-gray-200"
          }`}>
            Face Scan
          </span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              placeholder="Enter your name"
              onChange={e => setData({ ...data, name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
            />

            <input
              placeholder="Enter mobile number"
              value={data.mobile || ""}
              onChange={e => setData({ ...data, mobile: normalizePhone(e.target.value) })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
            />

            <select
              onChange={e => setData({ ...data, role: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
            >
              <option value="farmer">🌾 Farmer</option>
              <option value="officer">🧑‍💼 Officer</option>
              <option value="admin">👑 Admin</option>
            </select>

            <button
              onClick={sendOtp}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] transition"
            >
              Send OTP 🚀
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              placeholder="Enter OTP"
              onChange={e => setOtp(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm text-center tracking-widest"
            />

            <button
              onClick={verifyOtp}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] transition"
            >
              Verify OTP 🔐
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5">

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow">
              <FaceScanProctor onComplete={handleFaceComplete} onError={handleFaceError} />
            </div>

            {proctorReport?.strictPass && (
              <div className="text-center rounded-xl bg-green-100 text-green-700 py-2 font-medium">
                ✅ Face verified successfully
              </div>
            )}

            {redirecting && (
              <div className="text-center rounded-xl bg-blue-100 text-blue-700 py-2 font-medium">
                Redirecting to login in {countdown}...
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading || !proctorPassed || redirecting}
              className="w-full rounded-xl bg-black py-3 font-semibold text-white shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
            >
              {loading ? "Registering..." : redirecting ? "Redirecting..." : "Complete Registration"}
            </button>
          </div>
        )}

      </div>
    </div>
  </div>
);
}