def normalize_events(gdacs_events, usgs_events):
    """
    Merging multi-source data into a unified structure.
    """
    unified = []
    
    for e in gdacs_events:
        unified.append({
            "city": e.get("city", "Unknown Location"),
            "lat": float(e.get("lat", 0)),
            "lon": float(e.get("lon", 0)),
            "disaster_type": str(e.get("disaster_type", "Unknown")),
            "source": str(e.get("source", "GDACS")),
            "severity": str(e.get("severity", "LOW")),
            "time": str(e.get("time", ""))
        })
        
    for e in usgs_events:
        unified.append({
            "city": e.get("city", "Unknown Location"),
            "lat": float(e.get("lat", 0)),
            "lon": float(e.get("lon", 0)),
            "disaster_type": str(e.get("disaster_type", "Earthquake")),
            "source": str(e.get("source", "USGS")),
            "severity": str(e.get("severity", "LOW")),
            "time": str(e.get("time", "")),
            "magnitude": e.get("magnitude")
        })

    return unified


def enhance_severity(events, weather_data=None):
    """
    Intelligence layer:
    - rain + flood -> HIGH
    - multiple sources same location -> HIGH
    - earthquake > 5 -> HIGH (already handled in USGS service, but enforcing it here)
    """
    enhanced = []
    
    # Simple location clustering (group by rough coordinate proximity)
    # Using 1 degree (~111km) as a rough cluster radius for "multiple sources same location"
    clusters = {}
    for ev in events:
        cluster_key = f"{round(ev['lat'], 0)}_{round(ev['lon'], 0)}"
        clusters[cluster_key] = clusters.get(cluster_key, 0) + 1
        
    for ev in events:
        sev = ev["severity"]
        dtype = str(ev.get("disaster_type", "")).lower()
        cluster_key = f"{round(ev['lat'], 0)}_{round(ev['lon'], 0)}"
        
        # Rule: multiple sources same location -> HIGH
        if clusters[cluster_key] > 1 and sev == "MEDIUM":
            sev = "HIGH"
            
        # Rule: earthquake > 5 -> HIGH (Usually captured, but fallback)
        if "earthquake" in dtype and ev.get("magnitude", 0) > 5.0:
            sev = "HIGH"
            
        # If we had weather data precisely for this event's lat/lon, we could do:
        # "rain + flood -> HIGH". We will simulate it if `weather_data` dict maps to cities.
        if weather_data and ev["city"] in weather_data:
            w_info = weather_data[ev["city"]]
            if w_info.get("rain", False) and "flood" in dtype:
                sev = "HIGH"
                
        ev["severity"] = sev
        enhanced.append(ev)
        
    return enhanced
