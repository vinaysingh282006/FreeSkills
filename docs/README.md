# ✈️ BUDDHA PROJECT — Aviation Crash Analytics Dashboard

> **A powerful and interactive analytics dashboard for historical aviation accident data (1908–2022)**

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28%2B-FF4B4B.svg)](https://streamlit.io/)
[![Plotly](https://img.shields.io/badge/Plotly-5.15%2B-3F4F75.svg)](https://plotly.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 Overview

The **BUDDHA PROJECT** (part of the _History of All Flight Crash Map_ series) is a comprehensive **aviation analytics dashboard** that visualizes more than a century of **aircraft crash data** in a single, interactive platform.

It combines **data visualization, geospatial mapping, and predictive analytics** to help researchers, aviation analysts, and data enthusiasts explore global crash trends, causes, and consequences.

Developed using **Streamlit**, **Plotly**, and **Folium**, the project blends **data science** and **UI design** for a polished, responsive, and research-ready experience.

---

## ✨ Features

### 🌍 **Global 3D Visualization**

- Interactive 3D globe showing crash points across the world.
- Clickable markers display date, operator, location, and summary.

### 🏁 **Racing Stick Animation**

- Dual-colored animated bars (🟣 crashes vs 🔵 fatalities).
- Adjustable playback speed: _Fast (0.8s)_, _Normal (2s)_, _Slow (4s)_.

### 🎯 **Crash Reasons Analytics**

- Categorized insights into crash causes: _Mechanical, Weather, Human Error, Fire, Other_.
- Dynamic pie, bar, and line charts.

### 💀 **Fatality Trend Analysis**

- Time-series visualizations of fatalities per year.
- Identify peaks, recoveries, and improvement patterns in aviation safety.

### 💰 **Cost Breakdown Simulation**

- Financial impact model: `$50M` per crash + `$1.5M` per fatality.
- Airline-wise cost and risk assessment charts.

### 🎮 **Interactive Controls**

- Real-time filters, timeline slider, and hover tooltips.
- All visualizations update dynamically with user input.

---

## 📸 Screenshots

### 🖥️ Dashboard Preview

| Tab                    | Description                              |
| ---------------------- | ---------------------------------------- |
| **🌍 3D Globe**        | Interactive Earth with crash markers     |
| **🏁 Racing Sticks**   | Animated crash vs fatality comparison    |
| **🎯 Crash Reasons**   | Color-coded stick charts by cause        |
| **💀 Fatality Trends** | Area chart for year-wise fatalities      |
| **💰 Cost Breakdown**  | Cost estimation and airline risk visuals |

![Preview 1](/History-of-all-flight-crash-map-main/webpreview1.png)
![Preview 2](/History-of-all-flight-crash-map-main/webpreview2.png)
![Preview 3](/History-of-all-flight-crash-map-main/webpreview3.png)
![Preview 4](/History-of-all-flight-crash-map-main/webpreview4.png)

> 🌐 **Live App:** [Flight Crash Mapped](https://flightcrashmapped.streamlit.app/)  
> Explore the entire dataset interactively with animations, filters, and geospatial mapping!

---

## 🛠️ Technology Stack

| Layer                  | Tools & Frameworks                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Frontend**           | [Streamlit](https://streamlit.io/), HTML, CSS                                                    |
| **Data Visualization** | [Plotly](https://plotly.com/), [Altair](https://altair-viz.github.io/)                           |
| **Mapping**            | [Folium](https://python-visualization.github.io/folium/)                                         |
| **Data Processing**    | [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)                                |
| **Deployment**         | [Streamlit Cloud](https://streamlit.io/cloud), [Vercel (Future Static Site)](https://vercel.com) |

---

## 📋 Prerequisites

Make sure you have the following installed:

- **Python 3.8+**
- **pip** (Python package manager)
- **Git**

---

## ⚡ Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/vinaysingh282006/History-of-all-flight-crash-map.git
cd History-of-all-flight-crash-map
```

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Run the App

```bash
streamlit run src\streamlit_app.py
```

### 4️⃣ Launch in Browser

Visit ➤ `http://localhost:8501`

---

## 📁 Project Structure

```
History-of-all-flight-crash-map/
│
├── streamlit_app.py          # Main Streamlit application
├── dataset.csv.csv           # Aviation crash data (1908–2022)
├── requirements.txt          # Python dependencies
├── webpreview*.png           # Preview images for README
├── LICENSE                   # MIT license
└── README.md                 # Project documentation
```

---

## 🧠 Data Information

**Dataset Fields:**
| Field | Description |
|--------|-------------|
| `Date` | Date of crash |
| `Location` | Geographic location |
| `Operator` | Airline or operator name |
| `Type` | Aircraft model/type |
| `Aboard` | Number of people onboard |
| `Fatalities` | Total deaths |
| `Summary` | Crash summary and probable cause |

**Dataset Coverage:**

- **Years:** 1908 – 2022
- **Scope:** Worldwide
- **Records:** ~5,000 incidents

---

## 🎨 Design & Theme

### 🎨 Color Palette

| Element       | Color     | Use                    |
| ------------- | --------- | ---------------------- |
| **Primary**   | `#2E86AB` | Base interface color   |
| **Secondary** | `#A23B72` | Accent color (crashes) |
| **Accent**    | `#F18F01` | Highlights             |
| **Success**   | `#4CAF50` | Positive results       |
| **Warning**   | `#FF9800` | Alerts                 |
| **Danger**    | `#F44336` | Fatal incidents        |

### 📏 Chart Layout

- Default Chart Height: **600–700px**
- Racing Bar Animation: **800px**
- Responsive layout with **full-width adaptive charts**

---

## 🔧 Development Guidelines

### 🧩 Add New Features

1. Add your logic inside `streamlit_app.py` under the appropriate tab.
2. Create reusable visualization functions for each chart type.
3. Maintain modular structure for clarity.
4. Add a descriptive label to your new tab in the sidebar.

### ⚙️ Performance Optimizations

- Cache data with `@st.cache_data` decorator.
- Avoid unnecessary recomputations.
- Optimize Plotly animations for smoother playback.

---

## 🤝 Contribution Guidelines

We welcome contributions!

1. **Fork** this repo
2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit & Push**
   ```bash
   git commit -m "Add: new visualization feature"
   git push origin feature/your-feature
   ```
4. **Submit a Pull Request**

> Before submitting, ensure there are no console errors and your code passes basic lint checks.

---

## 🧭 Roadmap

| Goal                     | Description                                          | Status         |
| ------------------------ | ---------------------------------------------------- | -------------- |
| Static HTML Conversion   | Convert Streamlit UI → deployable HTML on Vercel     | 🔄 In Progress |
| Global Dataset Expansion | Include more detailed fields (weather, aircraft age) | 🟢 Planned     |
| Dark/Light Theme         | Toggle mode for better UX                            | 🟡 In Progress |
| Vercel Auto Deploy       | Auto-build and deploy static version                 | 🟠 Upcoming    |
| API Integration          | Pull real-time crash updates via API                 | 🔵 Future      |
| Analytics Dashboard      | Add predictive ML models for trends                  | 🟢 Planned     |

---

## 🌟 Contributors

| Name                  | Role             | Contribution                        |
| --------------------- | ---------------- | ----------------------------------- |
| **Subramaniam**       | 👨‍💻 Project Admin | Project Lead & Core Development     |
| **Vinay Kumar Singh** | 💡 Founder       | Original Author & Data Architecture |
| **You?**              | 🌍 Contributor   | Submit your first PR to join here!  |

---

## 💬 Communication

💬 Open a discussion or issue for:

- 🐛 Bug Reports
- 💡 Feature Requests
- ⚙️ Development Queries

📬 **GitHub Discussions:** [Start here](https://github.com/vinaysingh282006/History-of-all-flight-crash-map/discussions)

---

## 📄 License

Licensed under the **MIT License** — free for personal and commercial use.  
See [LICENSE](LICENSE) for full terms.

---

## 🧘‍♂️ Final Note

> _"Every aviation incident leaves behind a lesson — this project transforms those lessons into data-driven insights for a safer tomorrow."_

Made with ❤️ using **Streamlit**, **Plotly**, and **Open-Source Passion** ✈️🌍

---
