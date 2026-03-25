"""
🌐 CrisisLens — Real Data Fetcher
Sources:
  1. GDACS   — Official UN disaster alerts (Floods, Cyclones, Earthquakes, Volcanoes)
  2. USGS    — Real-time earthquakes (free, no auth)
  3. NASA    — Active wildfires via EONET (free, no auth)
  4. RSS     — NDTV, BBC, The Hindu disaster news (free, no auth)

Run standalone: python real_data_fetcher.py
"""

import json
import re
import time
import requests
import urllib.request
import urllib.parse
from datetime import datetime
from xml.etree import ElementTree as ET

DATA_FILE  = "data.json"
STATS_FILE = "stats.json"

# ── City lookup for Indian cities (used by RSS) ───────────────────────────────
CITY_COORDINATES = {
    "mumbai":       {"lat": 19.0760, "lon": 72.8777, "display": "Mumbai"},
    "delhi":        {"lat": 28.6139, "lon": 77.2090, "display": "Delhi"},
    "pune":         {"lat": 18.5204, "lon": 73.8567, "display": "Pune"},
    "chennai":      {"lat": 13.0827, "lon": 80.2707, "display": "Chennai"},
    "kolkata":      {"lat": 22.5726, "lon": 88.3639, "display": "Kolkata"},
    "hyderabad":    {"lat": 17.3850, "lon": 78.4867, "display": "Hyderabad"},
    "bangalore":    {"lat": 12.9716, "lon": 77.5946, "display": "Bangalore"},
    "nagpur":       {"lat": 21.1458, "lon": 79.0882, "display": "Nagpur"},
    "ahmedabad":    {"lat": 23.0225, "lon": 72.5714, "display": "Ahmedabad"},
    "jaipur":       {"lat": 26.9124, "lon": 75.7873, "display": "Jaipur"},
    "lucknow":      {"lat": 26.8467, "lon": 80.9462, "display": "Lucknow"},
    "bhopal":       {"lat": 23.2599, "lon": 77.4126, "display": "Bhopal"},
    "patna":        {"lat": 25.5941, "lon": 85.1376, "display": "Patna"},
    "guwahati":     {"lat": 26.1445, "lon": 91.7362, "display": "Guwahati"},
    "surat":        {"lat": 21.1702, "lon": 72.8311, "display": "Surat"},
    "bhubaneswar":  {"lat": 20.2961, "lon": 85.8245, "display": "Bhubaneswar"},
    "kochi":        {"lat": 9.9312,  "lon": 76.2673, "display": "Kochi"},
    "visakhapatnam":{"lat": 17.6868, "lon": 83.2185, "display": "Visakhapatnam"},
}

DISASTER_KEYWORDS = {
    "flood":      ["flood", "flooding", "waterlog", "submerged", "inundat", "overflowing", "deluge"],
    "earthquake": ["earthquake", "tremor", "seismic", "quake", "aftershock", "magnitude"],
    "cyclone":    ["cyclone", "hurricane", "typhoon", "storm surge", "landfall", "tropical storm"],
    "fire":       ["wildfire", "forest fire", "blaze", "burning", "fire"],
    "landslide":  ["landslide", "mudslide", "rockfall", "debris"],
    "drought":    ["drought", "water shortage", "heat wave"],
    "storm":      ["storm", "thunderstorm", "lightning", "hailstorm", "heavy rain", "cloudburst"],
    "volcano":    ["volcano", "volcanic", "eruption", "lava", "ash cloud"],
}

HIGH_URGENCY   = ["help", "urgent", "trapped", "rescue", "sos", "emergency", "stranded",
                  "casualties", "dead", "missing", "critical", "fatal", "collapse", "danger"]
MEDIUM_URGENCY = ["damage", "alert", "warning", "evacuate", "blocked", "destroyed", "disrupted", "affected"]

GDACS_TYPE_MAP = {
    "EQ": "earthquake", "TC": "cyclone", "FL": "flood",
    "VO": "volcano",    "DR": "drought", "WF": "fire",
    "TS": "storm",
}

# ── Shared helpers ────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    text = text.encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9\s.,!?:'-]", "", text)
    return re.sub(r"\s+", " ", text).strip().lower()

def detect_disaster_type(text: str):
    scores = {}
    for dtype, kws in DISASTER_KEYWORDS.items():
        hits = sum(1 for kw in kws if kw in text)
        if hits:
            scores[dtype] = hits
    if not scores:
        return "general", 0.3
    best = max(scores, key=scores.get)
    return best, min(round(scores[best] * 0.25, 2), 1.0)

