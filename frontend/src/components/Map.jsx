import { useEffect, useRef } from "react";

export default function MapView({ events, selectedCity, selectedWeather, onCityClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // 🔥 INIT MAP
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const L = window.L;
    if (!L) {
      console.error("Leaflet not loaded");
      return;
    }

    const map = L.map(containerRef.current, {
      center: [22.5, 80.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control
      .attribution({
        prefix: "© OpenStreetMap © CARTO",
        position: "bottomleft",
      })
      .addTo(map);

    mapRef.current = map;
  }, []);

  // 🔥 UPDATE MARKERS
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;

    if (!L || !map) return;

    // Clear markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 🔥 IF NO DATA → RESET VIEW
    if (!events || events.length === 0) {
      map.setView([22.5, 80.5], 5);
      return;
    }

    events.forEach((ev) => {
      const isSel = selectedCity?.city === ev.city;

      let glowClass = "";
      if (isSel && selectedWeather) {
        if (selectedWeather.condition === "Rain" || selectedWeather.condition === "Drizzle") glowClass = "glow-blue";
        if (selectedWeather.temp > 35) glowClass = "glow-red";
        if (selectedWeather.condition === "Thunderstorm" || selectedWeather.condition === "Squall") glowClass = "glow-blink";
      }

      const color =
        ev.severity === "HIGH"
          ? "#ef4444" // red
          : ev.severity === "MEDIUM"
          ? "#f59e0b" // yellow
          : "#22c55e"; // green

      const sourceIcon = ev.source === "USGS" ? "🌋" : "📡";

      const icon = L.divIcon({
        html: `
          <div class="mk ${isSel ? "sel" : ""} ${glowClass}">
            <div class="mk-ring" style="border-color:${color}"></div>
            <div class="mk-dot" style="background:${color}"></div>
            <span class="mk-lbl" style="display:flex; align-items:center; gap:4px;">
              <span>${sourceIcon}</span>
              ${ev.city || ev.disaster_type}
            </span>
          </div>
        `,
        className: "",
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      });

      const marker = L.marker([ev.lat, ev.lon], { icon }).addTo(map);

      marker.on("click", () => {
        if (onCityClick) onCityClick(ev);

        // 🔥 AUTO ZOOM ON CLICK
        map.setView([ev.lat, ev.lon], 7);
      });

      markersRef.current.push(marker);
    });
  }, [events, selectedCity, selectedWeather, onCityClick]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* 🔥 EMPTY STATE MESSAGE */}
      {(!events || events.length === 0) && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            padding: "10px 16px",
            borderRadius: "8px",
            color: "#fff",
            zIndex: 1000,
          }}
        >
          Loading global disaster data...
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}