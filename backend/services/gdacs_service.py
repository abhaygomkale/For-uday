import requests
from datetime import datetime

def fetch_gdacs():
    """
    Fetches real-time disaster alerts from GDACS API (GeoJSON endpoint).
    Returns entries in the same format as the rest of your pipeline.
    """
    try:
        url = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/GeoJson"
        params = {
            "alertlevel": "Orange,Red",
            "eventlist":  "EQ,TC,FL,VO,DR,WF",   # all major types
            "fromDate":   "2025-01-01",
            "toDate":     datetime.now().strftime("%Y-%m-%d"),
        }
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, params=params, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()

        items = data.get("features", []) if isinstance(data, dict) else []

        # Map GDACS event codes → readable names
        TYPE_MAP = {
            "EQ": "earthquake", "TC": "cyclone",  "FL": "flood",
            "VO": "volcano",    "DR": "drought",  "WF": "fire",
        }

        events = []
        for item in items:
            props  = item.get("properties", {})
            geom   = item.get("geometry",   {})
            coords = geom.get("coordinates", [])

            # ✅ Safe coordinate extraction
            lon = float(props.get("lon", coords[0] if len(coords) > 0 else 0))
            lat = float(props.get("lat", coords[1] if len(coords) > 1 else 0))

            # Skip entries with no real coordinates
            if lat == 0 and lon == 0:
                continue

            alert        = str(props.get("alertlevel", "Green")).upper()
            event_code   = props.get("eventtype", "")
            country      = props.get("country", "Unknown")
            title        = props.get("eventname", props.get("htmldescription", ""))
            time_val     = props.get("fromdate", datetime.now().isoformat())
            disaster_type = TYPE_MAP.get(event_code, event_code.lower() or "general")

            # ✅ Match urgency key used everywhere in main.py
            urgency = "LOW"
            if "RED"    in alert: urgency = "HIGH"
            elif "ORANGE" in alert: urgency = "MEDIUM"

            # Skip LOW noise
            if urgency == "LOW":
                continue

            # ✅ Build text field for frontend cards
            text = f"{disaster_type} alert in {country}. {title}".strip(". ").lower()

            events.append({
                "text":          text[:300],
                "original_text": text[:300],
                "city":          country,
                "lat":           lat,
                "lon":           lon,
                "disaster_type": disaster_type,
                "urgency":       urgency,      # ✅ NOT "severity"
                "confidence":    0.95,         # GDACS is official — high confidence
                "source":        "GDACS:Official",
                "time":          str(time_val),
            })

        print(f"   ✅ {len(events)} events from GDACS")
        return events

    except Exception as e:
        print(f"⚠️ GDACS Fetch Error: {e}")
        return []