# 🌿 FoodBridge — Turn Surplus Food Into Hope

**FoodBridge** is a real-time food redistribution network designed to connect food donors (individuals, restaurants, hotels) with those in need (NGOs, community centers, individuals). Our mission is to reduce food waste while simultaneously addressing food insecurity through technology-driven logistics and community engagement.

---

## 🚀 Key Features

- **📍 Real-Time Food Mapping**: Interactive map powered by Leaflet and OpenStreetMap to find and list food donations nearby.
- **🍽️ Donation Management**: Easily list surplus food with details on type (Veg/Non-Veg/Vegan), quantity, and expiry urgency.
- **🔔 Live Notifications**: Real-time alerts for donors and claimers to ensure fast food redistribution.
- **🤝 Nexus Community**: A dedicated space for community members to coordinate, share stories, and seek help.
- **📱 Responsive Design**: Fully optimized for mobile and desktop, ensuring accessibility for all users.
- **🔒 Secure Authentication**: Robust user management through Supabase Auth.

---

## 🏛️ Architecture & Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with a custom-built, premium design system (Glassmorphism, fluid animations).
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API

### Backend & Infrastructure
- **BaaS**: [Supabase](https://supabase.com/) (Database, Auth, and Real-time subscriptions)
- **Database**: PostgreSQL
- **Mapping**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)

### APIs Used
- **Supabase Auth**: Handles secure user registration, login, and session management.
- **Supabase Database (PostgREST)**: Real-time CRUD operations for food listings and notifications.
- **OpenStreetMap & Leaflet**: Map rendering and geocoding services for food locations.

---

## 🛠️ Local Setup

Follow these steps to get a local copy up and running:

### 1. Clone the repository
```bash
git clone <repository-url>
cd food-management/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the `frontend` directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to see the result.

---

## 🗺️ Project Structure

- `src/components`: Reusable UI components (Navbar, FoodCard, MapView, etc.)
- `src/pages`: Main application views (Dashboard, Donate, Nexus, Auth)
- `src/context`: Authentication and global state management.
- `src/lib`: Supabase client configuration.
- `public/`: Static assets including our custom `favicon.png`.

---

## 🌟 Contributing

We welcome contributions! Please feel free to submit issues or pull requests to help us improve the FoodBridge network.

---

*“Turning surplus food into hope, one connection at a time.”*
