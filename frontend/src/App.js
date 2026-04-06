import React, { useState } from "react";
import { Navigate, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";

const chips = ["Soil Moisture", "Weather Forecast", "Crop Health", "Water Usage"];

function Home() {
  const [mode, setMode] = useState("farmer");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* 🔥 Fixed Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h1 className="text-xl font-bold text-emerald-700">
              Prakriti Karmamarga
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="rounded-full border border-emerald-600 px-6 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl pt-20">
        <section className="relative overflow-hidden rounded-3xl shadow-2xl">
          
          {/* 🔥 Background Image (farmer planting crops) */}
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1800&q=80"
            alt="Farmer planting crops in field"
            className="h-[600px] w-full object-cover sm:h-[680px] lg:h-[750px]"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-3xl space-y-6 px-6 text-white sm:px-10 lg:px-16">
              
              {/* 🔥 Heading */}
              <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Smart Irrigation for Modern Farming
              </h1>

              {/* 🔥 Description */}
              <p className="max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
                Monitor soil moisture, predict irrigation needs, and optimize water usage using AI-powered smart farming solutions. Transform agriculture with real-time insights.
              </p>

              {/* 🔥 Mode Toggle with Description */}
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-200">
                  Select Your Role
                </p>
                <div className="w-full max-w-[600px] rounded-full border-2 border-white/60 bg-white/10 p-1.5 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-1 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("farmer")}
                      className={`rounded-full px-6 py-3 font-semibold transition ${
                        mode === "farmer"
                          ? "bg-emerald-500 text-white"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Farmer
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("officer")}
                      className={`rounded-full px-6 py-3 font-semibold transition ${
                        mode === "officer"
                          ? "bg-emerald-500 text-white"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Officer
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/70">
                  {mode === "farmer"
                    ? "Manage your farm zones, monitor soil health, and receive irrigation recommendations"
                    : "Monitor multiple farms, track farmer activity, and generate compliance reports"}
                </p>
              </div>

              {/* 🔥 Input */}
              <div className="flex w-full max-w-[700px] flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder={
                    mode === "farmer"
                      ? "Check soil status, crop health..."
                      : "Search farm data, alerts..."
                  }
                  className="h-12 flex-1 rounded-full border border-white/60 bg-white/20 px-6 text-white outline-none placeholder:text-white/60 backdrop-blur-sm focus:border-emerald-400 focus:bg-white/30"
                />

                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-emerald-600 px-8 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <span>⚡</span>
                  Start
                </button>
              </div>

              {/* 🔥 Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="rounded-full border border-white/40 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/80 hover:bg-white/10"
                  >
                    {chip}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Footer text */}
        <p className="pb-2 pt-10 text-center text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
          Trusted by 800+ Farmers | AI-Powered Agriculture
        </p>
      </main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/farmer" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/farmer"
        element={
          <PrivateRoute>
            <FarmerDashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}