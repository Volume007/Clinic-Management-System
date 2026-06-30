const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const patientRoutes = require('./routes/patient.routes');
const medicineRoutes = require('./routes/medicine.routes');
const dbRoutes = require('./routes/db.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/db', dbRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Catch-all route to serve the frontend entry point
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Checking for existing process...`);
      try {
        const execSync = require('child_process').execSync;
        const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
        const lines = output.split('\n');
        let killed = false;
        for (const line of lines) {
          if (line.includes(`:${PORT}`) && line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && pid !== process.pid.toString()) {
              console.log(`Killing process on port ${PORT} with PID ${pid}...`);
              try {
                execSync(`taskkill /F /PID ${pid}`);
                killed = true;
              } catch (killErr) {
                console.error(`Failed to kill process ${pid}:`, killErr.message);
              }
            }
          }
        }
        if (killed) {
          console.log(`Retrying to start server in 1 second...`);
          setTimeout(startServer, 1000);
        } else {
          console.error(`Could not identify process occupying port ${PORT}.`);
        }
      } catch (e) {
        console.error('Failed to clear process occupying port:', e.message);
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
