import requests
import os

def fetch_weather(city: str):
    """
    Fetches real-time weather conditions for a given city from OpenWeather.
    """
    OPENWEATHER_API_KEY = os.getenv("OpenWeather_API_KEY")
    if not OPENWEATHER_API_KEY:
        return None

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        condition = data['weather'][0]['main'].lower()
        is_rain = condition in ["rain", "drizzle", "thunderstorm"]

        return {
            "temp": data['main']['temp'],
            "condition": condition,
            "rain": is_rain
        }
    except Exception as e:
        print(f"⚠️ Weather Fetch Error ({city}): {e}")
        return None
