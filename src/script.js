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
  try {
    const res = await fetch("data/crashes.json");
    if (!res.ok) {
      throw new Error(`Failed to load crash data: ${res.status} ${res.statusText}`);
    }
    crashData = await res.json();
    console.log(`✅ Loaded ${crashData.length} crash records`);
    renderMarkers(crashData);
    updateAnalytics(crashData);
    updateTimeline(crashData);
  } catch (error) {
    console.error("❌ Error loading crash data:", error);
    // Display error to user
    const statsContainer = document.getElementById("stats");
    if (statsContainer) {
      statsContainer.innerHTML = `<p style="color: red;">Error loading crash data: ${error.message}</p>`;
    }
  }
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
    // Check if API key is configured
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("Weather API key not configured. Please set a valid API key.");
    }
    
    // For demo purposes, we're using current weather API
    // In a real implementation, you would use a historical weather API
    const response = await fetch(`${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenWeatherMap API key.");
      } else if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`Weather service error: ${response.status} ${response.statusText}`);
      }
    }
    
    const weatherData = await response.json();
    
    // Update the popup with weather information
    const weatherInfoDiv = document.getElementById(`weather-info-${year}-${locationId}`);
    if (weatherInfoDiv) {
      weatherInfoDiv.innerHTML = `
        <b>Weather Conditions:</b><br>
        Temperature: ${weatherData.main.temp}°C<br>
        Humidity: ${weatherData.main.humidity}%<br>
        Wind Speed: ${weatherData.wind?.speed || 'N/A'} m/s<br>
        Conditions: ${weatherData.weather?.[0]?.description || 'Unknown'}
      `;
    }
  } catch (error) {
    console.error("Weather data fetch error:", error);
    const weatherInfoDiv = document.getElementById(`weather-info-${year}-${locationId}`);
    if (weatherInfoDiv) {
      let errorMessage = "Weather data unavailable";
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      weatherInfoDiv.innerHTML = `<span style="color: red;">${errorMessage}</span>`;
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
  // Group crashes by year for timeline
  const yearlyData = {};
  data.forEach((d) => {
    yearlyData[d.Year] = (yearlyData[d.Year] || 0) + 1;
  });

  const years = Object.keys(yearlyData).sort();
  const counts = years.map((y) => yearlyData[y]);

  // Destroy existing chart if it exists
  if (timelineChart) timelineChart.destroy();

  // Create timeline chart
  timelineChart = new Chart(document.getElementById("timeline-chart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Crashes per Year",
          data: counts,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: true,
          tension: 0.1
        },
      ],
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
    },
  });
}

// Apply filter function
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
 * 📤 Export data to various formats
 * @param {Array} data - Array of crash data objects to export
 * @param {string} format - Export format ('csv', 'json', 'image')
 * @param {string} filename - Name of the file to export
 */
function exportData(data = crashData, format = 'csv', filename = 'flight_crash_data') {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'image':
      exportChartsAsImage(filename);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
}

/**
 * Export data to CSV format
 * @param {Array} data - Array of crash data objects to export
 * @param {string} filename - Name of the file to export
 */
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = ['Location', 'Year', 'Type', 'Fatalities', 'Country', 'Latitude', 'Longitude'];
  let csvContent = headers.join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const row = [
      `"${item.Location || ''}"`,
      item.Year || '',
      `"${item.Type || ''}"`,
      item.Fatalities || 0,
      `"${item.Country || ''}"`,
      item.Latitude || '',
      item.Longitude || ''
    ];
    csvContent += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to JSON format
 * @param {Array} data - Array of crash data objects to export
 * @param {string} filename - Name of the file to export
 */
function exportToJSON(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create JSON content
  const jsonContent = JSON.stringify(data, null, 2);

  // Create download link
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export charts as images
 * @param {string} filename - Name of the file to export
 */
function exportChartsAsImage(filename) {
  // Create a container for all charts
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '20px';
  container.style.padding = '20px';
  container.style.backgroundColor = 'white';
  
  // Clone and add each chart
  const charts = [
    document.getElementById('chart'),
    document.getElementById('timeline-chart'),
    document.getElementById('operator-chart')
  ];
  
  charts.forEach(chartElement => {
    if (chartElement) {
      const clone = chartElement.cloneNode(true);
      clone.style.maxWidth = '800px';
      clone.style.height = 'auto';
      container.appendChild(clone);
    }
  });
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Flight Crash Data Analysis';
  title.style.textAlign = 'center';
  container.insertBefore(title, container.firstChild);
  
  // Add timestamp
  const timestamp = document.createElement('p');
  timestamp.textContent = `Exported on: ${new Date().toLocaleString()}`;
  timestamp.style.textAlign = 'center';
  timestamp.style.fontStyle = 'italic';
  container.appendChild(timestamp);
  
  // Render to canvas and download
  html2canvas(container).then(canvas => {
    const link = document.createElement('a');
    link.download = `${filename}_charts.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// 📡 Event listeners for filter buttons
document.getElementById("applyFilter").addEventListener("click", applyFilters);
document.getElementById("resetFilter").addEventListener("click", resetFilters);
// Add event listener for export button
document.getElementById("exportData").addEventListener("click", function() {
  // Get current filter values
  const minY = +document.getElementById("yearMin").value || 0;
  const maxY = +document.getElementById("yearMax").value || 9999;
  const type = document.getElementById("typeFilter").value;
  const region = document.getElementById("regionFilter").value.toLowerCase();
  const minF = +document.getElementById("fatalFilter").value || 0;
  
  // Filter data based on current filters
  const filteredData = crashData.filter(
    (c) =>
      c.Year >= minY &&
      c.Year <= maxY &&
      (type === "All" || c.Type === type) &&
      (!region || (c.Country && c.Country.toLowerCase().includes(region))) &&
      (c.Fatalities || 0) >= minF
  );
  
  // Show export options dialog
  showExportDialog(filteredData);
});

/**
 * Show export options dialog
 * @param {Array} data - Data to export
 */
function showExportDialog(data) {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  
  // Create dialog content
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = 'white';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '8px';
  dialog.style.width = '400px';
  dialog.style.maxWidth = '90%';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Export Data';
  title.style.marginTop = '0';
  dialog.appendChild(title);
  
  // Add data info
  const info = document.createElement('p');
  info.textContent = `Exporting ${data.length} crash records`;
  dialog.appendChild(info);
  
  // Add export format options
  const formatLabel = document.createElement('label');
  formatLabel.textContent = 'Select export format:';
  formatLabel.style.display = 'block';
  formatLabel.style.marginBottom = '10px';
  formatLabel.style.fontWeight = 'bold';
  dialog.appendChild(formatLabel);
  
  // Create radio buttons for format selection
  const formats = [
    { id: 'csv', label: 'CSV (Spreadsheet)', checked: true },
    { id: 'json', label: 'JSON (Raw Data)' },
    { id: 'image', label: 'PNG (Charts Image)' }
  ];
  
  let selectedFormat = 'csv';
  
  formats.forEach(format => {
    const container = document.createElement('div');
    container.style.marginBottom = '8px';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = `format-${format.id}`;
    radio.name = 'export-format';
    radio.value = format.id;
    radio.checked = format.checked || false;
    if (format.checked) selectedFormat = format.id;
    
    radio.addEventListener('change', function() {
      selectedFormat = this.value;
    });
    
    const label = document.createElement('label');
    label.htmlFor = `format-${format.id}`;
    label.textContent = format.label;
    label.style.marginLeft = '8px';
    
    container.appendChild(radio);
    container.appendChild(label);
    dialog.appendChild(container);
  });
  
  // Add filename input
  const filenameLabel = document.createElement('label');
  filenameLabel.textContent = 'Filename (without extension):';
  filenameLabel.style.display = 'block';
  filenameLabel.style.marginTop = '15px';
  filenameLabel.style.fontWeight = 'bold';
  dialog.appendChild(filenameLabel);
  
  const filenameInput = document.createElement('input');
  filenameInput.type = 'text';
  filenameInput.id = 'export-filename';
  filenameInput.value = 'flight_crash_data_' + new Date().toISOString().slice(0, 10);
  filenameInput.style.width = '100%';
  filenameInput.style.padding = '8px';
  filenameInput.style.marginTop = '5px';
  filenameInput.style.marginBottom = '15px';
  dialog.appendChild(filenameInput);
  
  // Add buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.justifyContent = 'flex-end';
  
  const exportButton = document.createElement('button');
  exportButton.textContent = 'Export';
  exportButton.style.backgroundColor = '#28a745';
  exportButton.addEventListener('click', function() {
    const filename = filenameInput.value || 'flight_crash_data';
    exportData(data, selectedFormat, filename);
    document.body.removeChild(modal);
  });
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.backgroundColor = '#6c757d';
  cancelButton.addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(exportButton);
  dialog.appendChild(buttonContainer);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Add dialog to modal and modal to body
  modal.appendChild(dialog);
  document.body.appendChild(modal);
}

// 🎯 Future enhancement placeholder function
function futureEnhancement() {
  // Reserved for future functionality
  // Will implement advanced filtering options
}

/**
 * 📤 Export data to various formats
 * @param {Array} data - Array of crash data objects to export
 * @param {string} format - Export format ('csv', 'json', 'image')
 * @param {string} filename - Name of the file to export
 */
function exportData(data = crashData, format = 'csv', filename = 'flight_crash_data') {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'image':
      exportChartsAsImage(filename);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
}

/**
 * Export data to CSV format
 * @param {Array} data - Array of crash data objects to export
 * @param {string} filename - Name of the file to export
 */
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = ['Location', 'Year', 'Type', 'Fatalities', 'Country', 'Latitude', 'Longitude'];
  let csvContent = headers.join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const row = [
      `"${item.Location || ''}"`,
      item.Year || '',
      `"${item.Type || ''}"`,
      item.Fatalities || 0,
      `"${item.Country || ''}"`,
      item.Latitude || '',
      item.Longitude || ''
    ];
    csvContent += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to JSON format
 * @param {Array} data - Array of crash data objects to export
 * @param {string} filename - Name of the file to export
 */
function exportToJSON(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create JSON content
  const jsonContent = JSON.stringify(data, null, 2);

  // Create download link
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export charts as images
 * @param {string} filename - Name of the file to export
 */
function exportChartsAsImage(filename) {
  // Create a container for all charts
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '20px';
  container.style.padding = '20px';
  container.style.backgroundColor = 'white';
  
  // Clone and add each chart
  const charts = [
    document.getElementById('chart'),
    document.getElementById('timeline-chart'),
    document.getElementById('operator-chart')
  ];
  
  charts.forEach(chartElement => {
    if (chartElement) {
      const clone = chartElement.cloneNode(true);
      clone.style.maxWidth = '800px';
      clone.style.height = 'auto';
      container.appendChild(clone);
    }
  });
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Flight Crash Data Analysis';
  title.style.textAlign = 'center';
  container.insertBefore(title, container.firstChild);
  
  // Add timestamp
  const timestamp = document.createElement('p');
  timestamp.textContent = `Exported on: ${new Date().toLocaleString()}`;
  timestamp.style.textAlign = 'center';
  timestamp.style.fontStyle = 'italic';
  container.appendChild(timestamp);
  
  // Render to canvas and download
  html2canvas(container).then(canvas => {
    const link = document.createElement('a');
    link.download = `${filename}_charts.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

/**
 * Show export options dialog
 * @param {Array} data - Data to export
 */
function showExportDialog(data) {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  
  // Create dialog content
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = 'white';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '8px';
  dialog.style.width = '400px';
  dialog.style.maxWidth = '90%';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Export Data';
  title.style.marginTop = '0';
  dialog.appendChild(title);
  
  // Add data info
  const info = document.createElement('p');
  info.textContent = `Exporting ${data.length} crash records`;
  dialog.appendChild(info);
  
  // Add export format options
  const formatLabel = document.createElement('label');
  formatLabel.textContent = 'Select export format:';
  formatLabel.style.display = 'block';
  formatLabel.style.marginBottom = '10px';
  formatLabel.style.fontWeight = 'bold';
  dialog.appendChild(formatLabel);
  
  // Create radio buttons for format selection
  const formats = [
    { id: 'csv', label: 'CSV (Spreadsheet)', checked: true },
    { id: 'json', label: 'JSON (Raw Data)' },
    { id: 'image', label: 'PNG (Charts Image)' }
  ];
  
  let selectedFormat = 'csv';
  
  formats.forEach(format => {
    const container = document.createElement('div');
    container.style.marginBottom = '8px';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = `format-${format.id}`;
    radio.name = 'export-format';
    radio.value = format.id;
    radio.checked = format.checked || false;
    if (format.checked) selectedFormat = format.id;
    
    radio.addEventListener('change', function() {
      selectedFormat = this.value;
    });
    
    const label = document.createElement('label');
    label.htmlFor = `format-${format.id}`;
    label.textContent = format.label;
    label.style.marginLeft = '8px';
    
    container.appendChild(radio);
    container.appendChild(label);
    dialog.appendChild(container);
  });
  
  // Add filename input
  const filenameLabel = document.createElement('label');
  filenameLabel.textContent = 'Filename (without extension):';
  filenameLabel.style.display = 'block';
  filenameLabel.style.marginTop = '15px';
  filenameLabel.style.fontWeight = 'bold';
  dialog.appendChild(filenameLabel);
  
  const filenameInput = document.createElement('input');
  filenameInput.type = 'text';
  filenameInput.id = 'export-filename';
  filenameInput.value = 'flight_crash_data_' + new Date().toISOString().slice(0, 10);
  filenameInput.style.width = '100%';
  filenameInput.style.padding = '8px';
  filenameInput.style.marginTop = '5px';
  filenameInput.style.marginBottom = '15px';
  dialog.appendChild(filenameInput);
  
  // Add buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.justifyContent = 'flex-end';
  
  const exportButton = document.createElement('button');
  exportButton.textContent = 'Export';
  exportButton.style.backgroundColor = '#28a745';
  exportButton.addEventListener('click', function() {
    const filename = filenameInput.value || 'flight_crash_data';
    exportData(data, selectedFormat, filename);
    document.body.removeChild(modal);
  });
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.backgroundColor = '#6c757d';
  cancelButton.addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(exportButton);
  dialog.appendChild(buttonContainer);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Add dialog to modal and modal to body
  modal.appendChild(dialog);
  document.body.appendChild(modal);
}

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