const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/jobs/:id/apply
// The UNIQUE(user_id, job_id) constraint in the DB is our real
// safety net against duplicate applications; we also check first
// so we can return a friendly message instead of a raw DB error.
const applyToJob = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const jobId = req.params.id;

  const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
  if (jobCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const existing = await pool.query(
    'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2',
    [userId, jobId]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'You have already applied to this job.' });
  }

  const result = await pool.query(
    `INSERT INTO applications (user_id, job_id, status) VALUES ($1, $2, 'applied') RETURNING *`,
    [userId, jobId]
  );

  res.status(201).json({ message: 'Application submitted.', application: result.rows[0] });
});

// GET /api/applications
// Returns the logged-in user's applications, joined with job info.
const listMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT a.id, a.status, a.applied_at,
            j.id AS job_id, j.title, j.company, j.location
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.user_id = $1
     ORDER BY a.applied_at DESC`,
    [userId]
  );

  res.json({ applications: result.rows });
});

// PUT /api/applications/:id  (update status, e.g. by recruiter)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['applied', 'shortlisted', 'rejected', 'hired'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  const result = await pool.query(
    'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  res.json({ message: 'Application status updated.', application: result.rows[0] });
});

module.exports = { applyToJob, listMyApplications, updateApplicationStatus };