def detect_urgency(text: str) -> str:
    if any(kw in text for kw in HIGH_URGENCY):   return "HIGH"
    if any(kw in text for kw in MEDIUM_URGENCY): return "MEDIUM"
    return "LOW"

def detect_location(text: str):
    for key, data in CITY_COORDINATES.items():
        if key in text or data["display"].lower() in text:
            return data["display"], data["lat"], data["lon"]
    return "India", 20.5937, 78.9629

def is_disaster_related(text: str) -> bool:
    all_kw = [kw for kws in DISASTER_KEYWORDS.values() for kw in kws]
    return any(kw in text.lower() for kw in all_kw + HIGH_URGENCY + MEDIUM_URGENCY)

def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

def today_str() -> str:
    return datetime.now().strftime("%Y-%m-%d")

# ── SOURCE 1: GDACS ───────────────────────────────────────────────────────────

GDACS_URLS = [
    # Try these in order until one works
    "https://www.gdacs.org/xml/rss.xml",                                    # RSS feed (most reliable)
    "https://www.gdacs.org/gdacsapi/api/events/geteventlist/GeoJson",       # GeoJSON API
    "https://www.gdacs.org/gdacsapi/api/events/geteventlist/json",          # JSON API fallback
]

def _parse_gdacs_geojson(data):
    """Parse GeoJSON response from GDACS API."""
    events = []
    for item in data.get("features", []):
        props  = item.get("properties", {})
        coords = item.get("geometry", {}).get("coordinates", [])

        lon = float(props.get("lon", coords[0] if len(coords) > 0 else 0))
        lat = float(props.get("lat", coords[1] if len(coords) > 1 else 0))
        if lat == 0 and lon == 0:
            continue

        alert         = str(props.get("alertlevel", "Green")).upper()
        event_code    = props.get("eventtype", "")
        country       = props.get("country", "Unknown")
        title         = props.get("eventname", "") or ""
        disaster_type = GDACS_TYPE_MAP.get(event_code, event_code.lower() or "general")
        urgency       = "HIGH" if "RED" in alert else "MEDIUM" if "ORANGE" in alert else "LOW"

        if urgency == "LOW":
            continue

        raw_text = f"{disaster_type} alert in {country}. {clean_text(title)}"
        events.append({
            "text": raw_text[:300], "original_text": raw_text[:300],
            "city": country, "lat": lat, "lon": lon,
            "urgency": urgency, "disaster_type": disaster_type,
            "confidence": 0.95, "source": "GDACS:Official",
            "date": today_str(), "time": now_str(),
        })
    return events

def _parse_gdacs_rss(xml_text):
    """Parse RSS feed from GDACS (most reliable endpoint)."""
    events = []
    try:
        root = ET.fromstring(xml_text)
        ns   = {"georss": "http://www.georss.org/georss"}

        for item in root.findall(".//item"):
            title   = item.findtext("title", "") or ""
            desc    = item.findtext("description", "") or ""
            point   = item.findtext("georss:point", namespaces=ns) or ""

            lat, lon = 0.0, 0.0
            if point:
                try:
                    parts = point.strip().split()
                    lat, lon = float(parts[0]), float(parts[1])
                except:
                    pass
            if lat == 0 and lon == 0:
                continue

            combined = f"{title} {desc}".lower()
            dtype, _ = detect_disaster_type(combined)

            # GDACS RSS uses color in title e.g. "Red: Earthquake"
            urgency = "HIGH"   if "red"    in combined[:50] else \
                      "MEDIUM" if "orange" in combined[:50] else "LOW"
            if urgency == "LOW":
                continue

            raw_text = clean_text(f"{title}. {desc}")
            country  = title.split("-")[-1].strip() if "-" in title else "Global"

            events.append({
                "text": raw_text[:300], "original_text": f"{title}. {desc}"[:300],
                "city": country, "lat": lat, "lon": lon,
                "urgency": urgency, "disaster_type": dtype,
                "confidence": 0.95, "source": "GDACS:Official",
                "date": today_str(), "time": now_str(),
            })
    except ET.ParseError as e:
        print(f"      ⚠️  GDACS RSS parse error: {e}")
    return events

