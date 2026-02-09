# 📍 RouteOpt : The Secure Commute Ecosystem

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://routeopt-beige.vercel.app/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **A closed-network carpooling platform designed exclusively for organizations.**
> *Secure. Verified. Sustainable.*

🔗 **Live Deployment :** [https://routeopt-f13a8.web.app]

---

## 📖 Overview
Traffic congestion and unsafe public commuting are major issues for students and employees. Existing solutions like Uber are expensive, while WhatsApp groups are inefficient and unregulated.

**RouteOpt** is a specialized carpooling platform that restricts access to verified organizational emails (e.g., `@ves.ac.in`). Unlike standard apps, it uses **Polyline Route Matching** to find passengers strictly along a driver's actual path, not just at the start or end points. It creates a complete ecosystem with real-time security monitoring and eco-friendly gamification.

---

## 🚀 Key Features

### 🔒 1. Domain-Locked Security & Safety
* **Verified Access Only :** Registration is strictly gated by institutional email domains.
* **Safety Toggles :** Drivers can restrict rides to **"Same Gender Only"** or **"Same Institution Only"** for added comfort.
* **Driver Transparency :** Passengers see verified driver profiles and vehicle details before requesting.

### 🚨 2. Centralized SOS & Admin Dashboard
* **One-Tap SOS :** Users can trigger an emergency alert that instantly logs their live coordinates.
* **Security Command Center :** A dedicated **Admin Dashboard** acts as a listening authority. It uses real-time listeners to detect SOS alerts instantly.
* **Dispatch Logic :** Admins can view the alert location on Google Maps and mark incidents as "RESOLVED" after dispatching help.

### 🗺️ 3. Intelligent Route Matching (Polyline Algorithm)
* **Deviation Logic :** We don't just match endpoints. Our algorithm buffers the driver's **actual route path (OSRM)** to find passengers waiting along the way.
* **Geocoding Intelligence :** Integrated with **Photon/OpenStreetMap** to convert local landmarks (e.g., "Amar Mahal") into precise coordinates with location biasing for accuracy.

### 💰 4. Fair Pricing & UPI Payments
* **Automated Costing :** Fare is automatically calculated based on vehicle type (Car/Bike) and distance (e.g., ₹7/km).
* **Direct Payments :** Integrated **Dynamic QR Codes** allow passengers to pay drivers directly via UPI (GPay/Paytm) without platform fees.

### 🌱 5. The "Eco-Loop" Gamification
* **Live Carbon Dashboard :** Tracks total CO₂ emissions saved per user.
* **Dynamic Leaderboard :** Real-time ranking of top "Green Commuters" in the organization based on actual ride data.
* **Analytics :** Visual charts showing organization-wide sustainability impact.

### 🚖 6. Real-Time Ride Management
* **Driver Dashboard :** Interactive map view with color-coded pins for the route (Red), confirmed passengers (Green), and pending requests (Yellow).
* **Lifecycle Management :** Drivers can accept/reject requests and mark rides as "Completed" to archive them.

---

## 🛠️ Tech Stack

| Component | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite)** | Core UI & Component Logic |
| **Styling** | **Tailwind CSS** | Glassmorphism UI & Responsive Design |
| **Backend / DB** | **Firebase Firestore** | Real-time Database & Querying |
| **Auth** | **Firebase Auth** | Email/Password & Session Management |
| **Maps & Routing** | **Leaflet + React-Leaflet** | Interactive Map Rendering |
| **Routing API** | **OSRM** | Calculating Paths & Distances |
| **Geocoding** | **Photon (Komoot)** | Address to Coordinate Conversion |
| **Payments** | **React-QR-Code** | Dynamic UPI Payment Generation |
| **Analytics** | **Recharts** | Data Visualization for Admin Dashboard |

---

## 📸 Usage Guide

1.  **Sign Up :** Create an account with your organization email.
2.  **Post a Ride (Driver) :** Enter start/end points. The app calculates the route, price, and distance automatically.
3.  **Find a Ride (Passenger) :** Enter your pickup/drop location. The smart filter finds drivers passing within **5km** of your route.
4.  **Request & Approve :** Passenger sends a request; Driver approves via the Dashboard.
5.  **Ride & Pay :** Meet at the pickup point. On completion, scan the driver's QR code to pay the calculated fare.
6.  **Emergency :** In case of danger, press the SOS button to alert the Admin Dashboard immediately.

---

## ⚡ Installation (Run Locally)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/bhoominaik16/RouteOpt.git
    cd routeopt
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Firebase**
    * Create a project on [Firebase Console](https://console.firebase.google.com/).
    * Enable **Authentication** and **Firestore Database**.
    * Create a `firebase.js` file in `src/` and add your config keys.

4.  **Run the App**
    ```bash
    npm run dev
    ```

---

## 👥 The Team

| Name | Role | Key Contributions |
| :--- | :--- | :--- |
| **Vaishnavi Avhad** | **Full Stack Developer** | Core Ride Lifecycle, Geospatial Routing, SOS Architecture, UPI Payments, Deployment |
| **Bhoomi Naik** | **Full Stack Developer** | Project Setup, Foundational Frontend Architecture, UI/UX Design|
| **Saniya Kadam** | **Full Stack Developer** | Firebase Authentication, Admin Dashboard Implementation, UI/UX Refinement |

---

## 🔮 Future Roadmap
* **Mobile App :** Porting logic to React Native for iOS/Android.
* **WebSocket Tracking :** Live real-time movement updates on the map (Driver Live Location).

---

**Built with 💚 for Safer Campuses.**