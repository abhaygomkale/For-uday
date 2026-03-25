import { useState, useEffect } from "react";
import MapView from "../components/Map";
import SocialFeed from "../components/SocialFeed";
import AlertPanel from "../components/AlertPanel";
import StatsBar from "../components/StatsBar";
import RedditFeed from "../components/RedditFeed";

const DEMO_POSTS = [
  {
    text: "Flood reported in Nagpur, rescue teams deployed",
    city: "Nagpur",
    lat: 21.1458,
    lon: 79.0882,
    urgency: "HIGH",
    disaster_type: "flood",
    time: new Date().toISOString(),
  },
  {
    text: "Earthquake tremors felt in Delhi",
    city: "Delhi",
    lat: 28.6139,
    lon: 77.209,
    urgency: "MEDIUM",
    disaster_type: "earthquake",
    time: new Date().toISOString(),
  },
  {
    text: "Heavy rainfall in Mumbai",
    city: "Mumbai",
    lat: 19.076,
    lon: 72.8777,
    urgency: "LOW",
    disaster_type: "rain",
    time: new Date().toISOString(),
  },
];

export default function LiveMap({ onMapContext, chatOpen }) {
  const [mode, setMode] = useState("DEMO");
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedWeather, setSelectedWeather] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    if (mode === "DEMO") {
      const citiesMap = {};

      DEMO_POSTS.forEach((p) => {
        p.severity = p.urgency; // unify property name
        p.source = "Local Reports";
        if (!citiesMap[p.city]) {
          citiesMap[p.city] = { city: p.city, lat: p.lat, lon: p.lon, total: 0, high_count: 0 };
        }
        citiesMap[p.city].total++;
        if (p.urgency === "HIGH") citiesMap[p.city].high_count++;
      });

      setCities(Object.values(citiesMap));
      setAllPosts(DEMO_POSTS);
      setStats({
        total: DEMO_POSTS.length,
        high: DEMO_POSTS.filter((p) => p.urgency === "HIGH").length,
      });

      setLoading(false);
      return;
    }

    try {
      // Pull unified GDACS & USGS Intelligence layer from the new backend
      const res = await fetch(`http://localhost:8000/api/disasters`);
      if (!res.ok) throw new Error("API failed");
      
      const payload = await res.json();
      const data = payload.data || {};
      const events = data.events || [];

      // Create grouped cities for AlertPanel compatibility
      const citiesMap = {};
      events.forEach((p) => {
        const cityKey = p.city || p.disaster_type;
        if (!citiesMap[cityKey]) {
          citiesMap[cityKey] = { city: cityKey, lat: p.lat, lon: p.lon, total: 0, high_count: 0 };
        }
        citiesMap[cityKey].total++;
        if (p.severity === "HIGH") citiesMap[cityKey].high_count++;
      });

      setCities(Object.values(citiesMap));
      setAllPosts(events);
      setStats({
        total: data.total || events.length,
        high: data.high_priority || events.filter(e => e.severity === "HIGH").length,
      });
    } catch (err) {
      console.error(err);
      setCities([]);
      setAllPosts([]);
      setStats(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData(date);
  }, [date, mode]);

  const handleCityClick = async (city) => {
    setSelectedCity(city);
    setFilter("ALL");
    setSelectedWeather(null);
    try {
      const res = await fetch(`http://localhost:8000/api/weather?city=${city.city}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWeather(data);
      }
    } catch (err) {
      console.error("Weather fetch error", err);
    }
  };

  useEffect(() => {
    onMapContext?.({ selectedCity, selectedWeather });
  }, [selectedCity, selectedWeather, onMapContext]);

  const visiblePosts = allPosts.filter((p) => {
    const matchCity = selectedCity ? p.city === selectedCity.city : true;
    const matchFilter = filter === "ALL" ? true : p.urgency === filter;
    return matchCity && matchFilter;
  });

  return (
    <div
      className="app-shell flex !h-[calc(100vh-3.5rem)] min-h-0 w-full flex-col overflow-hidden bg-[var(--bg-base)]"
    >
      {/* Cleaner, non-duplicated header bar fitting smoothly below Astra main navbar */}
      <div className="flex items-center justify-between w-full p-3 bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode(mode === "DEMO" ? "LIVE" : "DEMO")}
            className={
              mode === "DEMO"
                ? "rounded-lg bg-teal-500/20 px-5 py-2 text-sm font-bold text-teal-300 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:bg-teal-500/30 transition-all"
                : "rounded-lg bg-red-500/20 px-5 py-2 text-sm font-bold text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/30 transition-all animate-pulse"
            }
          >
            {mode === "DEMO" ? "Switch to 🔴 LIVE DATA" : "Switch to 🧪 DEMO MODE"}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <StatsBar stats={stats} />
        </div>
      </div>

      <AlertPanel cities={cities} />

      <main
        className={[
          "main-layout min-h-0 flex-1 transition-[margin] duration-300 ease-out",
          chatOpen ? "lg:mr-80" : "",
        ].join(" ")}
      >
        <div className="map-pane relative h-[42vh] border-b border-[var(--border)] lg:h-auto lg:min-h-0 lg:border-b-0 lg:border-r">
          <MapView
            events={allPosts}  // Passing the single source of truth down to the Map directly
            selectedCity={selectedCity}
            selectedWeather={selectedWeather}
            onCityClick={handleCityClick}
          />
        </div>

        <div className="feed-pane max-h-[52vh] lg:max-h-none">
          <div className="flex min-h-0 flex-[2] flex-col overflow-hidden border-b border-[var(--border)]">
            <SocialFeed
              city={selectedCity}
              posts={visiblePosts}
              loading={loading}
              filter={filter}
              onFilter={setFilter}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-[var(--border)]">
            <RedditFeed
              query={
                selectedCity ? `${selectedCity.city} disaster` : "disaster"
              }
            />
          </div>

          {selectedWeather && (
            <div
              className="shrink-0 border-t border-[var(--border)] p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderTopColor: "var(--border)",
              }}
            >
              <h3 className="mb-2 text-sm font-bold text-white">
                🌤️ Weather — {selectedWeather.city}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Temp</span>{" "}
                  {selectedWeather.temp}°C
                </div>
                <div>
                  <span className="text-slate-500">Condition</span>{" "}
                  {selectedWeather.condition}
                </div>
                <div>
                  <span className="text-slate-500">Humidity</span>{" "}
                  {selectedWeather.humidity}%
                </div>
                <div>
                  <span className="text-slate-500">Wind</span>{" "}
                  {selectedWeather.wind} m/s
                </div>
                <div
                  className="col-span-2 font-medium"
                  style={{
                    color:
                      selectedWeather.risk_level === "HIGH"
                        ? "#ef4444"
                        : selectedWeather.risk_level === "MEDIUM"
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                >
                  Risk: {selectedWeather.risk_level}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
