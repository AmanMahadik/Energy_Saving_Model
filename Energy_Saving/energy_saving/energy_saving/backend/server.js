const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static HTML files from "public" folder
app.use(express.static(path.join(__dirname, 'public'))); // 🔥 This allows serving reset-password.html

// API Routes
app.use('/api/auth', authRoutes);

// Start server
app.listen(3000, () => {
  console.log('Server running on http://192.168.233.130:3000');
});
