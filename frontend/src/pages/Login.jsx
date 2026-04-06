import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceScanProctor from "../components/FaceScanProctor";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = mobile, 2 = otp, 3 = face
  const [capturedEmbedding, setCapturedEmbedding] = useState(null);
  const [faceScanned, setFaceScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [scanSessionKey, setScanSessionKey] = useState(0);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5002/api/auth";

  useEffect(() => {
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      navigate("/farmer", { replace: true });
      return;
    }

    const cached = sessionStorage.getItem("loginFlow");
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      setMobile(parsed.mobile || "");
      setOtp(parsed.otp || "");
      setStep(parsed.step || 1);
      setStatusMessage(parsed.statusMessage || "");
    } catch {
      sessionStorage.removeItem("loginFlow");
    }
  }, [navigate]);

  useEffect(() => {
    sessionStorage.setItem(
      "loginFlow",
      JSON.stringify({
        mobile,
        otp,
        step,
        statusMessage,
      })
    );
  }, [mobile, otp, step, statusMessage]);

  // ✅ Validate mobile number (10 digits)
  const isValidMobile = (num) => /^[6-9]\d{9}$/.test(num);

  const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);

  // 🔹 Step 1: Send OTP
  const sendOtp = async () => {
    const normalized = normalizePhone(mobile);

    if (!isValidMobile(normalized)) {
      setStatusMessage("Enter a valid mobile number.");
      return;
    }

    try {
      await axios.get(`${API_BASE}/exists/${normalized}`);
    } catch (error) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;

      if (status === 404) {
        setStatusMessage(apiMessage || "Phone number not registered");
      } else if (error?.code === "ERR_NETWORK") {
        setStatusMessage("Unable to reach server. Please ensure backend is running.");
      } else {
        setStatusMessage(apiMessage || "Unable to validate phone right now. Try again.");
      }
      return;
    }

    setMobile(normalized);

    // 🔥 For now dummy OTP (later connect backend)
    setStatusMessage("OTP sent. Use 1234.");
    setStep(2);
  };

  // 🔹 Step 2: Verify OTP
  const verifyOtp = async () => {
    if (otp !== "1234") {
      setStatusMessage("Wrong OTP. Try 1234.");
      return;
    }

    setStatusMessage("OTP verified. Complete face scan.");
    setStep(3);
  };

  const handleFaceComplete = (_faceImage, embedding, report) => {
    const captured = embedding || null;
    setCapturedEmbedding(captured);
    setFaceScanned(Boolean(captured && captured.length === 128));
  };

  const handleFaceError = (errorMsg) => {
    setFaceScanned(false);
    setCapturedEmbedding(null);
    setStatusMessage(`Face scan failed: ${errorMsg}`);
  };

  const handleRetryScan = () => {
    setFaceScanned(false);
    setCapturedEmbedding(null);
    setStatusMessage("Retry face scan. Keep face centered and stable.");
    setScanSessionKey((prev) => prev + 1);
  };

  const handleLogin = async (embeddingInput = capturedEmbedding) => {
    const normalized = normalizePhone(mobile);

    if (!isValidMobile(normalized)) {
      setStatusMessage("Enter a valid mobile number.");
      return;
    }

    if (!embeddingInput || embeddingInput.length !== 128) {
      setStatusMessage("Complete face scan before login.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        phone: normalized,
        faceEmbedding: embeddingInput,
      };

      const res = await axios.post(`${API_BASE}/login`, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.removeItem("loginFlow");

      setStatusMessage("Login successful. Redirecting...");
      navigate("/farmer");
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      setStatusMessage(message);
      if (error?.response?.status === 401) {
        setFaceScanned(false);
        setCapturedEmbedding(null);
        setScanSessionKey((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">

      <h2 className="text-2xl font-bold">Login with Mobile</h2>

      {statusMessage && (
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm text-slate-700">
          {statusMessage}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Enter Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(normalizePhone(e.target.value))}
            className="border p-2 rounded"
          />

          <button
            onClick={sendOtp}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Login (Send OTP)
          </button>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={verifyOtp}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Verify OTP
          </button>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="w-full max-w-md space-y-4">
          <FaceScanProctor
            key={scanSessionKey}
            onComplete={handleFaceComplete}
            onError={handleFaceError}
            requireStrictChecks={false}
          />

          <div className={`rounded-lg border px-4 py-2 text-sm text-center ${
            faceScanned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
          }`}>
            {faceScanned ? "Face scanned successfully" : "Face scan required to continue"}
          </div>

          <button
            onClick={() => handleLogin()}
            disabled={loading || !faceScanned || !capturedEmbedding}
            className="w-full bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login to Dashboard"}
          </button>

          <button
            onClick={handleRetryScan}
            type="button"
            className="w-full rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Retry Face Scan
          </button>
        </div>
      )}

    </div>
  );
}