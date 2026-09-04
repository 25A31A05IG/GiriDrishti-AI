require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const locationsRoutes =
  require('./routes/locations');

const alertsRoutes =
  require('./routes/alerts');

const reportsRoutes =
  require('./routes/reports');

const authRoutes =
  require('./routes/auth');

const app = express();

app.use(
  cors()
);

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      'uploads'
    )
  )
);

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      ok: true,
      service:
        'GiriDrishti API'
    });
  }
);

/* Authentication */
app.use(
  '/api/auth',
  authRoutes
);

/* Existing routes */
app.use(
  '/api/locations',
  locationsRoutes
);

app.use(
  '/api/alerts',
  alertsRoutes
);

app.use(
  '/api/reports',
  reportsRoutes
);

const PORT =
  process.env.PORT || 5000;

mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(() => {
    console.log(
      'MongoDB connected'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `GiriDrishti API running on port ${PORT}`
        );
      }
    );
  })
  .catch(error => {
    console.error(
      'MongoDB connection failed:',
      error
    );
  });
