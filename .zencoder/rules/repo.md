---
description: Repository Information Overview
alwaysApply: true
---

# MediTrack Information

## Summary
MediTrack is a comprehensive Hospital Management System designed to streamline medical facility operations. The application follows a client-server architecture with a React frontend and Node.js/Express backend connected to MongoDB.

## Structure
- **server/**: Backend Express.js API with MongoDB integration
- **meditrack-client/**: React-based frontend application
- **Root directory**: Contains project-wide configuration and scripts

## Language & Runtime
**Language**: JavaScript/Node.js (Backend), JavaScript/React (Frontend)
**Version**: Node.js >=16.0.0, npm >=8.0.0
**Build System**: npm scripts
**Package Manager**: npm

## Dependencies
**Backend Dependencies**:
- express (^5.1.0): Web framework
- mongoose (^8.17.1): MongoDB ODM
- bcrypt (^6.0.0): Password hashing
- jsonwebtoken (^9.0.2): Authentication
- multer (^2.0.2): File uploads
- pdfkit (^0.17.2): PDF generation
- puppeteer (^24.22.2): Browser automation
- twilio (^5.9.0): SMS messaging

**Frontend Dependencies**:
- react (^19.1.1): UI library
- react-router-dom (^7.8.1): Routing
- @mui/material (^7.3.1): Material UI components
- axios (^1.11.0): HTTP client
- recharts (^3.3.0): Charting library
- jspdf (^3.0.3): PDF generation

## Build & Installation
```bash
# Install all dependencies (root, client, server)
npm run install-all

# Start backend server
npm run start

# Start frontend development server
npm run client

# Build frontend for production
npm run build
```

## Testing
**Framework**: Playwright for E2E testing
**Test Location**: meditrack-client/e2e
**Configuration**: playwright.config.ts
**Run Command**:
```bash
cd meditrack-client
npx playwright test
```

## Project Components

### Backend API
**Entry Point**: server/server.js
**Routes**:
- /api/auth: Authentication
- /api/admin: Admin operations
- /api/reception: Patient reception
- /api/visits: Patient visits
- /api/doctor: Doctor operations
- /api/lab: Laboratory management
- /api/pharmacy: Pharmacy operations
- /api/billing: Billing and payments
- /api/reports: Reporting

### Frontend Application
**Entry Point**: meditrack-client/src/index.js
**Key Modules**:
- Admin Dashboard: Staff, departments, services management
- Doctor Dashboard: Patient consultations, prescriptions
- Reception: Patient registration, visit management
- Lab: Test management and reporting
- Pharmacy: Medicine dispensing, inventory
- Billing: Payment processing

**Authentication**: JWT-based with localStorage storage
**API Communication**: Axios client configured in src/api/client.js