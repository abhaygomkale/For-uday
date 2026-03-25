import requests
from datetime import datetime

def fetch_usgs():
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        events = []
        for feature in data.get("features", []):
            mag = feature.get("properties", {}).get("mag")
            if mag is None:
                continue

            coords = feature.get("geometry", {}).get("coordinates", [0, 0])
            lon, lat = coords[0], coords[1]
            place = feature.get("properties", {}).get("place", "Unknown")
            time_ms = feature.get("properties", {}).get("time")

            # Magnitude rules:
            # mag > 5 → HIGH, mag 3–5 → MEDIUM, else → LOW
            severity = "LOW"
            if mag > 5:
                severity = "HIGH"
            elif mag >= 3:
                severity = "MEDIUM"

            # Skip LOW severity for noise reduction unless requested
            if severity == "LOW":
                continue

            dt_obj = datetime.fromtimestamp(time_ms / 1000) if time_ms else datetime.now()

            events.append({
                "city": place,
                "lat": lat,
                "lon": lon,
                "disaster_type": "Earthquake",
                "source": "USGS",
                "severity": severity,
                "time": dt_obj.isoformat()
            })
        return events
    except Exception as e:
        print(f"⚠️ USGS Fetch Error: {e}")
        return []
