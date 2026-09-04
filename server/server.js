require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const locationsRoutes = require('./routes/locations');
const alertsRoutes = require('./routes/alerts');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'GiriDrishti API' });
});

/* Authentication */
app.use('/api/auth', authRoutes);

/* Locations Router */
app.use('/api/locations', locationsRoutes);

/* Map Click Route (/api/location-report?lat=...&lng=...) */
app.get('/api/location-report', async (req, res) => {
  const lat = Number(req.query.lat) || 26.55;
  const lng = Number(req.query.lng) || 92.50;

  try {
    const report = await locationsRoutes.generateUnifiedLocationReport(lat, lng);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 5000;

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`GiriDrishti API running on port ${PORT}`));
    })
    .catch(error => {
      console.error('MongoDB connection failed:', error);
      app.listen(PORT, () => console.log(`GiriDrishti API running on port ${PORT} (without DB)`));
    });
} else {
  app.listen(PORT, () => console.log(`GiriDrishti API running on port ${PORT}`));
}
