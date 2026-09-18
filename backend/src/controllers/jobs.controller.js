const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/jobs?skill=python&location=hyderabad&page=1&limit=10&sort=newest
// This is the "search/filter" endpoint. We build the SQL query
// dynamically: start with a base query, then append WHERE
// conditions only for filters the client actually sent.
const listJobs = asyncHandler(async (req, res) => {
  const { title, skill, location, minExperience, page = 1, limit = 10, sort = 'newest' } = req.query;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  let baseQuery = `
    SELECT DISTINCT j.id, j.title, j.company, j.location, j.experience_required,
           j.description, j.category, j.created_at
    FROM jobs j
  `;

  // Searching by skill requires a join to job_skills + skills
  if (skill) {
    baseQuery += ` JOIN job_skills js ON js.job_id = j.id
                   JOIN skills s ON s.id = js.skill_id `;
    conditions.push(`s.name ILIKE $${paramIndex++}`);
    values.push(`%${skill}%`);
  }

  if (title) {
    conditions.push(`j.title ILIKE $${paramIndex++}`);
    values.push(`%${title}%`);
  }
  if (location) {
    conditions.push(`j.location ILIKE $${paramIndex++}`);
    values.push(`%${location}%`);
  }
  if (minExperience) {
    conditions.push(`j.experience_required >= $${paramIndex++}`);
    values.push(minExperience);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Sorting
  const sortMap = {
    newest: 'j.created_at DESC',
    oldest: 'j.created_at ASC',
    experience: 'j.experience_required ASC',
  };
  baseQuery += ` ORDER BY ${sortMap[sort] || sortMap.newest}`;

  // Pagination: OFFSET/LIMIT is the simplest pagination strategy.
  // page=1 limit=10 -> OFFSET 0; page=2 limit=10 -> OFFSET 10, etc.
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
  const offset = (pageNum - 1) * limitNum;

  baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  values.push(limitNum, offset);

  const result = await pool.query(baseQuery, values);

  res.json({
    page: pageNum,
    limit: limitNum,
    count: result.rows.length,
    jobs: result.rows,
  });
});

// GET /api/jobs/:id
const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (jobResult.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const skillsResult = await pool.query(
    `SELECT s.id, s.name FROM job_skills js
     JOIN skills s ON s.id = js.skill_id
     WHERE js.job_id = $1`,
    [id]
  );

  res.json({ ...jobResult.rows[0], requiredSkills: skillsResult.rows });
});

// POST /api/jobs  (admin/recruiter action)
const createJob = asyncHandler(async (req, res) => {
  const { title, company, location, experienceRequired, description, category, skillNames } = req.body;

  if (!title || !company || !description) {
    return res.status(400).json({ error: 'title, company and description are required.' });
  }

  const result = await pool.query(
    `INSERT INTO jobs (title, company, location, experience_required, description, category)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, company, location, experienceRequired || 0, description, category]
  );
  const job = result.rows[0];

  if (Array.isArray(skillNames)) {
    for (const name of skillNames) {
      let skillRes = await pool.query('SELECT id FROM skills WHERE name = $1', [name]);
      let skillId;
      if (skillRes.rows.length === 0) {
        const inserted = await pool.query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [name]);
        skillId = inserted.rows[0].id;
      } else {
        skillId = skillRes.rows[0].id;
      }
      await pool.query(
        'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [job.id, skillId]
      );
    }
  }

  res.status(201).json({ message: 'Job created.', job });
});

// PUT /api/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, company, location, experienceRequired, description, category } = req.body;

  const result = await pool.query(
    `UPDATE jobs SET
       title = COALESCE($1, title),
       company = COALESCE($2, company),
       location = COALESCE($3, location),
       experience_required = COALESCE($4, experience_required),
       description = COALESCE($5, description),
       category = COALESCE($6, category)
     WHERE id = $7 RETURNING *`,
    [title, company, location, experienceRequired, description, category, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  res.json({ message: 'Job updated.', job: result.rows[0] });
});

// DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  res.json({ message: 'Job deleted.' });
});

module.exports = { listJobs, getJobById, createJob, updateJob, deleteJob };
