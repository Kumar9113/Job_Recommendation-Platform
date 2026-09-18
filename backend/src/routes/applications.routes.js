const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
} = require('../controllers/applications.controller');

// Note: mounted at two base paths in app.js ('/api/jobs' and '/api/applications')
router.post('/jobs/:id/apply', authenticate, applyToJob);
router.get('/applications', authenticate, listMyApplications);
router.put('/applications/:id', authenticate, updateApplicationStatus);

module.exports = router;
