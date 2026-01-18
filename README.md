# Kerala Weather Prediction System

A modern, highly accurate weather prediction web application tailored for the 14 districts of Kerala. Built with Flask and Open-Meteo API.

## 🌟 Features
-   **Live Weather**: Real-time temperature, humidity, wind, and conditions.
-   **5-Hour Forecast**: Interactive graph predicting weather for the upcoming hours.
-   **District Search**: Smart search with auto-suggestions for all 14 Kerala districts.
-   **Search History**: Tracks your recent searches locally.
-   **Light & Vibrant Theme**: A refreshing, professional UI designed for clarity and aesthetics.

## 🚀 How to Run Locally

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/greatjagan755-crypto/Kerala-Weather-predictor-.git
    cd Kerala-Weather-predictor-
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Application**
    ```bash
    python app.py
    ```

4.  **Access in Browser**
    Open `http://127.0.0.1:5000/` in your web browser.

## ☁️ How to Deploy (Free)

This application is ready for cloud deployment on platforms like [Render](https://render.com/) or [Railway](https://railway.app/).

1.  **Sign up** for Render/Railway.
2.  **Connect your GitHub** account.
3.  Select this repository.
4.  The platform will automatically detect the `Procfile` and `requirements.txt` and deploy your app.
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `gunicorn app:app`

## 🛠️ Tech Stack
-   **Frontend**: HTML5, CSS3, JavaScript (Chart.js)
-   **Backend**: Python (Flask)
-   **Database**: SQLite (Local history)
-   **API**: Open-Meteo (Weather Data)
