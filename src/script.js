// 🌍 Initialize the Leaflet map centered at coordinates [20, 0] with zoom level 2
let map = L.map("map").setView([20, 0], 2);

// 🗺️ Add OpenStreetMap tile layer to the map
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
const WEATHER_API_KEY = "YOUR_API_KEY_HERE"; // This should be replaced with an actual API key
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

let crashData = [];
let chart;
let timelineChart;
let operatorChart; // New chart for operator analysis

/**
 * 📥 Asynchronously load crash data from JSON file and initialize visualization
 * @returns {Promise<void>} Resolves when data is loaded and visualization is initialized
 */
async function loadData() {
  console.log("🔍 Loading crash data...");
  const res = await fetch("data/crashes.json");
  crashData = await res.json();
  console.log(`✅ Loaded ${crashData.length} crash records`);
  renderMarkers(crashData);
  updateAnalytics(crashData);
  updateTimeline(crashData);
}

/**
 * 🎯 Render crash markers on the map with color-coded severity
 * @param {Array} data - Array of crash data objects
 */
function renderMarkers(data) {
  // Clear existing markers from the map
  markers.clearLayers();
  
  // Create markers for each crash with color based on fatality count
  data.forEach((crash) => {
    if (crash.Latitude && crash.Longitude) {
      // Determine marker color based on fatality count
      const fatalityCount = crash.Fatalities || 0;
      let color = "green"; // Default color for low fatalities
      
      if (fatalityCount > 50) {
        color = "red";
      } else if (fatalityCount > 10) {
        color = "orange";
      } else if (fatalityCount > 0) {
        color = "yellow";
      }
      
      // Calculate marker size based on fatalities (min 5, max 15)
      const markerSize = Math.max(5, Math.min(15, fatalityCount / 10));
      
      // Create circle marker with visual properties based on fatalities
      const marker = L.circleMarker([crash.Latitude, crash.Longitude], {
        radius: markerSize,
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

/**
 * ☁️ Fetch weather data for a specific crash location (demo implementation)
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @param {string} year - Year of the crash
 * @param {string} locationId - Unique identifier for the location
 */
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

/**
 * 📊 Update analytics dashboard with crash statistics
 * @param {Array} data - Array of crash data objects
 */
function updateAnalytics(data) {
  // Calculate summary statistics
  const total = data.length;
  const totalFatal = data.reduce((sum, d) => sum + (d.Fatalities || 0), 0);
  const avgFatal = total ? (totalFatal / total).toFixed(1) : 0;

  // Update DOM elements with statistics
  document.getElementById("count").textContent = total;
  document.getElementById("fatalities").textContent = totalFatal;
  document.getElementById("avg").textContent = avgFatal;

  // Group crashes by decade for chart visualization
  const grouped = {};
  data.forEach((d) => {
    const decade = Math.floor(d.Year / 10) * 10;
    grouped[decade] = (grouped[decade] || 0) + 1;
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map((l) => grouped[l]);

  // Destroy existing chart if it exists
  if (chart) chart.destroy();
  
  // Create new bar chart showing crashes per decade
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
  
  // New Operator Analysis Chart
  updateOperatorAnalysis(data);
  
  // Update leaderboard data
  updateLeaderboard(data);
}

// New function for operator analysis
function updateOperatorAnalysis(data) {
  // Group crashes by operator (using Type as proxy since we don't have Operator field)
  const operatorGrouped = {};
  data.forEach((d) => {
    // Using Type as operator since Operator field isn't in our dataset
    const operator = d.Type || "Unknown";
    if (!operatorGrouped[operator]) {
      operatorGrouped[operator] = { crashes: 0, fatalities: 0 };
    }
    operatorGrouped[operator].crashes += 1;
    operatorGrouped[operator].fatalities += d.Fatalities || 0;
  });

  // Convert to array and sort by crash count
  const operatorArray = Object.entries(operatorGrouped)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.crashes - a.crashes);

  // Take top 8 operators
  const topOperators = operatorArray.slice(0, 8);
  const operatorLabels = topOperators.map(op => op.name);
  const crashCounts = topOperators.map(op => op.crashes);
  const fatalityCounts = topOperators.map(op => op.fatalities);

  // Destroy existing chart if it exists
  if (operatorChart) operatorChart.destroy();

  // Create operator analysis chart
  operatorChart = new Chart(document.getElementById("operator-chart"), {
    type: "bar",
    data: {
      labels: operatorLabels,
      datasets: [
        {
          label: "Crashes",
          data: crashCounts,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        },
        {
          label: "Fatalities",
          data: fatalityCounts,
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Count"
          }
        },
        x: {
          title: {
            display: true,
            text: "Aircraft Type"
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Top Aircraft Types by Crashes and Fatalities'
        }
      }
    }
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

/**
 * 🏆 Update leaderboard with crash statistics
 * @param {Array} data - Array of crash data objects
 */
function updateLeaderboard(data) {
  // Countries leaderboard
  const countriesData = {};
  data.forEach(crash => {
    const country = crash.Country || 'Unknown';
    if (!countriesData[country]) {
      countriesData[country] = { crashes: 0, fatalities: 0 };
    }
    countriesData[country].crashes++;
    countriesData[country].fatalities += crash.Fatalities || 0;
  });

  // Convert to array and sort by crashes
  const countriesArray = Object.entries(countriesData)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.crashes - a.crashes);

  // Populate countries leaderboard table
  const countriesTable = document.getElementById('countries-leaderboard').getElementsByTagName('tbody')[0];
  countriesTable.innerHTML = '';
  countriesArray.slice(0, 10).forEach((country, index) => {
    const row = countriesTable.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = country.name;
    row.insertCell(2).textContent = country.crashes;
    row.insertCell(3).textContent = country.fatalities;
    
    // Add ranking classes for special styling
    if (index < 3) {
      row.classList.add(`rank-${index + 1}`);
    }
  });

  // Aircraft types leaderboard
  const typesData = {};
  data.forEach(crash => {
    const type = crash.Type || 'Unknown';
    if (!typesData[type]) {
      typesData[type] = { crashes: 0, fatalities: 0 };
    }
    typesData[type].crashes++;
    typesData[type].fatalities += crash.Fatalities || 0;
  });

  // Convert to array and sort by crashes
  const typesArray = Object.entries(typesData)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.crashes - a.crashes);

  // Populate types leaderboard table
  const typesTable = document.getElementById('types-leaderboard').getElementsByTagName('tbody')[0];
  typesTable.innerHTML = '';
  typesArray.slice(0, 10).forEach((type, index) => {
    const row = typesTable.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = type.name;
    row.insertCell(2).textContent = type.crashes;
    row.insertCell(3).textContent = type.fatalities;
    
    // Add ranking classes for special styling
    if (index < 3) {
      row.classList.add(`rank-${index + 1}`);
    }
  });

  // Highest fatalities leaderboard
  const fatalitiesArray = [...data]
    .filter(crash => crash.Fatalities > 0)
    .sort((a, b) => b.Fatalities - a.Fatalities);

  // Populate fatalities leaderboard table
  const fatalitiesTable = document.getElementById('fatalities-leaderboard').getElementsByTagName('tbody')[0];
  fatalitiesTable.innerHTML = '';
  fatalitiesArray.slice(0, 10).forEach((crash, index) => {
    const row = fatalitiesTable.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = crash.Location;
    row.insertCell(2).textContent = crash.Year;
    row.insertCell(3).textContent = crash.Type;
    row.insertCell(4).textContent = crash.Fatalities;
    
    // Add ranking classes for special styling
    if (index < 3) {
      row.classList.add(`rank-${index + 1}`);
    }
  });

  // Decade analysis
  const decadesData = {};
  data.forEach(crash => {
    const decade = Math.floor(crash.Year / 10) * 10;
    if (!decadesData[decade]) {
      decadesData[decade] = { crashes: 0, fatalities: 0 };
    }
    decadesData[decade].crashes++;
    decadesData[decade].fatalities += crash.Fatalities || 0;
  });

  // Convert to array and sort by decade
  const decadesArray = Object.entries(decadesData)
    .map(([decade, stats]) => ({ decade: parseInt(decade), ...stats }))
    .sort((a, b) => a.decade - b.decade);

  // Populate decades leaderboard table
  const decadesTable = document.getElementById('decades-leaderboard').getElementsByTagName('tbody')[0];
  decadesTable.innerHTML = '';
  decadesArray.forEach(decade => {
    const row = decadesTable.insertRow();
    row.insertCell(0).textContent = `${decade.decade}s`;
    row.insertCell(1).textContent = decade.crashes;
    row.insertCell(2).textContent = decade.fatalities;
  });
}

/**
 * Apply filter function
 */
function applyFilters() {
  // Get filter values from UI elements
  const minY = +document.getElementById("yearMin").value || 0;
  const maxY = +document.getElementById("yearMax").value || 9999;
  const type = document.getElementById("typeFilter").value;
  const region = document.getElementById("regionFilter").value.toLowerCase();
  const minF = +document.getElementById("fatalFilter").value || 0;
  
  // Weather filters (not fully implemented in this demo)
  const precipitation = document.getElementById("precipitationFilter").value;
  const minWind = +document.getElementById("windMin").value || 0;
  const maxWind = +document.getElementById("windMax").value || 999;
  const maxVisibility = +document.getElementById("visibilityFilter").value || 999;

  // Filter crash data based on user inputs
  const filtered = crashData.filter(
    (c) =>
      c.Year >= minY &&
      c.Year <= maxY &&
      (type === "All" || c.Type === type) &&
      (!region || (c.Country && c.Country.toLowerCase().includes(region))) &&
      (c.Fatalities || 0) >= minF
      // Weather filters would be applied here in a full implementation
  );

  // Update visualization with filtered data
  renderMarkers(filtered);
  updateAnalytics(filtered);
  updateTimeline(filtered);
}

/**
 * 🔄 Reset all filters to default values
 */
function resetFilters() {
  // Reset filter input fields
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

/**
 * 🎯 Future enhancement placeholder function
 */
function futureEnhancement() {
  // Reserved for future functionality
  // Will implement advanced filtering options
}

/**
 * 📡 Event listeners for filter buttons
 */
document.getElementById("applyFilter").addEventListener("click", applyFilters);
document.getElementById("resetFilter").addEventListener("click", resetFilters);

/**
 * Show map view function
 */
function showMapView() {
  const mapView = document.getElementById('map-view');
  const leaderboardView = document.getElementById('leaderboard-view');
  const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
  
  if (mapView && leaderboardView && showLeaderboardBtn) {
    mapView.style.display = 'block';
    leaderboardView.style.display = 'none';
    showLeaderboardBtn.style.display = 'inline-block';
  }
}

/**
 * Show leaderboard view function
 */
function showLeaderboardView() {
  const mapView = document.getElementById('map-view');
  const leaderboardView = document.getElementById('leaderboard-view');
  const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
  
  if (mapView && leaderboardView && showLeaderboardBtn) {
    mapView.style.display = 'none';
    leaderboardView.style.display = 'block';
    showLeaderboardBtn.style.display = 'none';
    
    // Update leaderboard when shown
    updateLeaderboard(crashData);
  }
}

/**
 * 🚀 Initialize the application when page loads
 */
loadData();