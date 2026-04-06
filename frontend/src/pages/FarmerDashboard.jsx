import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function FarmerDashboard() {
  const navigate = useNavigate();

  const [cropStatus, setCropStatus] = useState("Not Started");
  const [cropStartedAt, setCropStartedAt] = useState(null);

  const [weather, setWeather] = useState({
    temp: 28,
    humidity: 60,
    rainComing: false,
    source: "mock",
    city: "Hyderabad",
    updatedAt: null,
  });
  const [moisture, setMoisture] = useState({ value: 45, source: "simulation" });
  const [aiCrop, setAiCrop] = useState(null);
  const [videoMode, setVideoMode] = useState("planning");
  const [searchText, setSearchText] = useState("");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState("");
  const [advisorResult, setAdvisorResult] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [cultivationPlan, setCultivationPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    crop: "",
    soilType: "",
    month: "",
  });
  const [decisionInput, setDecisionInput] = useState({
    cropType: "",
    landSize: "",
    soilType: "",
    moisturePercent: 45,
  });
  const [rainPrediction, setRainPrediction] = useState({
    value: false,
    source: "mock",
    city: "Hyderabad",
    updatedAt: null,
  });
  const [weatherDecisionLoading, setWeatherDecisionLoading] = useState(false);
  const [weatherDecisionError, setWeatherDecisionError] = useState("");
  const [engineSubmitted, setEngineSubmitted] = useState(false);

  const cropKnowledge = useMemo(
    () => ({
      rice: {
        display: "Rice",
        soil: "Clayey to loamy, high water retention",
        idealTemp: [24, 32],
        idealHumidity: [70, 90],
        idealMoisture: [65, 85],
        irrigation: "Keep standing water during vegetative stage; maintain shallow water layer.",
        growth: "Prepare puddled field, transplant healthy seedlings, maintain weed control, then reduce water before harvest.",
      },
      wheat: {
        display: "Wheat",
        soil: "Well-drained loam with good organic matter",
        idealTemp: [12, 26],
        idealHumidity: [40, 65],
        idealMoisture: [45, 60],
        irrigation: "Irrigate at crown root initiation, tillering, flowering, and grain filling.",
        growth: "Sow in lines with proper spacing, apply balanced NPK, and avoid waterlogging near maturity.",
      },
      maize: {
        display: "Maize",
        soil: "Fertile, well-drained sandy loam",
        idealTemp: [18, 32],
        idealHumidity: [45, 75],
        idealMoisture: [50, 70],
        irrigation: "Critical irrigation at knee-high, tasseling, and grain filling stages.",
        growth: "Use high-quality seed, maintain plant population, and do timely top dressing of nitrogen.",
      },
      cotton: {
        display: "Cotton",
        soil: "Deep black soil or well-drained alluvial soils",
        idealTemp: [20, 35],
        idealHumidity: [45, 70],
        idealMoisture: [45, 60],
        irrigation: "Moderate irrigation; avoid excess water during flowering and boll development.",
        growth: "Ensure proper spacing, manage bollworm risk early, and apply micronutrients when needed.",
      },
      sugarcane: {
        display: "Sugarcane",
        soil: "Deep loam with high organic carbon",
        idealTemp: [20, 34],
        idealHumidity: [55, 80],
        idealMoisture: [60, 80],
        irrigation: "Frequent irrigation in summer; use furrow or drip for better water efficiency.",
        growth: "Plant healthy setts, maintain trash mulching, and support ratoon crop with nutrients.",
      },
      tomato: {
        display: "Tomato",
        soil: "Well-drained loam, pH 6.0-7.0",
        idealTemp: [18, 30],
        idealHumidity: [50, 70],
        idealMoisture: [55, 70],
        irrigation: "Light and frequent irrigation; avoid leaf wetting to reduce fungal infection.",
        growth: "Use raised beds, provide staking, and manage pests with integrated methods.",
      },
      groundnut: {
        display: "Groundnut",
        soil: "Sandy loam with good drainage",
        idealTemp: [20, 32],
        idealHumidity: [45, 70],
        idealMoisture: [45, 60],
        irrigation: "Irrigate during flowering and pod formation; avoid excess moisture.",
        growth: "Use treated seed, keep field weed-free, and apply gypsum at pegging stage.",
      },
      millet: {
        display: "Millet",
        soil: "Light to medium soils, tolerant of low fertility",
        idealTemp: [24, 34],
        idealHumidity: [35, 60],
        idealMoisture: [35, 55],
        irrigation: "Low water requirement; irrigate only during prolonged dry spells.",
        growth: "Good for dryland farming; focus on early sowing with moisture conservation practices.",
      },
    }),
    []
  );

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const refreshWeatherData = useCallback(async () => {
    const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
    const weatherCity = process.env.REACT_APP_WEATHER_CITY || "Hyderabad";

    setWeatherDecisionError("");
    setWeatherDecisionLoading(true);

    try {
      if (!OPENWEATHER_API_KEY) {
        throw new Error("Missing OpenWeather key");
      }

      const [currentRes, forecastRes] = await Promise.all([
        axios.get("https://api.openweathermap.org/data/2.5/weather", {
          params: { q: weatherCity, appid: OPENWEATHER_API_KEY, units: "metric" },
        }),
        axios.get("https://api.openweathermap.org/data/2.5/forecast", {
          params: { q: weatherCity, appid: OPENWEATHER_API_KEY, units: "metric" },
        }),
      ]);

      const temp = Number(currentRes?.data?.main?.temp ?? 28);
      const humidity = Number(currentRes?.data?.main?.humidity ?? 60);

      const next12h = (forecastRes?.data?.list || []).slice(0, 4);
      const rainComing = next12h.some((item) => {
        const rainVolume = Number(item?.rain?.["3h"] || 0);
        const weatherMain = String(item?.weather?.[0]?.main || "").toLowerCase();
        return rainVolume > 0 || weatherMain.includes("rain") || weatherMain.includes("storm");
      });

      setWeather({
        temp,
        humidity,
        rainComing,
        source: "openweather",
        city: weatherCity,
        updatedAt: new Date().toISOString(),
      });

      setRainPrediction({
        value: rainComing,
        source: "openweather",
        city: weatherCity,
        updatedAt: new Date().toISOString(),
      });
    } catch (_err) {
      const mockHumidity = 60;
      const mockRainComing = mockHumidity >= 75;

      setWeather({
        temp: 28,
        humidity: mockHumidity,
        rainComing: mockRainComing,
        source: "mock",
        city: weatherCity,
        updatedAt: new Date().toISOString(),
      });

      setRainPrediction({
        value: mockRainComing,
        source: "mock",
        city: weatherCity,
        updatedAt: new Date().toISOString(),
      });

      setWeatherDecisionError("OpenWeather unavailable. Using mock weather data.");
    } finally {
      setWeatherDecisionLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeatherData();
  }, [refreshWeatherData]);

  useEffect(() => {
    setMoisture({ value: Number(decisionInput.moisturePercent), source: "simulation" });
  }, [decisionInput.moisturePercent]);

  useEffect(() => {
    const temp = Number(weather?.temp || 28);
    const moistureValue = Number(moisture?.value || 45);

    let recommendedCrop = "millet";
    if (temp >= 24 && moistureValue >= 65) recommendedCrop = "rice";
    else if (temp <= 26 && moistureValue >= 45 && moistureValue <= 60) recommendedCrop = "wheat";
    else if (temp >= 20 && moistureValue >= 50 && moistureValue <= 70) recommendedCrop = "maize";
    else if (temp >= 28 && moistureValue <= 60) recommendedCrop = "cotton";

    setAiCrop({
      recommendedCrop,
      irrigation: moistureValue >= 60 ? "Light irrigation only" : "Irrigate as per moisture trend",
    });
  }, [weather?.temp, moisture?.value]);

  const clampValue = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const compareRange = (value, min, max, unit) => {
    if (value < min) return `Too low (${value}${unit}). Increase toward ${min}-${max}${unit}.`;
    if (value > max) return `Too high (${value}${unit}). Bring it down toward ${min}-${max}${unit}.`;
    return `Optimal (${value}${unit}) within ${min}-${max}${unit}.`;
  };

  const buildAdvisor = (cropKey) => {
    const key = String(cropKey || "").toLowerCase().trim();
    const profile = cropKnowledge[key];
    if (!profile) return null;

    const currentTemp = clampValue(weather?.temp, 28);
    const currentHumidity = clampValue(weather?.humidity, 60);
    const currentMoisture = clampValue(moisture?.value, 55);

    const moistureAnalysis = compareRange(
      currentMoisture,
      profile.idealMoisture[0],
      profile.idealMoisture[1],
      "%"
    );
    const weatherAnalysis = `Temperature: ${compareRange(
      currentTemp,
      profile.idealTemp[0],
      profile.idealTemp[1],
      "°C"
    )} Humidity: ${compareRange(
      currentHumidity,
      profile.idealHumidity[0],
      profile.idealHumidity[1],
      "%"
    )}`;

    return {
      crop: profile.display,
      soil: profile.soil,
      idealTemp: `${profile.idealTemp[0]}-${profile.idealTemp[1]}°C`,
      idealHumidity: `${profile.idealHumidity[0]}-${profile.idealHumidity[1]}%`,
      idealMoisture: `${profile.idealMoisture[0]}-${profile.idealMoisture[1]}%`,
      growthPlan: profile.growth,
      irrigationPlan: profile.irrigation,
      moistureAnalysis,
      weatherAnalysis,
      nextAction:
        currentMoisture < profile.idealMoisture[0]
          ? "Start irrigation cycle now and re-check moisture in 4 hours."
          : currentMoisture > profile.idealMoisture[1]
          ? "Pause irrigation and improve drainage before next watering."
          : "Maintain current irrigation schedule and monitor crop stress signs.",
    };
  };

  const handleAdvisorSearch = async (cropInput) => {
    const query = String(cropInput ?? searchText).trim().toLowerCase();
    if (!query) {
      setAdvisorError("Enter a crop name like rice, wheat, tomato, or cotton.");
      setAdvisorResult(null);
      return;
    }

    setAdvisorLoading(true);
    setAdvisorError("");

    const localAdvisor = buildAdvisor(query);
    if (!localAdvisor) {
      setAdvisorLoading(false);
      setAdvisorResult(null);
      setAdvisorError("Crop not found in advisor. Try: rice, wheat, maize, cotton, tomato, sugarcane, groundnut, millet.");
      return;
    }

    // Keep a tiny async delay to feel like AI processing and improve UX continuity.
    await new Promise((resolve) => setTimeout(resolve, 300));
    setAdvisorResult(localAdvisor);
    setAdvisorLoading(false);
  };

  useEffect(() => {
    const suggested = aiCrop?.recommendedCrop;
    if (suggested && !advisorResult) {
      setSearchText(String(suggested));
      handleAdvisorSearch(String(suggested).toLowerCase());
    }
  }, [aiCrop]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadLatestPlan = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`http://localhost:5002/api/cultivation-plans/user/${user.id}/latest`);
        const plan = res?.data?.data;
        if (!plan) return;
        setCultivationPlan(plan);
        setCropStatus("Started");
        setCropStartedAt(plan?.createdAt ? new Date(plan.createdAt) : new Date());
      } catch (_err) {
        // No plan yet is a valid case; keep default UI.
      }
    };

    loadLatestPlan();
  }, [user?.id]);

  useEffect(() => {
    if (!cultivationPlan) return;
    setDecisionInput((prev) => ({
      ...prev,
      cropType: prev.cropType || cultivationPlan.crop || "",
      soilType: prev.soilType || cultivationPlan.soilType || "",
    }));
  }, [cultivationPlan]);

  const fetchRainPrediction = refreshWeatherData;

  const handleStartCrop = () => {
    setPlanError("");
    setPlanForm((prev) => ({
      crop: prev.crop || String(aiCrop?.recommendedCrop || "").toLowerCase(),
      soilType: prev.soilType || "",
      month: prev.month || "",
    }));
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    const crop = String(planForm.crop || "").trim().toLowerCase();
    const soilType = String(planForm.soilType || "").trim();
    const month = String(planForm.month || "").trim();

    if (!crop || !soilType || !month) {
      setPlanError("Please fill crop type, soil type, and month.");
      return;
    }

    if (!user?.id) {
      setPlanError("User session missing. Please login again.");
      return;
    }

    try {
      setPlanSaving(true);
      setPlanError("");

      const res = await axios.post("http://localhost:5002/api/cultivation-plans", {
        userId: user.id,
        crop,
        soilType,
        month,
      });

      const savedPlan = res?.data?.data;
      setCultivationPlan(savedPlan);
      setCropStatus("Started");
      setCropStartedAt(savedPlan?.createdAt ? new Date(savedPlan.createdAt) : new Date());
      setShowPlanModal(false);
      setSearchText(crop);
      handleAdvisorSearch(crop);
    } catch (err) {
      setPlanError(err?.response?.data?.message || "Unable to save cultivation plan.");
    } finally {
      setPlanSaving(false);
    }
  };

  const roadmap = useMemo(() => {
    if (!cultivationPlan?.crop) return [];
    const cropName = String(cultivationPlan.crop).toLowerCase();
    const stageMap = {
      rice: ["Land preparation", "Nursery and transplanting", "Vegetative irrigation cycle", "Flowering and grain filling", "Harvest and drying"],
      wheat: ["Field leveling", "Sowing and germination", "Tillering nutrition", "Flowering and grain fill", "Harvest"],
      maize: ["Seedbed preparation", "Sowing", "Knee-high irrigation", "Tasseling and cob formation", "Harvest"],
      cotton: ["Seed treatment", "Sowing and early growth", "Square and flowering care", "Boll development", "Picking"],
      tomato: ["Nursery raising", "Transplanting", "Staking and pruning", "Flowering and fruiting", "Harvest"],
    };
    const generic = ["Soil testing", "Land preparation", "Sowing", "Growth monitoring", "Harvest planning"];
    const stages = stageMap[cropName] || generic;
    return stages.map((label, idx) => ({
      id: idx + 1,
      label,
      note: `Stage ${idx + 1} for ${cropName} during ${cultivationPlan.month}.`,
    }));
  }, [cultivationPlan]);

  const decisionResult = useMemo(() => {
    if (!engineSubmitted) return null;
    const moistureValue = Number(decisionInput.moisturePercent);

    if (moistureValue >= 60) {
      return {
        code: "SKIP",
        symbol: "❌",
        title: "Skip Irrigation",
        reason: "Soil moisture is already high.",
        color: "bg-rose-100 border-rose-300 text-rose-800",
      };
    }

    if (rainPrediction.value) {
      return {
        code: "DELAY",
        symbol: "⏳",
        title: "Delay Irrigation",
        reason: "Rain is expected soon.",
        color: "bg-amber-100 border-amber-300 text-amber-800",
      };
    }

    return {
      code: "IRRIGATE",
      symbol: "✅",
      title: "Irrigate Now",
      reason: "Moisture is low and no rain is expected.",
      color: "bg-emerald-100 border-emerald-300 text-emerald-800",
    };
  }, [decisionInput.moisturePercent, engineSubmitted, rainPrediction.value]);

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    const cropType = String(decisionInput.cropType || "").trim();
    const landSize = String(decisionInput.landSize || "").trim();
    const soilType = String(decisionInput.soilType || "").trim();

    if (!cropType || !landSize || !soilType) {
      setWeatherDecisionError("Please enter crop type, land size, and soil type.");
      setEngineSubmitted(false);
      return;
    }

    setWeatherDecisionError("");
    setEngineSubmitted(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // 🌟 Carousel Data
  const carouselData = [
    { title: "Temperature", value: weather?.temp + "°C" },
    { title: "Humidity", value: weather?.humidity + "%" },
    { title: "Moisture", value: moisture?.value + "%" },
    { title: "Crop Suggestion", value: aiCrop?.recommendedCrop },
  ];

  const quickTopics = ["Rice", "Wheat", "Maize", "Cotton", "Tomato", "Sugarcane"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 via-emerald-50 to-amber-50 flex flex-col">

      {/* 🌿 NAVBAR */}
      <nav className="bg-gradient-to-r from-emerald-700 to-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🌱 Prakriti Karmamarga</h1>
        <button
          onClick={handleLogout}
          className="bg-white text-green-700 px-4 py-1 rounded"
        >
          Logout
        </button>
      </nav>

      <div className="p-6 md:p-10 space-y-8 flex-1">

        {/* 🎥 VIDEO HERO SECTION */}
        <section className="relative overflow-hidden rounded-[2rem] shadow-2xl">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-[520px] w-full object-cover"
            src="https://www.w3schools.com/html/mov_bbb.mp4"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),transparent_35%)]" />

          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-6 md:px-10 lg:px-14">
              <div className="max-w-4xl space-y-5 text-white">
                <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  AI Smart Farming Assistant for Every Crop
                </h2>

                <p className="max-w-2xl text-base text-white/90 sm:text-xl">
                  Search any crop and get AI guidance for growing steps, moisture targets, weather suitability, and irrigation planning.
                </p>

                <div className="inline-flex w-full max-w-[760px] rounded-full border border-white/70 bg-white/10 p-1 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setVideoMode("planning")}
                    className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition sm:text-2xl ${
                      videoMode === "planning"
                        ? "bg-white text-black"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Crop Planning
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode("live")}
                    className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition sm:text-2xl ${
                      videoMode === "live"
                        ? "bg-white text-black"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Live Field Tips
                  </button>
                </div>

                <div className="flex w-full max-w-[760px] items-center gap-3 rounded-full border border-white/70 bg-white p-2 text-slate-900 shadow-xl">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdvisorSearch();
                    }}
                    placeholder="Search crop: rice, wheat, maize, tomato..."
                    className="w-full bg-transparent px-3 text-sm font-medium placeholder:text-slate-500 focus:outline-none sm:text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdvisorSearch()}
                    className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-base font-semibold text-white transition hover:bg-slate-800"
                  >
                    <span className="text-lime-300">◌</span>
                    {advisorLoading ? "Analyzing..." : "Ask AI"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {quickTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setSearchText(topic);
                        handleAdvisorSearch(topic.toLowerCase());
                      }}
                      className="rounded-full border border-white/70 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      {topic} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🤖 AI CROP ADVISOR OUTPUT */}
        <section className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-emerald-800">AI Crop Growth Advisor</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {weather?.source === "openweather" ? "Using OpenWeather + moisture simulation" : "Using mock weather + moisture simulation"}
            </span>
          </div>

          {advisorError && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {advisorError}
            </div>
          )}

          {!advisorResult && !advisorError && (
            <p className="text-sm text-slate-600">
              Search a crop to generate AI-based growing guide, moisture requirement, weather match, and immediate irrigation action.
            </p>
          )}

          {advisorResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">Recommended Crop</p>
                  <p className="text-lg font-bold text-emerald-900">{advisorResult.crop}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">Ideal Moisture</p>
                  <p className="text-lg font-bold text-amber-900">{advisorResult.idealMoisture}</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                  <p className="text-xs text-sky-700">Ideal Weather</p>
                  <p className="text-sm font-bold text-sky-900">
                    {advisorResult.idealTemp} | {advisorResult.idealHumidity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-800">How to grow</h4>
                  <p className="mt-1 text-sm text-slate-700">{advisorResult.growthPlan}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-800">Irrigation strategy</h4>
                  <p className="mt-1 text-sm text-slate-700">{advisorResult.irrigationPlan}</p>
                </div>
              </div>

              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <h4 className="font-semibold text-violet-900">Moisture analysis</h4>
                <p className="mt-1 text-sm text-violet-800">{advisorResult.moistureAnalysis}</p>
              </div>

              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                <h4 className="font-semibold text-cyan-900">Weather analysis</h4>
                <p className="mt-1 text-sm text-cyan-800">{advisorResult.weatherAnalysis}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-100 p-4">
                <h4 className="font-semibold text-emerald-900">Immediate next action</h4>
                <p className="mt-1 text-sm font-medium text-emerald-800">{advisorResult.nextAction}</p>
              </div>
            </div>
          )}
        </section>

        {/* 🔷 SMART IRRIGATION DECISION ENGINE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-800">Smart Irrigation Decision Engine</h3>
            <button
              type="button"
              onClick={fetchRainPrediction}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {weatherDecisionLoading ? "Updating weather..." : "Refresh Weather (OpenWeather)"}
            </button>
          </div>

          <form onSubmit={handleDecisionSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Crop type</label>
              <input
                type="text"
                value={decisionInput.cropType}
                onChange={(e) => setDecisionInput((prev) => ({ ...prev, cropType: e.target.value }))}
                placeholder="e.g., rice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Land size</label>
              <input
                type="text"
                value={decisionInput.landSize}
                onChange={(e) => setDecisionInput((prev) => ({ ...prev, landSize: e.target.value }))}
                placeholder="e.g., 2 acres"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Soil type</label>
              <input
                type="text"
                value={decisionInput.soilType}
                onChange={(e) => setDecisionInput((prev) => ({ ...prev, soilType: e.target.value }))}
                placeholder="e.g., loamy"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Soil moisture simulation: <span className="font-bold">{decisionInput.moisturePercent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={decisionInput.moisturePercent}
                onChange={(e) => setDecisionInput((prev) => ({ ...prev, moisturePercent: Number(e.target.value) }))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Generate Recommendation
              </button>
            </div>
          </form>

          {weatherDecisionError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {weatherDecisionError}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Moisture Level</p>
              <p className="text-2xl font-bold text-slate-800">{decisionInput.moisturePercent}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Weather Status</p>
              <p className="text-xl font-bold text-slate-800">Rain: {rainPrediction.value ? "Yes" : "No"}</p>
              <p className="text-xs text-slate-500">Source: {rainPrediction.source}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Recommendation</p>
              <p className="text-xl font-bold text-slate-800">{decisionResult ? `${decisionResult.symbol} ${decisionResult.code}` : "Pending"}</p>
            </div>
          </div>

          {decisionResult && (
            <div className={`mt-5 rounded-xl border-2 p-6 text-center ${decisionResult.color}`}>
              <p className="text-xs font-semibold tracking-wide">FINAL RESULT</p>
              <p className="mt-2 text-4xl font-black sm:text-5xl">
                {decisionResult.symbol} {decisionResult.title}
              </p>
              <p className="mt-2 text-base font-medium">{decisionResult.reason}</p>
            </div>
          )}
        </section>

        {/* 📊 EXISTING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {carouselData.map((item) => (
            <div key={item.title} className="bg-white p-4 rounded-xl shadow">
              <p className="text-xs text-gray-500">{item.title}</p>
              <p className="text-2xl font-bold text-green-700">
                {item.value || "Loading..."}
              </p>
            </div>
          ))}
        </div>

        {/* 🤖 AI DETAILS */}
        {aiCrop && (
          <div className="bg-white p-5 rounded-xl shadow">
            <h2 className="font-semibold text-lg">🤖 AI Recommendation</h2>
            <p className="mt-2">Best Crop: <b>{aiCrop.recommendedCrop}</b></p>
            <p>Irrigation: {aiCrop.irrigation}</p>
          </div>
        )}

        {/* 🚜 START CROP */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Crop Action</h2>

          <button
            onClick={handleStartCrop}
            disabled={cropStatus === "Started"}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded"
          >
            {cropStatus === "Started" ? "Crop Running" : "Start Crop"}
          </button>

          <p className="mt-2">Status: {cropStatus}</p>

          {cropStartedAt && (
            <p className="text-xs text-gray-500">
              Started at: {cropStartedAt.toLocaleString()}
            </p>
          )}

          {cultivationPlan && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-800">Current Plan</p>
              <p className="text-sm text-emerald-700">Crop: {cultivationPlan.crop}</p>
              <p className="text-sm text-emerald-700">Soil: {cultivationPlan.soilType}</p>
              <p className="text-sm text-emerald-700">Month: {cultivationPlan.month}</p>

              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-800">
                <span className={`h-3 w-3 rounded-full ${cultivationPlan.sensorConnected ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                Sensor connected in soil: {cultivationPlan.sensorConnected ? "Connected" : "Not connected"}
              </div>
            </div>
          )}
        </div>

        {cultivationPlan && (
          <section className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-lg font-semibold text-slate-800">Cultivation Roadmap</h2>
            <p className="mt-1 text-sm text-slate-500">
              Roadmap for {cultivationPlan.crop} in {cultivationPlan.month} on {cultivationPlan.soilType} soil.
            </p>
            <div className="mt-4 space-y-3">
              {roadmap.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {item.id}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">Cultivation Setup</h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter your cultivation details to generate your crop roadmap.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Which crop are you going to cultivate?</label>
                <input
                  type="text"
                  value={planForm.crop}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, crop: e.target.value }))}
                  placeholder="e.g., rice"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">What type of soil?</label>
                <input
                  type="text"
                  value={planForm.soilType}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, soilType: e.target.value }))}
                  placeholder="e.g., loamy"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">In which month?</label>
                <input
                  type="month"
                  value={planForm.month}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, month: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {planError && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{planError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={planSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {planSaving ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌍 FOOTER */}
      <footer className="bg-green-800 text-white text-center py-3">
        © 2026 Prakriti Karmamarga | Smart Farming System 🌾
      </footer>
    </div>
  );
}