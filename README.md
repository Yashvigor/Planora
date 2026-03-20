# Planora - Digital Construction Management Platform 🏗️

A comprehensive, full-stack web application designed to bridge the gap between landowners, architects, civil engineers, contractors, and interior designers by streamlining project management and tracking site progress.

## Features ✨
- **🔐 Role-Based Authentication** (Signup/Login with JWT & Google SSO)
- **👤 Multi-Tier Profile Management** (Landowners, Admins, Contractors, etc.)
- **📝 Professional Verification System** (Admins approve/reject credentials)
- **🎨 Modern UI** with Tailwind CSS & Recharts
- **🛡️ Secure Password Hashing** (bcrypt)
- **📱 Responsive Design** (Desktop/Tablet/Mobile)
- **🗄️ Serverless PostgreSQL Database** (Neon.tech)
- **🗺️ ExpertMap System** (Geospatial professional queries based on distance)

## Tech Stack 🛠️

### Backend
- **Node.js & Express.js**
- **PostgreSQL** (Neon Database via `pg`)
- **JWT Authentication** (`jsonwebtoken`)
- **bcrypt** for password hashing
- **Multer** for document and image uploads
- **Google Auth Library** for SSO integration

### Frontend
- **React.js** (Vite build system)
- **React Router DOM**
- **Tailwind CSS**
- **Lucide-React** (Icons)
- **Recharts** (Admin and Client Dashboard Charts)

---

## Getting Started 🚀

### Prerequisites
- Node.js (v16 higher recommended)
- npm or yarn
- Neon Database account
- Google Cloud Console account (for OAuth credentials)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Planora/Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` (if provided) and update with your credentials:
   ```env
   PORT=5000
   DB_USER=your_neon_user
   DB_HOST=your_neon_host
   DB_NAME=your_neon_db_name
   DB_PASSWORD=your_neon_password
   DB_PORT=5432
   JWT_SECRET="your_secure_jwt_secret"
   GOOGLE_CLIENT_ID="your_google_oauth_client_id"
   ```
4. Start the server (Development/Nodemon):
   ```bash
   npm run dev
   ```
   *(Or just `node server.js` to start normally.)*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Planora/Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and insert your API configuration:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## Core Database Schema 💾

*(Consult `Planora.sql` for the full schema.)*

## Key API Endpoints 🔌

### **Authentication**
- `POST /api/auth/login` - Standard email/password login
- `POST /api/auth/google` - Single Sign-On via Google
- `POST /api/auth/verify-otp` - OTP verification for password resets or verifications

### **User & Profile Management**
- `GET /api/user/:id` - Fetch user profile details
- `PUT /api/user/:id/complete-profile` - Multipart upload for Resumes and Certifications
- `GET /api/professionals/nearby` - Fetch contextual experts utilizing Harversine mathematical distance formulas

### **System Administrators**
- `GET /api/admin/users` - Global user verification master pool
- `GET /api/admin/projects` - Admin God-view of ongoing global platform tasks
- `PUT /api/admin/verify/:id` - Accept/Reject user credentials

---

## Security Features 🔐
- Passwords are salted and hashed utilizing **bcrypt**.
- Access routes are shielded behind stateless **JWT Token Middleware**.
- Role-Based restrictions explicitly block unverified professionals.
- Prepared execution statements to prevent **SQL Injection** (`$1, $2` parameterized inputs).
- Multipart limits implemented to secure file upload surfaces via Multer.
