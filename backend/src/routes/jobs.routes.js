const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { listJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobs.controller');

router.get('/', listJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, createJob);
router.put('/:id', authenticate, updateJob);
router.delete('/:id', authenticate, deleteJob);

module.exports = router;
