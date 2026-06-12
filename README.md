# 💸 FreeLancePay

<p align="center">
  <a href="https://github.com/Harshit-Mehta-Dev/FreeLancePayApp">
    <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=30&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&width=650&lines=Freelance+Financial+Command+Center;Track+Bills,+Income,+and+Cashflow;Secure,+Fast,+and+Beautiful" alt="FreeLancePay Animated Title" />
  </a>
</p>

<h3 align="center">Premium Financial Command Center for Freelancers</h3>

---

## 📖 Overview

**FreeLancePay** is a comprehensive, modern, and highly interactive web application tailored specifically for freelancers. It serves as a unified command center to manage clients, track time, generate invoices, monitor recurring bills and subscriptions, forecast cashflows, and analyze income. Built with a rich, dynamic aesthetic featuring glassmorphism, parallax effects, and cyber-themed layouts, FreeLancePay makes financial tracking both powerful and visually stunning.

---

## ⚙️ Specifications & Functionalities

### 1. 🔐 Security & Authentication
- **JWT-Based Authentication:** Secure, token-based user sessions.
- **Role-Based Access Control (RBAC):** Distinct roles such as `user`, `admin`, and `senior admin` with specific privileges.
- **Security Dashboard:** Extensive security logging, IP tracking, and a ban system for malicious actors.
- **Data Protection:** Includes rate limiting, Express MongoDB sanitize, XSS sanitizers, and Helmet for robust API protection.

### 2. 💸 Financial Management
- **Bills & Subscriptions:** Track recurring/one-time bills, manage due dates, and monitor status (upcoming, paid, overdue).
- **Income & Expenses:** Comprehensive logging of freelance income streams and business expenses categorized by client.
- **Cashflow Projections:** Real-time metrics and charts projecting financial health based on upcoming bills and expected income.
- **Payment History:** Granular tracking of all completed payments.

### 3. 💼 Freelance Operations
- **Client & Project Management:** Manage client details, associate projects, and track deliverables.
- **Time Tracker:** Built-in timer and manual time entry to accurately track billable hours.
- **Invoicing:** Generate professional invoices, track payment status, and export to PDF.
- **Calendar Integration:** A visually rich calendar view plotting upcoming bills, project deadlines, and payment dates.

### 4. 🚀 Advanced Features
- **Mavin AI Integration:** Predictive models for financial inspections and anomaly detection.
- **Crypto Hub:** Monitor cryptocurrency assets and market trends.
- **Virtual Inbox & Notifications:** Real-time smart notifications for overdue bills and important system alerts.
- **Bug Reports & Feedback:** Dedicated channels for users to report bugs and provide feedback directly to administrators.
- **Interactive UI Audio:** Mechanical switch sound effects engineered via Web Audio API for a tactile user experience.

---

## 🛠️ Technical Stack

### **Frontend (Client)**
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS v4, Vanilla CSS (Glassmorphism & Cyber themes)
- **Animations:** Framer Motion (Motion 12), custom CSS keyframes
- **Charting:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios

### **Backend (Server)**
- **Runtime:** Node.js (Express v5) & Cloudflare Workers (Wrangler & Hono)
- **Database Interfaces:** Better-SQLite3, SQLite3, PostgreSQL, MySQL2, Knex (Query Builder)
- **Authentication & Crypto:** Bcryptjs, Jose (JWT), Google Auth Library, Hash-Wasm
- **Security Middleware:** Helmet, CORS, Rate-Limit, Slow-Down, Express-XSS-Sanitizer
- **Utilities:** ExcelJS (Exports), PDFKit (Invoice PDFs), Nodemailer (Email services)

### **Deployment & DevOps**
- **Containerization:** Docker & Docker Compose (`docker-compose.yml` included)
- **Cloud/Edge Deployment:** Cloudflare Pages (Client) & Cloudflare D1 / Workers (API) via `wrangler`

---

## 🏗️ Architecture Tree

```text
FreeLancePayApp/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── api/                # Axios configurations & API endpoints definition
│   │   ├── assets/             # Images, icons, static resources
│   │   ├── components/         # Reusable UI components (Header, Sidebar, Animations)
│   │   ├── context/            # Global React Context (AuthContext, ThemeContext)
│   │   ├── lib/                # Utility libraries & helper hooks
│   │   ├── pages/              # Route components (Dashboard, Bills, Income, etc.)
│   │   ├── utils/              # Helper functions & Notification Engine
│   │   ├── App.jsx             # Main Application Entry & Routing Definitions
│   │   ├── main.jsx            # React DOM Render Entry
│   │   └── index.css           # Global Styles, Tokens, & Glassmorphism definitions
│   ├── package.json            # Client Dependencies
│   └── vite.config.js          # Vite Build Configuration
├── server/                     # Backend API Service
│   ├── controllers/            # Route Controllers handling business logic
│   ├── middleware/             # Express Middleware (Auth guards, Security checks)
│   ├── infrastructure/         # External service integrations
│   ├── migrations/             # Database migration scripts
│   ├── services/               # Core business services & mailers
│   ├── schema.sql              # Database Schema Definitions (D1/SQLite)
│   ├── server.js               # Main Express Server Entry Point
│   ├── worker.js               # Cloudflare Worker Entry (Serverless deployment)
│   ├── database.js             # Database Connection & Models
│   ├── encryption.js           # Security & Encryption helpers
│   ├── mavin-ai.js             # Mavin AI Predictive Models module
│   ├── wrangler.toml           # Cloudflare Wrangler Configuration
│   └── package.json            # Server Dependencies
├── k8s/                        # Kubernetes deployment configurations
├── docker-compose.yml          # Local Docker environment setup
├── package.json                # Root package configurations (Concurrently run scripts)
└── README.md                   # Application Documentation
```

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm run install-all
   ```

2. **Initialize Database (Local SQLite/D1):**
   ```bash
   npm run d1:init:local --prefix server
   ```

3. **Run Application (Development):**
   ```bash
   npm start
   ```
   *This command leverages `concurrently` to launch both the server and client simultaneously.*

4. **Run via Docker:**
   ```bash
   npm run docker:up
   ```

---
*Developed with ❤️ by the Harshit Mehta Lab.*
