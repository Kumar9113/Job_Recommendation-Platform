const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const mlService = require('../services/mlService');

// Helper: fetch everything about this user needed to build their
// "profile text" (the sentence that gets fed into TF-IDF).
async function buildUserPayload(userId) {
  const profileResult = await pool.query(
    `SELECT full_name, education, experience_years, preferred_role, location, bio
     FROM profiles WHERE user_id = $1`,
    [userId]
  );
  const skillsResult = await pool.query(
    `SELECT s.name FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
    [userId]
  );

  const profile = profileResult.rows[0] || {};
  const skills = skillsResult.rows.map((r) => r.name);

  return {
    userId,
    skills,
    education: profile.education || '',
    experience: profile.experience_years || 0,
    preferredRole: profile.preferred_role || '',
    bio: profile.bio || '',
  };
}

// Helper: fetch all jobs in a shape the ML service can consume
async function buildJobsPayload() {
  const jobsResult = await pool.query('SELECT id, title, company, description, category FROM jobs');
  const jobs = jobsResult.rows;

  // attach each job's required skills
  const jobIds = jobs.map((j) => j.id);
  let jobSkillsMap = {};
  if (jobIds.length > 0) {
    const skillsResult = await pool.query(
      `SELECT js.job_id, s.name FROM job_skills js JOIN skills s ON s.id = js.skill_id
       WHERE js.job_id = ANY($1)`,
      [jobIds]
    );
    for (const row of skillsResult.rows) {
      if (!jobSkillsMap[row.job_id]) jobSkillsMap[row.job_id] = [];
      jobSkillsMap[row.job_id].push(row.name);
    }
  }

  return jobs.map((j) => ({
    jobId: j.id,
    title: j.title,
    company: j.company,
    description: j.description,
    category: j.category,
    skills: jobSkillsMap[j.id] || [],
  }));
}

// GET /api/recommendations?topK=5
// Flow: gather user profile + all jobs -> send to Python ML service
// -> ML service returns ranked jobs with similarity scores ->
// we enrich with job details + save a snapshot to `recommendations`
// table (so /api/recommendations/:jobId can explain "why" later).
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const topK = parseInt(req.query.topK, 10) || 5;

  const userPayload = await buildUserPayload(userId);
  const jobsPayload = await buildJobsPayload();

  if (jobsPayload.length === 0) {
    return res.json({ recommendations: [] });
  }

  const mlResponse = await mlService.getRecommendations({
    user: userPayload,
    jobs: jobsPayload,
    topK,
  });

  // mlResponse.recommendations = [{ jobId, score, matchedSkills: [...] }]
  const jobDetailsResult = await pool.query(
    'SELECT id, title, company, location, category FROM jobs WHERE id = ANY($1)',
    [mlResponse.recommendations.map((r) => r.jobId)]
  );
  const jobDetailsMap = Object.fromEntries(jobDetailsResult.rows.map((j) => [j.id, j]));

  const enriched = mlResponse.recommendations.map((r) => ({
    ...jobDetailsMap[r.jobId],
    similarityScore: r.score,
    matchedSkills: r.matchedSkills,
    reasons: buildReasons(r, userPayload),
  }));

  // Save snapshot for explainability + future evaluation
  for (const r of mlResponse.recommendations) {
    await pool.query(
      `INSERT INTO recommendations (user_id, job_id, similarity_score, matched_skills)
       VALUES ($1, $2, $3, $4)`,
      [userId, r.jobId, r.score, (r.matchedSkills || []).join(', ')]
    );
  }

  res.json({ recommendations: enriched });
});

// GET /api/recommendations/:jobId
// Explains why ONE specific job was (or would be) recommended to
// the logged-in user, using simple rule-based reasoning.
const explainRecommendation = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { jobId } = req.params;

  const userPayload = await buildUserPayload(userId);
  const jobResult = await pool.query(
    `SELECT j.id, j.title, j.company, j.description, j.category, j.experience_required
     FROM jobs j WHERE j.id = $1`,
    [jobId]
  );
  if (jobResult.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  const job = jobResult.rows[0];

  const skillsResult = await pool.query(
    `SELECT s.name FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = $1`,
    [jobId]
  );
  const jobSkills = skillsResult.rows.map((r) => r.name);

  const mlResponse = await mlService.getRecommendations({
    user: userPayload,
    jobs: [{ jobId: job.id, title: job.title, company: job.company, description: job.description, category: job.category, skills: jobSkills }],
    topK: 1,
  });

  const result = mlResponse.recommendations[0];
  res.json({
    job: { id: job.id, title: job.title, company: job.company },
    similarityScore: result ? result.score : 0,
    reasons: result ? buildReasons(result, userPayload) : [],
  });
});

// Simple, human-readable, rule-based explanation (NOT SHAP/LIME).
function buildReasons(mlResult, userPayload) {
  const reasons = [];
  if (mlResult.matchedSkills && mlResult.matchedSkills.length > 0) {
    reasons.push(`Skills matched: ${mlResult.matchedSkills.join(', ')}`);
  }
  if (userPayload.preferredRole) {
    reasons.push(`Preferred role considered: ${userPayload.preferredRole}`);
  }
  reasons.push(`Overall text similarity score: ${mlResult.score.toFixed(3)}`);
  return reasons;
}

module.exports = { getRecommendations, explainRecommendation };
