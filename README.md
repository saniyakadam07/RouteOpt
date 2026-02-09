# 📍 RouteOpt : The Secure Commute Ecosystem

[![Live Demo](https://img.shields.io/badge/Live_Demo-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://routeopt-f13a8.web.app/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_Pro-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **A closed-network carpooling platform designed exclusively for organizations.**
> *Secure. Verified. Sustainable.*

🔗 **Live Deployment:** [https://routeopt-f13a8.web.app](https://routeopt-f13a8.web.app)

---

## 📖 Overview
RouteOpt is a secure, AI-powered carpooling ecosystem designed for universities and corporate campuses. It addresses the "Safety Trade-off" and carbon impact of daily commuting by creating a high-trust network.

Unlike standard apps, RouteOpt leverages **Google Gemini Pro Vision** for automated ID verification and **Polyline Route Intelligence** to match riders strictly along a driver's actual path. By promoting shared mobility, this project contributes directly to **UN Sustainable Development Goal 11** (Sustainable Cities).

---

## 🚀 Key Features

### 🔒 1. AI-Powered Trust & Security
* **Gemini Vision Verification:** Uses **Google Gemini Pro Vision** to scan and verify physical institutional ID cards, eliminating fake profiles.
* **Domain-Locked Access:** Registration is strictly gated by institutional email domains (e.g., `@ves.ac.in`).
* **Safety Toggles:** Drivers can restrict rides to "Same Gender" or "Same Institution" for added comfort.

### 🗺️ 2. Intelligent Polyline Matching
* **Route Buffering:** Instead of simple start/end matching, the algorithm buffers the driver's **actual path (OSRM)** to find passengers waiting along the specific route.
* **Photon Geocoding:** Converts local landmarks (e.g., "Main Gate") into precise coordinates with location biasing.

### 🚨 3. Centralized SOS & Admin Dashboard
* **One-Tap SOS:** Instantly triggers an alert with live coordinates to the security command center.
* **Real-Time Dispatch:** Admins view alerts on a live map and can dispatch help immediately.

### 🌱 4. The "Eco-Loop" & Gemini Coach
* **Gemini Eco-Coach:** Powered by **Gemini 2.5 Flash**, this AI assistant provides personalized sustainability insights and motivation.
* **Green Metrics:** Tracks CO2 emissions saved and ranks users on a "Green Impact" leaderboard.

### 💰 5. Fair Pricing & UPI
* **Automated Costing:** Fare is calculated based on vehicle type and distance (~₹7/km).
* **Direct Payments:** Integrated dynamic QR codes allow peer-to-peer UPI payments without platform fees.

---

## 🛠️ Tech Stack

| Component | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite)** | Core UI & Component Logic |
| **AI (Vision)** | **Gemini Pro Vision** | Physical ID Card Verification |
| **AI (Chat)** | **Gemini 2.5 Flash** | Eco-Coach & Sustainability Insights |
| **Backend** | **Firebase** | Auth, Firestore, & Hosting |
| **Maps** | **Leaflet + OSRM** | Routing & Interactive Maps |
| **Dev Env** | **Project IDX** | AI-first Cloud Development |
| **Analytics** | **Google Analytics** | Tracking "Green Events" |

---

## 📸 Usage Guide

1.  **Sign Up:** Upload your physical ID card for AI verification and use your org email.
2.  **Post a Ride:** Enter route details; the app calculates the polyline and fare.
3.  **Find a Ride:** The smart filter finds drivers passing within **5km** of your pickup point.
4.  **Ride & Pay:** Scan the driver's QR code upon arrival to pay via UPI.
5.  **Emergency:** Press SOS to alert the Admin Dashboard instantly.

---

## ⚡ Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/saniyakadam07/RouteOpt.git](https://github.com/saniyakadam07/RouteOpt.git)
    cd RouteOpt
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Firebase & Gemini**
    * Create a Firebase project with Auth and Firestore.
    * Get a **Gemini API Key** from Google AI Studio.
    * Add keys to your `.env` file.

4.  **Run the App**
    ```bash
    npm run dev
    ```

---

## 🔮 Future Roadmap
* **Native Mobile App:** Migration to **Flutter** for better mobile performance.
* **Predictive AI:** Using **Vertex AI** to predict ride demand hotspots.
* **Traffic Optimization:** Integration with Google Maps Routes API.

---

**Built with 💚 for Safer Campuses.**