def fetch_gdacs():
    print("   🌍 Fetching GDACS...")
    headers = {"User-Agent": "Mozilla/5.0 CrisisLens/1.0"}

    # Try RSS first (most reliable, no params needed)
    try:
        res = requests.get(GDACS_URLS[0], headers=headers, timeout=10)
        res.raise_for_status()
        events = _parse_gdacs_rss(res.text)
        if events:
            print(f"      ✅ {len(events)} events from GDACS RSS")
            return events
    except Exception as e:
        print(f"      ⚠️  GDACS RSS failed: {e}")

    # Fallback: try GeoJSON API
    for url in GDACS_URLS[1:]:
        try:
            params = {"alertlevel": "Orange,Red", "eventlist": "EQ,TC,FL,VO,DR,WF"}
            res = requests.get(url, params=params, headers=headers, timeout=10)
            res.raise_for_status()
            data = res.json()
            events = _parse_gdacs_geojson(data if isinstance(data, dict) else {"features": data})
            if events:
                print(f"      ✅ {len(events)} events from GDACS API ({url.split('/')[-1]})")
                return events
        except Exception as e:
            print(f"      ⚠️  GDACS API fallback failed ({url.split('/')[-1]}): {e}")

    print("      ℹ️  GDACS: all endpoints failed, skipping")
    return []

# ── SOURCE 2: USGS Earthquakes ────────────────────────────────────────────────

def fetch_usgs_earthquakes():
    print("   🌋 Fetching USGS earthquakes...")
    events = []
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
        res = requests.get(url, timeout=8)
        res.raise_for_status()
        features = res.json().get("features", [])

        for f in features[:20]:
            props  = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [0, 0, 0])
            mag    = props.get("mag") or 0
            place  = props.get("place", "Unknown location")

            if mag < 3.0:   # skip micro quakes
                continue

            lon = float(coords[0]) if len(coords) > 0 else 0
            lat = float(coords[1]) if len(coords) > 1 else 0

            urgency = "HIGH" if mag >= 5.0 else "MEDIUM" if mag >= 3.5 else "LOW"
            text    = f"magnitude {mag} earthquake near {place.lower()}"

            events.append({
                "text":          text[:300],
                "original_text": text[:300],
                "city":          place.split(",")[-1].strip(),
                "lat":           lat,
                "lon":           lon,
                "urgency":       urgency,
                "disaster_type": "earthquake",
                "confidence":    0.98,
                "source":        "USGS:Seismic",
                "date":          today_str(),
                "time":          now_str(),
            })

        print(f"      ✅ {len(events)} earthquakes from USGS")
    except Exception as e:
        print(f"      ⚠️  USGS error: {e}")
    return events

# ── SOURCE 3: NASA EONET Wildfires ────────────────────────────────────────────

NASA_URLS = [
    "https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=20",
    "https://eonet.gsfc.nasa.gov/api/v2.1/events?category=8&status=open&limit=20",
]

def fetch_nasa_wildfires():
    print("   🔥 Fetching NASA EONET wildfires...")
    for url in NASA_URLS:
        try:
            res = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            res.raise_for_status()
            eonet_events = res.json().get("events", [])
            events = []
            for event in eonet_events:
                geom_list = event.get("geometry", [])
                if not geom_list: continue
                coords = geom_list[0].get("coordinates", [0, 0])
                lon = float(coords[0]) if len(coords) > 0 else 0
                lat = float(coords[1]) if len(coords) > 1 else 0
                title = event.get("title", "Active wildfire")
                events.append({
                    "text": f"active wildfire detected: {title.lower()}",
                    "original_text": f"NASA EONET: {title}",
                    "city": "Remote Area", "lat": lat, "lon": lon,
                    "urgency": "HIGH", "disaster_type": "fire",
                    "confidence": 0.90, "source": "NASA:EONET",
                    "date": today_str(), "time": now_str(),
                })
            print(f"      ✅ {len(events)} wildfires from NASA EONET")
            return events
        except requests.exceptions.ConnectTimeout:
            print("      ⚠️  NASA timeout — trying fallback...")
        except Exception as e:
            print(f"      ⚠️  NASA error: {e}")
    print("      ℹ️  NASA EONET unreachable, skipping")
    return []

# ── SOURCE 4: RSS News Feeds ──────────────────────────────────────────────────

RSS_FEEDS = [
    ("NDTV India",  "https://feeds.feedburner.com/ndtvnews-india-news"),
    ("The Hindu",   "https://www.thehindu.com/news/national/feeder/default.rss"),
    ("BBC India",   "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml"),
    ("ReliefWeb",   "https://reliefweb.int/country/ind/rss.xml"),
]

