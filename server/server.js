const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
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
app.use('/api/tasks', require('./routes/task.routes'));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error(err));
