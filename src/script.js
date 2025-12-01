let map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Create a marker cluster group
let markers = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  maxClusterRadius: 80, // Maximum radius that a cluster will cover from the central marker
});

// Weather API configuration (using OpenWeatherMap as an example)
const WEATHER_API_KEY = "YOUR_API_KEY"; // This should be replaced with an actual API key
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

let crashData = [];
let chart;
let timelineChart;

async function loadData() {
  const res = await fetch("data/crashes.json");
  crashData = await res.json();
  renderMarkers(crashData);
  updateAnalytics(crashData);
  updateTimeline(crashData);
}

function renderMarkers(data) {
  // Clear existing markers
  markers.clearLayers();
  
  // Create markers for each crash
  data.forEach((crash) => {
    if (crash.Latitude && crash.Longitude) {
      // Create a circle marker with color based on fatalities
      const fatalityCount = crash.Fatalities || 0;
      let color = "green"; // Default color for low fatalities
      
      if (fatalityCount > 50) {
        color = "red";
      } else if (fatalityCount > 10) {
        color = "orange";
      } else if (fatalityCount > 0) {
        color = "yellow";
      }
      
      const marker = L.circleMarker([crash.Latitude, crash.Longitude], {
        radius: Math.max(5, Math.min(15, fatalityCount / 10)), // Size based on fatalities
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
      }).bindPopup(`
        <b>${crash.Location}</b><br>
        Year: ${crash.Year}<br>
        Type: ${crash.Type}<br>
        Fatalities: ${crash.Fatalities}<br>
        Country: ${crash.Country}<br>
        <div id="weather-info-${crash.Year}-${crash.Location.replace(/\s+/g, '-')}">Loading weather data...</div>
        <button onclick="fetchWeatherData(${crash.Latitude}, ${crash.Longitude}, '${crash.Year}', '${crash.Location.replace(/\s+/g, '-')}')">Load Weather</button>
      `);
      
      markers.addLayer(marker);
    }
  });
  
  // Add the marker cluster group to the map
  map.addLayer(markers);
}

// Function to fetch weather data for a specific location and time
async function fetchWeatherData(lat, lon, year, locationId) {
  try {
    // For demo purposes, we're using current weather API
    // In a real implementation, you would use a historical weather API
    const response = await fetch(`${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
    
    if (!response.ok) {
      throw new Error('Weather data not available');
    }
    
    const weatherData = await response.json();
    
    // Update the popup with weather information
    const weatherInfoDiv = document.getElementById(`weather-info-${year}-${locationId}`);
    if (weatherInfoDiv) {
      weatherInfoDiv.innerHTML = `
        <b>Weather Conditions:</b><br>
        Temperature: ${weatherData.main.temp}°C<br>
        Humidity: ${weatherData.main.humidity}%<br>
        Wind Speed: ${weatherData.wind.speed} m/s<br>
        Conditions: ${weatherData.weather[0].description}
      `;
    }
  } catch (error) {
    const weatherInfoDiv = document.getElementById(`weather-info-${year}-${locationId}`);
    if (weatherInfoDiv) {
      weatherInfoDiv.innerHTML = "Weather data unavailable";
    }
  }
}

function updateAnalytics(data) {
  const total = data.length;
  const totalFatal = data.reduce((sum, d) => sum + (d.Fatalities || 0), 0);
  const avgFatal = total ? (totalFatal / total).toFixed(1) : 0;

  document.getElementById("count").textContent = total;
  document.getElementById("fatalities").textContent = totalFatal;
  document.getElementById("avg").textContent = avgFatal;

  // Chart - crashes by decade
  const grouped = {};
  data.forEach((d) => {
    const decade = Math.floor(d.Year / 10) * 10;
    grouped[decade] = (grouped[decade] || 0) + 1;
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map((l) => grouped[l]);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Crashes per Decade",
          data: values,
          backgroundColor: "rgba(255,99,132,0.6)",
        },
      ],
    },
    options: { 
      scales: { y: { beginAtZero: true } },
      responsive: true,
      maintainAspectRatio: false
    },
  });
}

// Timeline chart function
function updateTimeline(data) {
  // Group data by year
  const yearlyData = {};
  data.forEach((d) => {
    yearlyData[d.Year] = (yearlyData[d.Year] || 0) + 1;
  });

  const years = Object.keys(yearlyData).sort();
  const counts = years.map((year) => yearlyData[year]);

  const ctx = document.getElementById("timeline-chart").getContext("2d");
  
  if (timelineChart) timelineChart.destroy();
  
  timelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Crashes per Year",
        data: counts,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Crashes"
          }
        },
        x: {
          title: {
            display: true,
            text: "Year"
          }
        }
      }
    }
  });
}

// Apply filter function
function applyFilters() {
  const minY = +document.getElementById("yearMin").value || 0;
  const maxY = +document.getElementById("yearMax").value || 9999;
  const type = document.getElementById("typeFilter").value;
  const region = document.getElementById("regionFilter").value.toLowerCase();
  const minF = +document.getElementById("fatalFilter").value || 0;
  
  // Weather filters
  const precipitation = document.getElementById("precipitationFilter").value;
  const minWind = +document.getElementById("windMin").value || 0;
  const maxWind = +document.getElementById("windMax").value || 999;
  const maxVisibility = +document.getElementById("visibilityFilter").value || 999;

  // Note: In a real implementation, you would filter based on actual weather data
  // For this demo, we're just showing how the filter would work
  const filtered = crashData.filter(
    (c) =>
      c.Year >= minY &&
      c.Year <= maxY &&
      (type === "All" || c.Type === type) &&
      (!region || (c.Country && c.Country.toLowerCase().includes(region))) &&
      (c.Fatalities || 0) >= minF
      // Weather filters would be applied here in a full implementation
  );

  renderMarkers(filtered);
  updateAnalytics(filtered);
  updateTimeline(filtered);
}

// Reset filter function
function resetFilters() {
  document.getElementById("yearMin").value = "";
  document.getElementById("yearMax").value = "";
  document.getElementById("typeFilter").value = "All";
  document.getElementById("regionFilter").value = "";
  document.getElementById("fatalFilter").value = "";
  
  // Reset weather filters
  document.getElementById("precipitationFilter").value = "all";
  document.getElementById("windMin").value = "";
  document.getElementById("windMax").value = "";
  document.getElementById("visibilityFilter").value = "";
  
  renderMarkers(crashData);
  updateAnalytics(crashData);
  updateTimeline(crashData);
}

// Event listeners
document.getElementById("applyFilter").addEventListener("click", applyFilters);
document.getElementById("resetFilter").addEventListener("click", resetFilters);

// Load data when page loads
loadData();