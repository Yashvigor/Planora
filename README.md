# Planora — Digital Construction Management Platform 🏗️
A comprehensive, full-stack web application designed to bridge the gap between landowners, architects, civil engineers, contractors, and interior designers by streamlining project management and tracking site progress.

🌐 Overview
Planora enables users to manage construction projects, track site progress in real-time, and discover qualified professionals through a centralized digital platform. It focuses on performance, secure architecture, and seamless collaboration between all stakeholders in the construction lifecycle.

✨ Features
- **🔐 Multi-Role Authentication**: Secure login system with JWT and Google SSO integration.
- **📝 Professional Verification**: Administrative workflow for verifying professional credentials and certifications.s
- **🗺️ ExpertMap System**: Geospatial discovery of professionals using distance-based queries.
- **🏠 Land Auction System**: Live bidding platform for land parcels with automated finalization logic.
- **💬 Real-Time Collaboration**: Instant notifications and updates powered by Socket.io.
- **📊 Analytics Dashboards**: Interactive charts and progress tracking using Recharts and Framer Motion.
- **🗄️ Database-Centric Storage**: Secure BYTEA-based file storage in PostgreSQL for maximum portability.

🛠️ Tech Stack
### Backend
- **Node.js** & **Express.js**
- **PostgreSQL** (Neon Serverless)
- **JWT Authentication**
- **bcrypt** for security
- **Multer** (Memory Storage)
- **Socket.io**
- **Nodemailer** (Brevo SMTP)

### Frontend
- **React.js** (Vite)
- **Tailwind CSS**
- **Framer Motion**
- **Leaflet** (Maps)
- **Socket.io Client**
- **Recharts**

📁 Project Structure (Overview)
Planora/
│
├── Backend/
│   ├── middleware/      # Auth, DNS, Error, and Upload handlers
│   ├── utils/           # Email and Geocoding services
│   ├── server.js        # Main entry point & API routes
│   └── Planora.sql      # Database schema
│
├── Frontend/
│   ├── src/
│   │   ├── pages/       # Route-level components
│   │   ├── components/  # Reusable UI elements
│   │   ├── context/     # Global state management
│   │   └── App.jsx      # Main application logic
│
└── README.md

⚙️ Getting Started
### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Neon PostgreSQL** account

🔙 Backend Setup
1. **Navigate to backend**
   ```bash
   cd Planora/Backend
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create .env file**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   PORT=5000
   DB_HOST=your_neon_host
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=planora
   JWT_SECRET=your_secret_key
   ```
4. **Start server**
   ```bash
   npm run dev
   ```

🔜 Frontend Setup
1. **Navigate to frontend**
   ```bash
   cd Planora/Frontend
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create .env file**
   Copy `.env.example` to `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_id
   ```
4. **Run app**
   ```bash
   npm run dev
   ```

🔌 API Endpoints
### Authentication
- `POST /api/signup` — User registration
- `POST /api/login` — Standard login
- `POST /api/auth/google` — Google SSO
- `POST /api/auth/forgot-password` — Password reset request

### Projects & Lands
- `POST /api/lands` — Register land (Protected)
- `GET /api/lands/user/:userId` — List user lands
- `POST /api/site-progress` — Upload site updates (Protected)

### Documents
- `GET /api/documents/view/:id` — Secure database-backed file serving
- `DELETE /api/documents/:id` — Remove document record (Protected)

🔐 Security
- **Password Hashing**: Industry-standard encryption using bcrypt.
- **JWT Protection**: Stateless authentication for all sensitive API routes.
- **SQL Injection Prevention**: Parameterized queries across all database interactions.
- **DB-Only File Storage**: User documents are stored as BYTEA in PostgreSQL to ensure no data is lost during deployment shifts.
- **Input Validation**: Strict startup validation for environment configurations.


