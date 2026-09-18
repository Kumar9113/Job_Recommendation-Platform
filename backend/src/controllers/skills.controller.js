const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/skills
// Returns the master list of all skills (used to populate a
// dropdown/autocomplete on the frontend profile form).
const listSkills = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT id, name FROM skills ORDER BY name ASC');
  res.json({ skills: result.rows });
});

// POST /api/users/skills
// Adds a skill to the logged-in user's profile. If the skill name
// doesn't exist yet in the master `skills` table, it's created.
const addUserSkill = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { skillName, proficiency } = req.body;

  if (!skillName) {
    return res.status(400).json({ error: 'skillName is required.' });
  }

  let skillResult = await pool.query('SELECT id FROM skills WHERE name = $1', [skillName]);
  let skillId;
  if (skillResult.rows.length === 0) {
    const inserted = await pool.query(
      'INSERT INTO skills (name) VALUES ($1) RETURNING id',
      [skillName]
    );
    skillId = inserted.rows[0].id;
  } else {
    skillId = skillResult.rows[0].id;
  }

  await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, proficiency)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency = EXCLUDED.proficiency`,
    [userId, skillId, proficiency || 'intermediate']
  );

  res.status(201).json({ message: 'Skill added.', skillId, skillName });
});

// DELETE /api/users/skills/:skillId
const removeUserSkill = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { skillId } = req.params;

  await pool.query(
    'DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skillId]
  );

  res.json({ message: 'Skill removed.' });
});

module.exports = { listSkills, addUserSkill, removeUserSkill };
