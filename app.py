from flask import Flask, render_template, request, jsonify
import requests
import database

app = Flask(__name__)

# Initialize database
database.init_db()

# District Coordinates (Lat, Long)
DISTRICTS = {
    "Thiruvananthapuram": (8.5241, 76.9366),
    "Kollam": (8.8932, 76.6141),
    "Pathanamthitta": (9.2648, 76.7870),
    "Alappuzha": (9.4981, 76.3388),
    "Kottayam": (9.5916, 76.5222),
    "Idukki": (9.8497, 76.9744),
    "Ernakulam": (9.9816, 76.2999),
    "Thrissur": (10.5276, 76.2144),
    "Palakkad": (10.7867, 76.6548),
    "Malappuram": (11.0510, 76.0711),
    "Kozhikode": (11.2588, 75.7804),
    "Wayanad": (11.6854, 76.1320),
    "Kannur": (11.8745, 75.3704),
    "Kasaragod": (12.5102, 74.9852)
}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/result')
def result():
    return render_template('result.html')

@app.route('/api/districts')
def get_districts():
    return jsonify(list(DISTRICTS.keys()))

@app.route('/api/weather')
def get_weather():
    district = request.args.get('district')
    if not district or district not in DISTRICTS:
        return jsonify({'error': 'Invalid district'}), 400
    
    lat, lon = DISTRICTS[district]
    
    # Updated Fetch from Open-Meteo with more parameters
    # forecast_days=2 ensures we don't run out of data if the user checks late in the day
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code,precipitation_probability,apparent_temperature,cloud_cover,visibility&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover&forecast_days=2&timezone=auto"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() # Raise error for bad status codes
        data = response.json()
        
        current = data.get('current', {})
        hourly = data.get('hourly', {})
        
        # Process current weather
        weather_info = {
            'temperature': current.get('temperature_2m'),
            'feels_like': current.get('apparent_temperature'),
            'humidity': current.get('relative_humidity_2m'),
            'pressure': current.get('surface_pressure'),
            'wind_speed': current.get('wind_speed_10m'),
            'rain_prob': current.get('precipitation_probability'),
            'cloud_cover': current.get('cloud_cover'),
            'visibility': current.get('visibility'),
            'condition_code': current.get('weather_code'),
        }
        
        # Process forecast (next 5 hours)
        forecast = []
        import datetime
        now_hour = datetime.datetime.now().hour
        
        # Extract hourly lists
        h_time = hourly.get('time', [])
        h_temp = hourly.get('temperature_2m', [])
        h_hum = hourly.get('relative_humidity_2m', [])
        h_wind = hourly.get('wind_speed_10m', [])
        h_cloud = hourly.get('cloud_cover', [])
        
        # Get next 5 hours indices
        # If now_hour is 23, start_idx is 24, which is fine because we have 48 hours of data now
        start_idx = now_hour + 1
        end_idx = start_idx + 5
        
        # Slice
        f_time = h_time[start_idx:end_idx]
        f_temp = h_temp[start_idx:end_idx]
        f_hum = h_hum[start_idx:end_idx]
        f_wind = h_wind[start_idx:end_idx]
        f_cloud = h_cloud[start_idx:end_idx]
        
        forecast = [{
            'time': t, 
            'temp': temp,
            'humidity': hum,
            'wind': wind,
            'clouds': cld
        } for t, temp, hum, wind, cld in zip(f_time, f_temp, f_hum, f_wind, f_cloud)]
        
        # Save to history
        # Simple condition mapping for DB text
        condition_text = f"Code: {weather_info['condition_code']}" 
        database.add_search(district, weather_info['temperature'], condition_text)
        
        return jsonify({
            'current': weather_info,
            'forecast': forecast,
            'district': district
        })

    except Exception as e:
        print(f"Server Error: {e}") # Log to terminal
        return jsonify({'error': str(e)}), 500

@app.route('/api/history')
def get_history_route():
    return jsonify(database.get_history())

if __name__ == '__main__':
    app.run(debug=True)
