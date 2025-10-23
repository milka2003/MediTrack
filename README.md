# MediTrack - Hospital Management System

A full-stack hospital management system built with Node.js/Express backend and React frontend with Material UI.

## 📋 Project Structure

```
meditrack/
├── server/                 # Express backend API
│   ├── routes/            # API route handlers
│   ├── models/            # Mongoose schemas
│   ├── middleware/        # Auth & authorization middleware
│   ├── utils/             # Helper functions
│   ├── uploads/           # File storage directory
│   ├── server.js          # Express app entry point
│   └── package.json
├── meditrack-client/      # React frontend app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── api/           # Axios client & services
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud connection)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
CORS_ORIGIN=http://localhost:3000
```

4. Start the server:
```bash
npm start          # Production
npm run dev        # Development (with nodemon)
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd meditrack-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

App will run on `http://localhost:3000`

## 🔧 Available Scripts

### Backend (`server/`)
- `npm start` - Start production server
- `npm run dev` - Start with nodemon (auto-reload)

### Frontend (`meditrack-client/`)
- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📚 API Endpoints

- `/api/auth` - Authentication routes
- `/api/admin` - Admin management
- `/api/reception` - Reception/patient check-in
- `/api/visits` - Patient visits
- `/api/doctor` - Doctor operations
- `/api/lab` - Laboratory operations
- `/api/medicines` - Medicine management
- `/api/pharmacy` - Pharmacy operations
- `/api/lab-tests` - Lab tests
- `/api/billing` - Billing & invoices
- `/api/reports` - Reports generation
- `/api/uploads` - File uploads

## 🔐 Security Notes

**⚠️ IMPORTANT:**
- Never commit `.env` files with real credentials
- Use `.env.example` as a template
- Rotate API keys regularly
- Use environment variables for all secrets
- Keep JWT secrets secure and long

## 📦 Dependencies

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `cors` - Cross-origin requests
- `multer` - File uploads
- `pdfkit` - PDF generation
- `puppeteer` - Browser automation
- `twilio` - SMS/WhatsApp messaging

### Frontend
- `react` - UI library
- `@mui/material` - Material Design components
- `axios` - HTTP client
- `react-router-dom` - Routing
- `recharts` - Charts & graphs
- `jspdf` - PDF export

## 🧪 Testing

### E2E Tests
```bash
cd meditrack-client
npx playwright test
```

## 📝 Git Workflow

1. Create a feature branch:
```bash
git checkout -b feature/your-feature
```

2. Commit changes:
```bash
git commit -m "feat: description of changes"
```

3. Push to GitHub:
```bash
git push origin feature/your-feature
```

4. Create a Pull Request on GitHub

## 🐛 Common Issues

**MongoDB Connection Failed**
- Check MONGO_URI in `.env`
- Ensure MongoDB is running
- Verify network access if using MongoDB Atlas

**Port Already in Use**
- Change PORT in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

**npm install fails**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## 📄 License

ISC

## 👥 Contributors

Milka Hospital Team