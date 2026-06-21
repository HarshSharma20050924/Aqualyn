# Aqualyn

Aqualyn is a high-performance, fluid social messaging application built for global scalability and secure cross-platform communication. It features a modern, responsive user interface and robust backend services to support real-time chat, story sharing, and social networking.

## Project Structure

This repository is organized as a monorepo containing all core components of the Aqualyn ecosystem. To maintain a clean architecture, the project is divided into distinct, self-contained directories:

*   **`aqualyn-mobile/`**: The React Native (Expo) mobile application for Android and iOS. This handles the primary native mobile experience, real-time messaging, and push notifications.
*   **`frontend/`**: The React-based progressive web application (PWA). This serves the browser-based client experience.
*   **`backend/`**: The Node.js / Express server environment integrated with Supabase and Socket.IO for real-time state management, authentication, and database interactions.
*   **`admin/`**: The administrative control panel for managing user data, application metrics, and moderation.

## Contribution Guidelines

We welcome contributions to Aqualyn. To ensure code quality and consistency, please adhere to the following guidelines:

### General Workflow

1.  **Fork the repository**: Create a personal fork of the project to begin development.
2.  **Create a feature branch**: Work on a distinct, descriptively named branch (e.g., `feature/message-reactions` or `bugfix/avatar-fallback`).
3.  **Select the correct environment**:
    *   If you are fixing a mobile UI issue, navigate to `aqualyn-mobile/` and run `npm install`.
    *   If you are modifying the web client, navigate to `frontend/` and run `npm install`.
    *   If you are updating API endpoints or WebSocket events, navigate to `backend/` and run `npm install`.
4.  **Test your changes**: Ensure your updates do not break existing functionality. Run the respective development servers (`npm run dev` or `npx expo start`) to verify.
5.  **Submit a Pull Request**: Provide a clear description of your changes, the rationale behind them, and any related issue numbers.

### Setup Instructions

To run the application locally, you will need to set up the respective environments.

#### Mobile App
```bash
cd aqualyn-mobile
npm install
npx expo start
```

#### Web App
```bash
cd frontend
npm install
npm run dev
```

#### Backend Server
```bash
cd backend
npm install
npm run dev
```

Note: Ensure you have the necessary `.env` variables configured for your local backend environment before starting the server.

## Continuous Integration

The project utilizes GitHub Actions for continuous integration and delivery. 
- Pull requests are automatically validated.
- Pushes to the `main` branch trigger Over-The-Air (OTA) EAS updates for the mobile client.
- Creating a new Git tag (e.g., `v1.2.0`) will automatically build a production Android APK and attach it to a GitHub Release.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
