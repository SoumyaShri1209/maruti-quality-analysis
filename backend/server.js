// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

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