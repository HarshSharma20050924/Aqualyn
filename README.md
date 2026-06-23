<div align="center">
  <img src="./Aqualyn.png" alt="Aqualyn Banner" />
  <h1>Aqualyn</h1>
  <p>
    <a href="https://aqualyn.vercel.app">Live Demo</a> |
    <a href="https://aqualyn-web-page.vercel.app/">Landing Page</a>
  </p>
</div>

Aqualyn is a high-performance, fluid social messaging application built for global scalability and secure cross-platform communication. It features a modern, responsive user interface (Liquid UI) and robust backend services to support real-time chat, story sharing, and social networking.

## Architecture Overview

Aqualyn is structured as a monorepo containing multiple distinct environments:

*   **backend/**: Node.js / Express server environment integrated with Prisma (PostgreSQL), Redis, and Socket.IO for real-time state management and authentication.
*   **frontend/**: React-based progressive web application (PWA) using Vite, Tailwind CSS, and Framer Motion.
*   **aqualyn-mobile/**: React Native (Expo) mobile application for Android and iOS.
*   **admin/**: Administrative control panel for managing user data and application metrics.

## Prerequisites

Before setting up the project locally, ensure you have the following installed on your system:

*   Node.js (v20 or higher recommended)
*   npm or yarn
*   PostgreSQL (v15 or higher)
*   Redis (v7 or higher)
*   Docker and Docker Compose (optional, for containerized database setup)
*   Expo CLI (for mobile development)

## Local Setup Guide

Follow these steps to configure and run the Aqualyn ecosystem on your local machine.

### 1. Database and Redis Setup

Aqualyn requires both PostgreSQL and Redis to function. You can either install them natively on your system or use the provided Docker Compose configuration.

**Using Docker Compose (Recommended):**
Navigate to the root directory and run:
```bash
docker-compose up -d
```
This will start a PostgreSQL instance on port 5433 and a Redis instance on port 6379.

### 2. Backend Configuration

Navigate to the backend directory:
```bash
cd backend
npm install
```

Configure your environment variables:
Create a `.env` file in the `backend/` directory based on the provided `.env.example`. Ensure the following core variables are set:
```env
DATABASE_URL="postgresql://aqualyn_user:aqualyn_password@localhost:5433/aqualyn_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_secure_jwt_secret"
PORT=5000
```
*(Refer to the codebase for additional required keys such as Firebase and Supabase credentials if testing full functionality).*

Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Configuration (Web Client)

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The web application will be accessible at `http://localhost:3000`.

### 4. Mobile Application Configuration (Expo)

Open a new terminal and navigate to the mobile directory:
```bash
cd aqualyn-mobile
npm install
```

Configure the environment:
Create a `.env` file in `aqualyn-mobile/` and set the backend URL (use your local machine's IP address if testing on a physical device):
```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

Start the Expo development server:
```bash
npx expo start
```

## Contribution Guidelines

Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) file for details on how to contribute to Aqualyn.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
