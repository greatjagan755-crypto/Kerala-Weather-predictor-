document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // --- Common Offline Handling ---
    const offlineMsg = document.getElementById('offline-msg');
    function updateOnlineStatus() {
        if (!offlineMsg) return;
        if (navigator.onLine) offlineMsg.classList.add('hidden');
        else offlineMsg.classList.remove('hidden');
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // --- HOME PAGE LOGIC ---
    if (path === '/' || path.includes('home')) {
        const districtInput = document.getElementById('district-input');
        const suggestionsBox = document.getElementById('suggestions-box');
        const viewBtn = document.getElementById('view-btn');
        let districts = [];

        // 1. Fetch Districts
        fetch('/api/districts')
            .then(res => res.json())
            .then(data => {
                districts = data;
            });

        // 2. Input Event (Auto-suggestion)
        if (districtInput) {
            districtInput.addEventListener('input', function () {
                const query = this.value.trim().toLowerCase();
                suggestionsBox.innerHTML = ''; // Clear previous

                if (query.length === 0) {
                    suggestionsBox.classList.add('hidden');
                    return;
                }

                const matches = districts.filter(d => d.toLowerCase().includes(query));

                if (matches.length > 0) {
                    suggestionsBox.classList.remove('hidden');
                    matches.forEach(match => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';

                        // Highlight Logic
                        const regex = new RegExp(`(${query})`, 'gi');
                        const highlightedName = match.replace(regex, '<span class="match-highlight">$1</span>');

                        div.innerHTML = highlightedName;
                        div.addEventListener('click', () => {
                            districtInput.value = match;
                            suggestionsBox.classList.add('hidden');
                        });
                        suggestionsBox.appendChild(div);
                    });
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            });

            // Close suggestions on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.input-wrapper')) {
                    suggestionsBox.classList.add('hidden');
                }
            });

            // Allow Enter key
            districtInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }

        // 3. View Button Action
        viewBtn.addEventListener('click', handleSearch);

        function handleSearch() {
            const val = districtInput.value.trim();
            // Validate against list (case insensitive check)
            const valid = districts.find(d => d.toLowerCase() === val.toLowerCase());

            if (valid) {
                window.location.href = `/result?district=${valid}`;
            } else {
                alert("Please select a valid district from the suggestions.");
            }
        }
    }

    // --- RESULT PAGE LOGIC (DASHBOARD) ---
    else if (path.includes('/result')) {
        const urlParams = new URLSearchParams(window.location.search);
        const district = urlParams.get('district');

        if (!district) {
            window.location.href = '/';
            return;
        }

        document.getElementById('city-name').textContent = district;

        // Fetch Data
        if (navigator.onLine) fetchData(district);
        else alert("Offline Mode");

        // History
        loadHistory();

        function fetchData(dist) {
            fetch(`/api/weather?district=${dist}`)
                .then(res => res.json())
                .then(data => {
                    updateDashboard(data);
                    loadHistory();
                })
                .catch(err => {
                    console.error("Fetch Error:", err);
                    alert("Failed to connect to the server. Please check your internet connection.");
                });
        }

        function updateDashboard(data) {
            const current = data.current;

            // Text Updates
            document.getElementById('date-time').textContent = new Date().toLocaleString('en-IN', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
            document.getElementById('temperature').textContent = Math.round(current.temperature);
            document.getElementById('feels-like').textContent = Math.round(current.feels_like);
            document.getElementById('condition-text').textContent = getWeatherDescription(current.condition_code);

            // Metrics
            document.getElementById('wind').innerHTML = `${current.wind_speed} <small>km/h</small>`;
            document.getElementById('humidity').innerHTML = `${current.humidity} <small>%</small>`;
            document.getElementById('pressure').innerHTML = `${current.pressure} <small>hPa</small>`;
            document.getElementById('rain-prob').innerHTML = `${current.rain_prob || 0} <small>%</small>`;
            document.getElementById('cloud-cover').innerHTML = `${current.cloud_cover} <small>%</small>`;
            document.getElementById('visibility').innerHTML = `${current.visibility} <small>m</small>`;

            // Icon
            updateIcon(current.condition_code);

            // Chart
            initChart(data.forecast);
        }

        // --- CHART LOGIC ---
        let chartInstance = null;
        let forecastDataCache = [];

        function initChart(forecastData) {
            forecastDataCache = forecastData;
            renderChart('temp'); // Default

            // Listeners for tabs
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // UI Update
                    document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');

                    // Render
                    renderChart(e.target.dataset.type);
                });
            });
        }

        function renderChart(type) {
            const ctx = document.getElementById('forecastChart');
            if (!ctx) return;

            const labels = forecastDataCache.map(d => {
                const date = new Date(d.time);
                const hrs = date.getHours();
                const ampm = hrs >= 12 ? 'PM' : 'AM';
                const formattedHrs = hrs % 12 || 12;
                return `${formattedHrs} ${ampm}`;
            });

            // Map data based on type
            let datasetData = [];
            let label = '';
            let color = '';

            switch (type) {
                case 'temp':
                    datasetData = forecastDataCache.map(d => d.temp);
                    label = 'Temperature (°C)';
                    color = '#3b82f6'; // Blue
                    break;
                case 'humidity':
                    datasetData = forecastDataCache.map(d => d.humidity);
                    label = 'Humidity (%)';
                    color = '#10b981'; // Green
                    break;
                case 'wind':
                    datasetData = forecastDataCache.map(d => d.wind);
                    label = 'Wind (km/h)';
                    color = '#f59e0b'; // Amber
                    break;
                case 'clouds':
                    datasetData = forecastDataCache.map(d => d.clouds);
                    label = 'Clouds (%)';
                    color = '#6366f1'; // Indigo
                    break;
            }

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: datasetData,
                        borderColor: color,
                        backgroundColor: color + '33', // 20% opacity hex
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointRadius: 4,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#1e293b',
                            bodyColor: '#475569',
                            borderColor: 'rgba(0,0,0,0.05)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false,
                            bodyFont: { size: 14, family: "'Outfit', sans-serif" },
                            titleFont: { size: 14, family: "'Outfit', sans-serif", weight: 'bold' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#64748b',
                                font: { family: "'Outfit', sans-serif" }
                            }
                        },
                        y: {
                            grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] },
                            ticks: {
                                color: '#64748b',
                                font: { family: "'Outfit', sans-serif" },
                                beginAtZero: false
                            },
                            border: { display: false }
                        }
                    }
                }
            });
        }

        function loadHistory() {
            const list = document.getElementById('history-list');
            if (!list) return;
            fetch('/api/history')
                .then(res => res.json())
                .then(data => {
                    list.innerHTML = '';
                    data.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'history-item';
                        // Click to reload
                        li.onclick = () => window.location.href = `/result?district=${item.district}`;
                        li.innerHTML = `
                            <span class="h-city">${item.district}</span>
                            <span class="h-temp">${Math.round(item.temperature)}°</span>
                        `;
                        list.appendChild(li);
                    });
                });
        }
    }

    // --- Helpers ---
    function getWeatherDescription(code) {
        const codes = {
            0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Rim Fog',
            51: 'Light Drizzle', 53: 'Drizzle', 55: 'Dense Drizzle',
            61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
            80: 'Showers', 81: 'Heavy Showers', 95: 'Thunderstorm'
        };
        return codes[code] || 'Unknown';
    }

    function updateIcon(code) {
        const iconElement = document.getElementById('weather-icon');
        iconElement.className = 'fas';
        let iconClass = 'fa-cloud';

        if (code === 0) iconClass = 'fa-sun';
        else if (code >= 1 && code <= 3) iconClass = 'fa-cloud-sun';
        else if (code >= 51 && code <= 65) iconClass = 'fa-cloud-rain';
        else if (code >= 80) iconClass = 'fa-cloud-showers-heavy';
        else if (code >= 95) iconClass = 'fa-bolt';

        iconElement.classList.add(iconClass);
        if (code === 0) { iconElement.style.color = '#f59e0b'; iconElement.classList.add('fa-spin-slow'); }
        else iconElement.style.color = '#fff';
    }
});
