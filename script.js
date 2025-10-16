// Clé API OpenWeatherMap
        const API_KEY = '5f472b7acba333cd8a035ea85a0d4d4c';
        const BASE_URL = 'https://api.openweathermap.org/data/2.5';

        // Données des villes tchadiennes avec coordonnées
        const cities = [
            { id: 1, name: "N'Djamena", lat: 12.1348, lon: 15.0557 },
            { id: 2, name: "Moundou", lat: 8.5667, lon: 16.0833 },
            { id: 3, name: "Sarh", lat: 9.15, lon: 18.3833 },
            { id: 4, name: "Abéché", lat: 13.8292, lon: 20.8322 },
            { id: 5, name: "Arada", lat: 12.948878, lon: 16.704569 },
            { id: 5, name: "Ati", lat: 13.213595, lon: 18.340686 },
            { id: 5, name: "Chari-Baguirmi", lat: 10.974839, lon: 17.271519 },
            { id: 5, name: "Biltine", lat: 14.533006, lon: 20.900617 }
        ];

        // Variables globales
        let map;
        let markers = [];
        let currentLocationMarker = null;

        // Mapping des icônes météo
        const weatherIcons = {
            '01d': 'fa-sun',
            '01n': 'fa-moon',
            '02d': 'fa-cloud-sun',
            '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud',
            '03n': 'fa-cloud',
            '04d': 'fa-cloud',
            '04n': 'fa-cloud',
            '09d': 'fa-cloud-rain',
            '09n': 'fa-cloud-rain',
            '10d': 'fa-cloud-showers-heavy',
            '10n': 'fa-cloud-showers-heavy',
            '11d': 'fa-bolt',
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',
            '50n': 'fa-smog'
        };

        // Initialisation de l'application
        document.addEventListener('DOMContentLoaded', function() {
            // Initialiser la carte
            initMap();
            
            // Générer les boutons de sélection de ville
            const cityList = document.querySelector('.city-list');
            cities.forEach(city => {
                const button = document.createElement('button');
                button.className = 'city-btn';
                button.innerHTML = `<i class="fas fa-city"></i> ${city.name}`;
                button.addEventListener('click', () => selectCity(city));
                cityList.appendChild(button);
            });

            // Gestionnaire pour le bouton de localisation
            document.getElementById('locate-me').addEventListener('click', locateUser);

            // Sélectionner N'Djamena par défaut
            selectCity(cities[0]);
        });

        // Initialiser la carte Leaflet
        function initMap() {
            // Centrer sur le Tchad
            map = L.map('map').setView([12.1348, 15.0557], 6);

            // Ajouter la couche OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Ajouter les marqueurs pour chaque ville
            cities.forEach(city => {
                const marker = L.marker([city.lat, city.lon])
                    .addTo(map)
                    .bindPopup(`<b>${city.name}</b><br>Cliquez pour voir la météo`)
                    .on('click', () => selectCity(city));
                
                markers.push(marker);
            });
        }

        // Mettre à jour la carte pour centrer sur une ville
        function updateMap(lat, lon, cityName) {
            map.setView([lat, lon], 10);
            
            // Animer le marqueur correspondant
            markers.forEach(marker => {
                if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lon) {
                    marker.openPopup();
                }
            });
        }

        // Localiser l'utilisateur
        function locateUser() {
            const locateBtn = document.getElementById('locate-me');
            locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Localisation...';
            locateBtn.disabled = true;

            if (!navigator.geolocation) {
                alert('La géolocalisation n\'est pas supportée par votre navigateur');
                resetLocateButton();
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // Vérifier si l'utilisateur est au Tchad (approximativement)
                    if (lat < 5 || lat > 25 || lon < 10 || lon > 25) {
                        if (!confirm('Vous semblez être en dehors du Tchad. Voulez-vous quand même voir la météo à votre position ?')) {
                            resetLocateButton();
                            return;
                        }
                    }

                    // Ajouter un marqueur pour la position actuelle
                    if (currentLocationMarker) {
                        map.removeLayer(currentLocationMarker);
                    }
                    
                    currentLocationMarker = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'current-location-marker',
                            html: '<i class="fas fa-location-dot" style="color: #e74c3c; font-size: 24px;"></i>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(map)
                    .bindPopup('<b>Votre position</b>')
                    .openPopup();

                    map.setView([lat, lon], 10);

                    // Créer un objet ville temporaire pour la localisation
                    const tempCity = {
                        name: 'Votre position',
                        lat: lat,
                        lon: lon
                    };

                    // Charger les données météo pour cette position
                    await selectCity(tempCity);
                    resetLocateButton();

                },
                (error) => {
                    console.error('Erreur de géolocalisation:', error);
                    let message = 'Erreur lors de la localisation';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Localisation refusée. Autorisez la localisation dans les paramètres de votre navigateur.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Information de localisation indisponible.';
                            break;
                        case error.TIMEOUT:
                            message = 'La demande de localisation a expiré.';
                            break;
                    }
                    
                    alert(message);
                    resetLocateButton();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        }

        function resetLocateButton() {
            const locateBtn = document.getElementById('locate-me');
            locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Me localiser';
            locateBtn.disabled = false;
        }

        // Fonction pour sélectionner une ville
        async function selectCity(city) {
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.city-btn').forEach(btn => {
                btn.classList.remove('active', 'loading');
                if (btn.textContent.includes(city.name)) {
                    btn.classList.add('active', 'loading');
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${city.name}`;
                }
            });

            try {
                // Afficher le chargement
                document.querySelector('.loading').innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Chargement des données météo...</p>';
                document.querySelector('.loading').style.display = 'block';
                document.querySelector('.forecast').innerHTML = '';

                // Mettre à jour la carte
                updateMap(city.lat, city.lon, city.name);

                // Récupérer les données météo actuelles
                const currentWeather = await fetchCurrentWeather(city.lat, city.lon);
                
                // Récupérer les prévisions sur 7 jours
                const forecast = await fetchForecast(city.lat, city.lon);
                
                // Mettre à jour l'interface
                updateCurrentWeather(city.name, currentWeather);
                updateForecast(forecast);

                // Mettre à jour le bouton
                document.querySelectorAll('.city-btn').forEach(btn => {
                    if (btn.textContent.includes(city.name)) {
                        btn.classList.remove('loading');
                        btn.innerHTML = `<i class="fas fa-city"></i> ${city.name}`;
                    }
                });

            } catch (error) {
                console.error('Erreur:', error);
                document.querySelector('.loading').innerHTML = `
                    <div class="error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erreur lors du chargement des données météo</p>
                        <small>${error.message}</small>
                    </div>
                `;
                
                // Réinitialiser les boutons
                document.querySelectorAll('.city-btn').forEach(btn => {
                    btn.classList.remove('loading');
                    btn.innerHTML = `<i class="fas fa-city"></i> ${btn.textContent.trim()}`;
                });
            }
        }

        // Fonction pour récupérer la météo actuelle
        async function fetchCurrentWeather(lat, lon) {
            const response = await fetch(
                `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
            );
            
            if (!response.ok) {
                throw new Error('Erreur API météo actuelle');
            }
            
            return await response.json();
        }

        // Fonction pour récupérer les prévisions sur 7 jours
        async function fetchForecast(lat, lon) {
            const response = await fetch(
                `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
            );
            
            if (!response.ok) {
                throw new Error('Erreur API prévisions');
            }
            
            const data = await response.json();
            
            // Grouper les prévisions par jour
            const dailyForecasts = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dateKey = date.toDateString();
                
                if (!dailyForecasts[dateKey]) {
                    dailyForecasts[dateKey] = {
                        date: date,
                        temps: [],
                        conditions: [],
                        icons: []
                    };
                }
                
                dailyForecasts[dateKey].temps.push(item.main.temp);
                dailyForecasts[dateKey].conditions.push(item.weather[0].description);
                dailyForecasts[dateKey].icons.push(item.weather[0].icon);
            });
            
            // Convertir en tableau et prendre les 7 prochains jours
            const forecastArray = Object.values(dailyForecasts)
                .slice(0, 7)
                .map(day => {
                    const maxTemp = Math.round(Math.max(...day.temps));
                    const minTemp = Math.round(Math.min(...day.temps));
                    const mostFrequentCondition = day.conditions.reduce((a, b, i, arr) => 
                        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
                    );
                    const icon = day.icons[day.conditions.indexOf(mostFrequentCondition)];
                    
                    return {
                        date: day.date,
                        maxTemp,
                        minTemp,
                        condition: mostFrequentCondition,
                        icon: weatherIcons[icon] || 'fa-cloud'
                    };
                });
            
            return forecastArray;
        }

        // Mettre à jour l'affichage de la météo actuelle
        function updateCurrentWeather(cityName, data) {
            const currentWeather = document.querySelector('.current-weather');
            
            // Nom de la ville
            currentWeather.querySelector('.city-info h2').textContent = cityName;
            
            // Date actuelle
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentWeather.querySelector('.date').textContent = now.toLocaleDateString('fr-FR', options);
            
            // Icône météo
            const weatherIcon = weatherIcons[data.weather[0].icon] || 'fa-cloud';
            currentWeather.querySelector('.weather-icon i').className = `fas ${weatherIcon}`;
            
            // Température
            currentWeather.querySelector('.temperature').textContent = `${Math.round(data.main.temp)}°C`;
            
            // Condition météo
            currentWeather.querySelector('.weather-condition').textContent = 
                data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
            
            // Détails supplémentaires
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
            document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
            document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
        }

        // Mettre à jour l'affichage des prévisions
        function updateForecast(forecastData) {
            const forecastContainer = document.querySelector('.forecast');
            forecastContainer.innerHTML = '';
            
            // Masquer le message de chargement
            document.querySelector('.loading').style.display = 'none';

            // Noms des jours en français
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            
            forecastData.forEach((day, index) => {
                const dayElement = document.createElement('div');
                dayElement.className = 'forecast-day';
                
                let dayName;
                if (index === 0) {
                    dayName = "Aujourd'hui";
                } else if (index === 1) {
                    dayName = "Demain";
                } else {
                    dayName = days[day.date.getDay()];
                }
                
                dayElement.innerHTML = `
                    <div class="day-name">${dayName}</div>
                    <div class="forecast-icon"><i class="fas ${day.icon}"></i></div>
                    <div class="weather-condition">${day.condition}</div>
                    <div class="forecast-temp">
                        <span class="max-temp">${day.maxTemp}°</span>
                        <span class="min-temp">${day.minTemp}°</span>
                    </div>
                `;
                forecastContainer.appendChild(dayElement);
            });
        }

        // Style supplémentaire pour le marqueur de localisation
        const style = document.createElement('style');
        style.textContent = `
            .current-location-marker {
                background: transparent;
                border: none;
            }
        `;
        document.head.appendChild(style);