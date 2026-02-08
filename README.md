# 🏗️ Planora - Unified Construction Management Platform

Planora is a comprehensive digital construction management platform designed to bridge the gap between land owners and verified construction professionals. It facilitates transparent, role-based project tracking, real-time collaboration, and simplified workflow management to eliminate confusion, delays, and disputes in construction projects.

The platform empowers users to manage every stage of construction—from planning and design to execution and finishing—within a single, unified interface.

---

## ⚡ Installation & Setup

Follow these steps to get Planora running on your local machine.

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **Git**

### 2. Database Setup
1. Open your PostgreSQL terminal (psql) or pgAdmin.
2. Create the database:
   ```sql
   CREATE DATABASE "Planora";
   ```
3. Import the schema (run from project root):
   ```bash
   psql -U postgres -d Planora -f Backend/Planora.sql
   ```
   *(Replace `postgres` with your database username if distinct)*

### 3. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `Backend/` with the following variables:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=Planora
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   
   # Email Service (Gmail App Password recommended)
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_app_password
   
   # Google Auth
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

### 4. Run the Application
1. Open a new terminal and navigate to the **Frontend** folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies (if not done yet):
   ```bash
   npm install
   ```
3. Configure Environment:
   *   Open `src/main.jsx` and ensure your `GOOGLE_CLIENT_ID` matches the one in your backend `.env`.
4. Start both **Frontend** and **Backend** with one command:
   ```bash
   npm run dev
   ```

---

## 🌐 Accessing the App

*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## � License

© 2026 Planora Technologies. All Rights Reserved.
