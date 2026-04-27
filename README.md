# 🚀 FreeLancePay: The Ultimate Freelancer Financial Command Center

[![Live Platform](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=cloudflare)](https://freelance-pay-cloud.pages.dev/)
[![API Status](https://img.shields.io/badge/API-Operational-blue?style=for-the-badge&logo=cloudflare-workers)](https://freelance-pay-api.cyber-freelance.workers.dev/api/health)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20React-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![D1](https://img.shields.io/badge/Database-Cloudflare%20D1-F38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)

**FreeLancePay** is a premium, serverless financial management ecosystem built specifically for modern freelancers. It bridges the gap between complex accounting software and simple spreadsheets, providing a beautiful, glassmorphic interface to track your bills, manage income, and visualize your financial future.

---

## 🌟 Key Features

### 📊 Intelligence Dashboard
*   **Real-time Financial Health**: Instantly see Total Due, Overdue balances, and Monthly Revenue.
*   **Interactive Cashflow Projections**: 6-month visual forecasts using smooth, dynamic charts.
*   **Recent Activity**: Quick-glance list of upcoming bills and recent income.

### 📅 Smart Billing & Income
*   **One-Click Payments**: Quickly mark bills as paid and generate payment history.
*   **Client Management**: Track income by client and category for better tax preparation.
*   **Overdue Alerts**: Automatic visual indicators for bills that need immediate attention.

### 🔐 Security & Administration
*   **Root Admin Access**: Dedicated command center for the primary administrator (`harshitmehta1012@gmail.com`).
*   **System Monitoring**: Real-time security logs and system-wide statistics.
*   **Encrypted Storage**: All sensitive data is protected using Cloudflare's enterprise-grade infrastructure.

---

## 🏗️ Technical Architecture

### **Frontend (Vite + React)**
- **Styling**: Vanilla CSS with a focus on Glassmorphism and Fluid UI.
- **State Management**: React Context API (Auth, Theme, Toast).
- **Icons**: Custom SVG system for a lightweight, premium feel.

### **Backend (Cloudflare Workers)**
- **Framework**: Hono (High-performance serverless framework).
- **Authentication**: JWT-based secure sessions + Google OAuth 2.0 Integration.
- **Middlewares**: CORS, JWT Verification, and Security Logging.

### **Database (Cloudflare D1)**
- **Type**: SQL-based serverless database.
- **Tables**: Users, Bills, Income, Payments, and Security Logs.

---

## 📂 Repository Organization

This repository is structured for both simplicity and scalability:

*   **`main` branch**: The master version containing the full integrated platform.
*   **`frontend` branch**: Pure React source code for frontend-only contributions.
*   **`backend` branch**: Pure Hono/Worker code for backend-specific updates.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Cloudflare Wrangler CLI

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd server
npm install
npx wrangler dev
```

### 4. Database Initialization
```bash
npx wrangler d1 execute freelance-pay-db --file=server/schema.sql --local
```

## ⚙️ CI/CD & Automated Deployment

This repository is equipped with **GitHub Actions** for fully automated deployments. Every time you push to the `main` branch, the following happens:
1.  **Backend**: The Cloudflare Worker is updated and deployed.
2.  **Frontend**: The React app is built and deployed to Cloudflare Pages.

### 🔑 Required GitHub Secrets
To enable this, go to **Settings > Secrets and variables > Actions** in your GitHub repo and add:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (with Edit Workers/Pages permissions).
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

---

## 🌎 Deployment Environments
You can track your deployments directly in the GitHub **"Deployments"** sidebar:
- **Production**: [https://freelance-pay-cloud.pages.dev/](https://freelance-pay-cloud.pages.dev/)
- **API Edge**: [https://freelance-pay-api.cyber-freelance.workers.dev](https://freelance-pay-api.cyber-freelance.workers.dev)

---

## 🛠️ Security First
This project follows strict security protocols:
- **No hardcoded secrets**: All API keys and JWT secrets are managed via Cloudflare Secret Management.
- **Strict .gitignore**: Prevents accidental leakage of local databases or temporary files.
- **HTTPS Only**: Enforced via Cloudflare's SSL edge.

---

## 👤 Author
Developed with ❤️ by **Antigravity AI** for **Harshit Mehta**.

---

*Copyright © 2026 FreeLancePay. All rights reserved.*
