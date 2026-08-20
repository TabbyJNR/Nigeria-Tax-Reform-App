# 🇳🇬 NRS Tax Tracking System

A full-stack web application for the **Nigeria Revenue Service (NRS)** tax tracking system. Built as a Computer Science Final Year Project.

## 📋 Features

- **Bill Sections Browser**: Explore NRS tax sections by **category** and **search** by title/content.
- **Tax Calculator**: Calculate estimated taxes for **PIT (Personal Income Tax)**, **CIT (Company Income Tax)**, and **VAT (Value Added Tax)**.
- **Tax Calculation History**: Authenticated users can view their previous calculations.
- **Public Feedback System**: Submit feedback (anonymous or authenticated), with an admin review workflow.
- **Admin Dashboard**: Admin can create/update/delete bill sections and manage feedback.
- **Secure Authentication**: User **registration/login** using **JWT**, with **admin role protection**.
- **SQLite Persistence**: Data stored locally in `database.sqlite`.

## 🧱 Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Auth**: JWT + bcrypt

## 📁 Project Structure

- `frontend/` - Static website pages and client-side JavaScript
- `backend/` - Express API, routes, middleware, and database initialization
- `backend/database.sqlite` - SQLite database file (created on first run)

## 🚀 How to Run

### 1) Prerequisites

- Node.js (LTS recommended)

### 2) Install backend dependencies

From the `nigeria-tax-reform-app/backend` folder:

```bash
npm install
```

### 3) Start the server

```bash
npm start
```

The app will run at:

- **Backend/API**: `http://localhost:3000/api`
- **Frontend (UI)**: `http://localhost:3000/`

### 4) Environment variables (optional)

Create a `.env` file inside `backend/` if you want to override defaults.

Supported variables:

- `JWT_SECRET` (default: `nigeria_tax_reform_secret_key_2024`)

Example:

```env
JWT_SECRET=your_strong_secret_here
```

## 🧠 Admin Access

This project uses a `role` field stored in the `users` table.

- Normal users are created with role: `user`
- Admin-only endpoints require role: `admin`

If you need admin access for testing, update the relevant user role in the SQLite database (`users.role`) or extend the registration flow to support admin creation.

## 🔌 API Endpoints (Overview)

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

- **Bill Sections**
  - `GET /api/bills?category=all&search=`
  - `GET /api/bills/:id`
  - `GET /api/bills/categories/all`
  - `POST /api/bills` *(admin)*
  - `PUT /api/bills/:id` *(admin)*
  - `DELETE /api/bills/:id` *(admin)*

- **Calculator**
  - `POST /api/calculator` *(auth)*
  - `GET /api/calculator/history` *(auth)*

- **Feedback**
  - `POST /api/feedback` *(public)*
  - `GET /api/feedback` *(admin)*
  - `GET /api/feedback/my` *(auth)*
  - `DELETE /api/feedback/:id` *(admin)*

## 🧾 Database

On startup, the backend creates these tables (if they don't exist):

- `users`
- `bill_sections` (seeded with NRS tax information sections)
- `feedbacks`
- `tax_calculations`

The seed content is inserted only when `bill_sections` is empty.

## 📝 Notes / Assumptions

- Tax calculation logic uses simplified/estimated rules implemented in the calculator route.
- This project is intended for educational demonstration, not as official tax advice.

## 👨‍🎓 Project Information

Student Matriculation Number: **COS/22U/3143** (NAUB) — Computer Science Final Year Project

© 2026 - Built for Educational Purposes</absolute_path>
</create_file>
