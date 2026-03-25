from fastapi import APIRouter, BackgroundTasks
from services.gdacs_service import fetch_gdacs
from services.usgs_service import fetch_usgs
from services.weather_service import fetch_weather
from utils.cache import get_cached, set_cache
from utils.normalizer import normalize_events, enhance_severity
import asyncio

router = APIRouter()

@router.get("/api/disasters")
async def get_disasters():
    """
    Unified multi-source intelligence API.
    """
    cache_key = "disasters_feed"
    cached = get_cached(cache_key, max_age=300)
    if cached:
        return {"status": "success", "cached": True, "data": cached}

    # Fetch sources asynchronously
    try:
        # Run both external APIs concurrently using asyncio to speed up response
        usgs_future = asyncio.to_thread(fetch_usgs)
        gdacs_future = asyncio.to_thread(fetch_gdacs)
        
        usgs_events, gdacs_events = await asyncio.gather(usgs_future, gdacs_future)
    except Exception as e:
        print(f"⚠️ Error fetching upstream APIs concurrently: {e}")
        # Fallbacks in case gather fails (though inner services handle their own exceptions)
        usgs_events = fetch_usgs()
        gdacs_events = fetch_gdacs()

    # Step 3: Normalize
    unified_events = normalize_events(gdacs_events, usgs_events)
    
    # Step 4: Enhance Severity (Intelligence layer)
    # We could theoretically fetch weather for all cities, but to save API calls
    # we'll just apply the clustering logic for now unless city weather is specifically requested.
    enhanced_events = enhance_severity(unified_events, weather_data={})

    # Sort so HIGH severity comes first
    def severity_weight(sev):
        if sev == "HIGH": return 3
        if sev == "MEDIUM": return 2
        return 1

    enhanced_events.sort(key=lambda x: severity_weight(x["severity"]), reverse=True)

    result = {
        "total": len(enhanced_events),
        "high_priority": len([e for e in enhanced_events if e["severity"] == "HIGH"]),
        "sources": ["USGS", "GDACS"],
        "events": enhanced_events
    }

    # Save to cache
    set_cache(cache_key, result)

    return {"status": "success", "cached": False, "data": result}
