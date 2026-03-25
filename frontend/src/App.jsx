import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import Home from "./pages/Home";
import LiveMap from "./pages/LiveMap";
import News from "./pages/News";
import Sources from "./pages/Sources";

function DetectionPage() {
  return (
    <div className="min-h-0 flex-1 bg-crisis-bg px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">AI detection</h1>
        <p className="mt-4 leading-relaxed text-slate-400">
          Incident prioritization and narrative summaries combine feed urgency, disaster type, and—when available—weather context. Tune thresholds and ingestion on the backend; this view is a roadmap surface for richer model telemetry and verification workflows.
        </p>
        <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6 backdrop-blur-md">
          <p className="text-sm text-cyan-100/90">
            Connect live detection metrics here (scores, false-positive flags, human labels) without changing existing API contracts.
          </p>
        </div>
      </div>
    </div>
  );
}

function ForecastPage() {
  return (
    <div className="min-h-0 flex-1 bg-crisis-bg px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Forecast & risk</h1>
        <p className="mt-4 leading-relaxed text-slate-400">
          Longer-horizon outlooks can layer seasonal climate signals and historical event density on top of OpenWeather snapshots. The Live Map already surfaces per-city risk—extend this page with charts when your pipeline exposes forecast endpoints.
        </p>
        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-6 backdrop-blur-md">
          <p className="text-sm text-blue-100/90">
            No frontend API changes required; add forecast routes server-side and bind them here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [mapCtx, setMapCtx] = useState({
    selectedCity: null,
    selectedWeather: null,
  });
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-crisis-bg">
      <Navbar />
      <div
        key={location.pathname}
        className="animate-page-in flex min-h-0 flex-1 flex-col"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/livemap"
            element={
              <LiveMap onMapContext={setMapCtx} chatOpen={chatOpen} />
            }
          />
          <Route path="/news" element={<News />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/detection" element={<DetectionPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/dashboard" element={<Navigate to="/livemap" replace />} />
        </Routes>
      </div>

      <Chatbot
        open={chatOpen}
        setOpen={setChatOpen}
        selectedCity={mapCtx.selectedCity}
        selectedWeather={mapCtx.selectedWeather}
      />
    </div>
  );
}
