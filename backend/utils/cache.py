import time

_cache = {}

def get_cached(key: str, max_age: int = 300):
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["time"] < max_age:
            return entry["data"]
    return None

def set_cache(key: str, data):
    _cache[key] = {"data": data, "time": time.time()}