def fetch_rss(name, url):
    entries = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            xml = r.read().decode("utf-8", errors="ignore")

        root  = ET.fromstring(xml)
        items = root.findall(".//item")

        for item in items[:15]:
            title = item.findtext("title", "") or ""
            desc  = item.findtext("description", "") or ""
            pub   = item.findtext("pubDate", "") or ""
            raw   = f"{title}. {desc}"

            if not is_disaster_related(raw):
                continue

            cleaned       = clean_text(raw)
            dtype, conf   = detect_disaster_type(cleaned)
            urgency       = detect_urgency(cleaned)
            city, lat, lon = detect_location(cleaned)

            try:
                t = datetime.strptime(pub[:25], "%a, %d %b %Y %H:%M:%S")
                ts = t.strftime("%Y-%m-%dT%H:%M:%S")
                date_str = t.strftime("%Y-%m-%d")
            except:
                ts = now_str()
                date_str = today_str()

            entries.append({
                "text":          cleaned[:300],
                "original_text": raw[:300],
                "city":          city,
                "lat":           lat,
                "lon":           lon,
                "urgency":       urgency,
                "disaster_type": dtype,
                "confidence":    conf,
                "source":        f"RSS:{name}",
                "date":          date_str,
                "time":          ts,
            })
    except Exception as e:
        print(f"      ⚠️  RSS {name} error: {e}")
    return entries

def fetch_all_rss():
    print("   📰 Fetching RSS feeds...")
    results = []
    for name, url in RSS_FEEDS:
        results.extend(fetch_rss(name, url))
        time.sleep(0.3)
    print(f"      ✅ {len(results)} articles from RSS")
    return results

# ── Deduplication ─────────────────────────────────────────────────────────────

def deduplicate(entries):
    seen, unique = [], []
    for e in entries:
        words = set(e["text"].split()[:10])
        if not any(len(words & set(s.split()[:10])) > 6 for s in seen):
            seen.append(e["text"])
            unique.append(e)
    return unique

# ── Master pipeline ───────────────────────────────────────────────────────────

def run_pipeline():
    print("\n🚨 CrisisLens Pipeline Starting...\n")

    all_entries = []
    all_entries.extend(fetch_gdacs())
    all_entries.extend(fetch_usgs_earthquakes())
    all_entries.extend(fetch_nasa_wildfires())
    all_entries.extend(fetch_all_rss())

    # Deduplicate + sort HIGH → MEDIUM → LOW
    unique = deduplicate(all_entries)
    order  = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    unique.sort(key=lambda x: order.get(x.get("urgency", "LOW"), 2))

    # Save data.json
    with open(DATA_FILE, "w") as f:
        json.dump(unique, f, indent=2)

    # Save stats.json (used by /api/stats)
    stats = {
        "total":       len(unique),
        "high":        sum(1 for e in unique if e.get("urgency") == "HIGH"),
        "medium":      sum(1 for e in unique if e.get("urgency") == "MEDIUM"),
        "low":         sum(1 for e in unique if e.get("urgency") == "LOW"),
        "last_updated": now_str(),
        "sources": {
            "gdacs":  sum(1 for e in unique if "GDACS"  in e.get("source", "")),
            "usgs":   sum(1 for e in unique if "USGS"   in e.get("source", "")),
            "nasa":   sum(1 for e in unique if "NASA"   in e.get("source", "")),
            "rss":    sum(1 for e in unique if "RSS"    in e.get("source", "")),
        },
    }
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)

    print("\n" + "=" * 45)
    print("📈 PIPELINE COMPLETE")
    print("=" * 45)
    print(f"  🔴 HIGH    : {stats['high']}")
    print(f"  🟡 MEDIUM  : {stats['medium']}")
    print(f"  🟢 LOW     : {stats['low']}")
    print(f"  🌍 GDACS   : {stats['sources']['gdacs']}")
    print(f"  🌋 USGS    : {stats['sources']['usgs']}")
    print(f"  🔥 NASA    : {stats['sources']['nasa']}")
    print(f"  📰 RSS     : {stats['sources']['rss']}")
    print("=" * 45)
    print(f"\n✅ {len(unique)} entries saved → {DATA_FILE}")
    return unique


if __name__ == "__main__":
    run_pipeline()