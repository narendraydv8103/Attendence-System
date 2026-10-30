# Attendance System (SmartQR Portal)

A comprehensive real-time Attendance Management System built with a Node.js/Express & Socket.io backend and a modern React/Vite/Tailwind CSS frontend.

## Features

- **Real-time Attendance Tracking**: Live updates via Socket.io.
- **Role-Based Access Control**:
  - **Admin**: Manage departments, courses, teachers, and students.
  - **Teacher**: Create lectures, generate dynamic QR codes, track live lecture attendance, and export reports (Excel/PDF).
  - **Student**: View enrolled courses, scan/mark attendance, and view attendance history and percentage stats.
- **Embedded Database Fallback**: Automatically connects to MongoDB or runs an in-memory database for zero-config demonstration.

## Project Structure

```
├── backend/          # Node.js + Express + MongoDB + Socket.io
│   ├── config/       # Database configuration
│   ├── controllers/  # API controllers (auth, admin, teacher, student)
│   ├── middlewares/  # Authentication & error handling
│   ├── models/       # Mongoose schemas
│   ├── socket/       # Socket.io handlers
│   └── utils/        # Export & helper utilities
├── frontend/         # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── package.json      # Root project scripts
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation & Run

1. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Run Backend**:
   ```bash
   npm run dev:backend
   ```
   Backend runs on `http://localhost:5000`

3. **Run Frontend**:
   ```bash
   npm run dev:frontend
   ```
   Frontend runs on `http://localhost:5173`
