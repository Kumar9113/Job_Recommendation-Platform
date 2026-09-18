const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/users/me
// Returns the logged-in user's profile + their skills, joined
// via the user_skills junction table.
const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const profileResult = await pool.query(
    `SELECT u.id, u.email, p.full_name, p.education, p.experience_years,
            p.preferred_role, p.location, p.bio
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (profileResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const skillsResult = await pool.query(
    `SELECT s.id, s.name, us.proficiency
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1`,
    [userId]
  );

  res.json({
    ...profileResult.rows[0],
    skills: skillsResult.rows,
  });
});

// PUT /api/users/me
// Updates profile fields. Uses COALESCE so a field left out of the
// request body keeps its existing value instead of being wiped.
const updateMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fullName, education, experienceYears, preferredRole, location, bio } = req.body;

  const result = await pool.query(
    `UPDATE profiles SET
       full_name = COALESCE($1, full_name),
       education = COALESCE($2, education),
       experience_years = COALESCE($3, experience_years),
       preferred_role = COALESCE($4, preferred_role),
       location = COALESCE($5, location),
       bio = COALESCE($6, bio),
       updated_at = NOW()
     WHERE user_id = $7
     RETURNING *`,
    [fullName, education, experienceYears, preferredRole, location, bio, userId]
  );

  res.json({ message: 'Profile updated.', profile: result.rows[0] });
});

module.exports = { getMe, updateMe };
