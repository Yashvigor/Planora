# 🏗️ Planora

Planora is a unified digital construction management platform designed to connect land owners with verified construction professionals while enabling transparent, role-based project tracking in one place. It provides a centralized dashboard for monitoring project progress, budgets, documents, tasks, and communication — helping eliminate confusion, delays, and disputes in construction projects.

The platform focuses on simplicity, real-time updates, and accountability, while being scalable for advanced features such as analytics, automated reports, smart notifications, and end-to-end project lifecycle management.

---

## 🛠️ Project Setup

To run Planora locally, you need to set up the **Database**, **Backend**, and **Frontend**.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (v9 or higher)

### 2. Database Setup (PostgreSQL)
1. Open your PostgreSQL terminal (psql) or a GUI like pgAdmin.
2. Create a new database named `Planora`:
   ```sql
   CREATE DATABASE "Planora";
   ```
3. Navigate to the `Backend` directory and import the schema:
   ```bash
   psql -U postgres -d Planora -f Backend/Planora.sql
   ```
   *(Replace `postgres` with your username if different.)*

### 3. Backend Setup
1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (Create a `.env` file or update the existing one):
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=Planora
   DB_PASSWORD=YOUR_PASSWORD
   DB_PORT=5432
   PORT=5000
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   SMTP_USER=YOUR_EMAIL_USER
   SMTP_PASS=YOUR_EMAIL_PASSWORD
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 4. Frontend Setup
1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Google Client ID in `src/main.jsx`:
   ```javascript
   const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🌐 Access
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 🗂️ Project Structure
- **/Frontend**: React + Vite application (Auth UI, Role-based Dashboards).
- **/Backend**: Node.js + Express + PostgreSQL (Auth Logic, OTP, Cloudinary Uploads).
- **/Backend/Planora.sql**: Database schema and initial data.

---
© 2026 Planora Technologies. All rights reserved.
