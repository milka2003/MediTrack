# MediTrack Repository Overview

## Backend
- **Location**: `server/`
- **Stack**: Node.js with Express, Mongoose/MongoDB
- **Entry Point**: `server/server.js`
- **Key Folders**:
  - `server/routes/`: REST API route handlers (auth, admin, billing, etc.)
  - `server/models/`: Mongoose schemas (Patient, Visit, Bill, Doctor, LabTest, Medicine, etc.)
  - `server/middleware/`: Express middleware (authentication, authorization)
  - `server/utils/`: Utility helpers (JWT, messaging, counters)
  - `server/uploads/`: Static file storage served at `/uploads`
- **Configuration**: `.env` file in `server/` with `MONGO_URI`, `PORT`, and `CORS_ORIGIN`

## Frontend
- **Location**: `meditrack-client/`
- **Stack**: React, Material UI, React Router
- **Entry Point**: `meditrack-client/src/index.js`
- **Key Folders**:
  - `src/pages/`: Page-level components (Admin, Billing, Reception, etc.)
  - `src/components/`: Reusable UI components
  - `src/api/`: Axios client and service helpers
  - `public/`: Static assets and HTML template
- **Build Output**: `meditrack-client/build/`
- **Testing**: Playwright E2E specs in `meditrack-client/tests`

## Conventions
- **Styling**: Primarily Material UI components with responsive hooks
- **API Base URL**: Set via Axios client, typically `/api`
- **Authentication**: JWT stored in `localStorage` (`token`, `user`)
- **Imports**: Use absolute paths relative to `server/` and `meditrack-client/src/`

## Development Tips
1. Start backend from `server/` (e.g., `npm start`) and frontend from `meditrack-client/`.
2. Ensure MongoDB is accessible via `MONGO_URI`.
3. Use consistent error handling: send JSON with `message` and status codes.
4. Reuse existing API helpers in `src/api/client.js` for new frontend requests.