require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const skillsRoutes = require('./routes/skills.routes');
const jobsRoutes = require('./routes/jobs.routes');
const applicationsRoutes = require('./routes/applications.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ---- Global middleware (runs on every request, in order) ----
// ALLOWED_ORIGIN restricts CORS to your real frontend domain in production.
// Leave unset in development to allow any origin.
const corsOptions = process.env.ALLOWED_ORIGIN
  ? { origin: process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim()) }
  : {};
app.use(cors(corsOptions)); // allow the React frontend (different origin) to call this API
app.use(express.json());      // parse JSON request bodies into req.body

// ---- Health check (useful for Docker healthchecks) ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---- Route mounting ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', skillsRoutes);          // exposes /api/skills and /api/users/skills
app.use('/api/jobs', jobsRoutes);
app.use('/api', applicationsRoutes);    // exposes /api/jobs/:id/apply and /api/applications
app.use('/api/recommendations', recommendationsRoutes);

// ---- 404 handler for unknown routes ----
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---- Global error handler (must be LAST) ----
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app; // exported for supertest in tests
