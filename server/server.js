const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://meditrack-02.onrender.com',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// test route
app.get('/', (req, res) => {
  res.send('MediTrack API running...');
});

// ==== use our new routes ====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/shifts'));
app.use('/api/reception', require('./routes/reception'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/lab-tests', require('./routes/labTests'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/patient-portal', require('./routes/patient-portal'));
app.use('/api/ml', require('./routes/ml'));
app.use('/api/disease-prediction', require('./routes/diseasePrediction'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/consultation', require('./routes/consultation'));


const { rotateShifts, updateStaffAvailability } = require('./utils/shiftAutomation');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Background automation for shifts (every 15 minutes)
    setInterval(async () => {
      try {
        await rotateShifts();
        await updateStaffAvailability();
      } catch (err) {
        console.error('Error in shift automation:', err);
      }
    }, 15 * 60 * 1000);

    // Initial run
    rotateShifts().catch(console.error);
    updateStaffAvailability().catch(console.error);

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error(err));
