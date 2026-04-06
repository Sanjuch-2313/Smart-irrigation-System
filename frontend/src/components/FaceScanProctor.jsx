import * as faceapi from "face-api.js";
import React, { useCallback, useEffect, useRef, useState } from "react";

const MODEL_URL = "/models";

export default function FaceScanProctor({ onComplete, onError, requireStrictChecks = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectLoopRef = useRef(null);
  const cooldownRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [message, setMessage] = useState("Loading face detection models...");
  const [confidence, setConfidence] = useState(0);
  const [faceCount, setFaceCount] = useState(0);

  // ─── 1. Load face-api.js models ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        setMessage("Loading face AI models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) {
          setModelsLoaded(true);
          setMessage("Models ready. Starting camera...");
        }
      } catch (err) {
        console.error("[FaceScan] Model load error:", err);
        if (!cancelled) {
          setMessage("Failed to load face models. Refresh the page.");
          onError?.("Failed to load face detection models: " + err.message);
        }
      }
    };

    loadModels();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. Start camera after models are ready ────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded) return;
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCameraReady(true);
            setMessage("Keep your face centered in the frame.");
          };
        }
      } catch (err) {
        console.error("[FaceScan] Camera error:", err);
        setMessage("Camera access denied. Enable camera and reload.");
        onError?.("Camera access denied: " + err.message);
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [modelsLoaded, onError]);

  // ─── 3. Continuous face detection loop ────────────────────────────────────
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended || !cameraReady) return;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    const count = detections.length;
    setFaceCount(count);

    if (count === 0) {
      setConfidence(0);
      setMessage("No face detected. Look directly at the camera.");
      return;
    }

    if (count > 1) {
      setConfidence(0);
      setMessage("Multiple faces detected. Only one face allowed.");
      return;
    }

    const detection = detections[0];
    const score = detection.detection.score;
    setConfidence(score);

    console.log(`[FaceScan] confidence=${score.toFixed(3)}`);

    const threshold = requireStrictChecks ? 0.7 : 0.6;

    if (score < threshold) {
      setMessage(`Confidence too low (${(score * 100).toFixed(0)}%). Move closer to camera.`);
      return;
    }

    setMessage("Face detected! Hold still...");

    if (!cooldownRef.current) {
      cooldownRef.current = true;
      setTimeout(() => captureFace(detection), 600);
    }
  }, [cameraReady, requireStrictChecks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cameraReady || faceCaptured) return;

    const loop = setInterval(runDetection, 500);
    detectLoopRef.current = loop;
    return () => clearInterval(loop);
  }, [cameraReady, faceCaptured, runDetection]);

  // ─── 4. Capture frame and extract real 128-dim descriptor ─────────────────
  const captureFace = useCallback(async (latestDetection) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Re-detect to get a fresh descriptor at capture time
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length !== 1) {
      cooldownRef.current = false;
      setMessage("Face moved. Hold still and try again.");
      return;
    }

    const detection = detections[0];
    const score = detection.detection.score;

    // Float32Array → plain JS Array (required for JSON serialisation)
    const rawDescriptor = Array.from(detection.descriptor);

    console.log(`[FaceScan] Captured embedding length=${rawDescriptor.length} confidence=${score.toFixed(3)}`);

    if (rawDescriptor.length !== 128) {
      cooldownRef.current = false;
      setMessage("Embedding length invalid. Try again.");
      onError?.("Embedding must be 128 values, got " + rawDescriptor.length);
      return;
    }

    // Validate all values are finite numbers
    const valid = rawDescriptor.every((v) => Number.isFinite(v));
    if (!valid) {
      cooldownRef.current = false;
      setMessage("Invalid embedding values. Try again.");
      onError?.("Embedding contained non-finite values.");
      return;
    }

    // Stop detection loop and camera
    clearInterval(detectLoopRef.current);
    stopCamera();
    setFaceCaptured(true);
    setMessage("Face scan complete!");

    // Take a snapshot of the frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    onComplete?.(imageDataUrl, rawDescriptor, { confidence: score });
  }, [onComplete, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  const handleRetry = () => {
    cooldownRef.current = false;
    setFaceCaptured(false);
    setConfidence(0);
    setFaceCount(0);
    setMessage("Models ready. Starting camera...");
    setCameraReady(false);
    setModelsLoaded(false);
  };

  const statusColor =
    faceCount === 1 && confidence >= (requireStrictChecks ? 0.7 : 0.6)
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Face ID</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
            {faceCaptured ? "Captured" : faceCount === 1 ? "Face Ready" : "Scanning"}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-500 bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-80 w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Guide overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`h-64 w-48 rounded-2xl border-2 border-dashed transition-colors ${
                faceCount === 1 ? "border-emerald-400" : "border-white/40"
              }`}
            />
          </div>

          {/* Live confidence badge */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {!modelsLoaded
                ? "Loading models..."
                : faceCaptured
                ? "Done"
                : faceCount === 0
                ? "No face"
                : `Confidence ${(confidence * 100).toFixed(0)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Status message */}
      <p className="text-center text-sm text-slate-600">{message}</p>

      {/* Retry button while scan is still in progress or stuck */}
      {!faceCaptured && (
        <button
          onClick={handleRetry}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Retry
        </button>
      )}
    </div>
  );
}
