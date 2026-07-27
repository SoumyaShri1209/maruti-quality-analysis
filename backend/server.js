// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.error ? result.error.message : 'Success');
console.log('MONGO_URI loaded:', process.env.MONGO_URI ? 'Yes' : 'No');

// Setup file logging
const logFile = path.join(__dirname, 'email-logs.txt');
const logToFile = (msg) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logFile, logMsg, 'utf8');
};

global.logToFile = logToFile;

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/reference', require('./routes/referenceRoutes'));
app.use('/api/inspection', require('./routes/inspectionRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Quality Analysis API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));