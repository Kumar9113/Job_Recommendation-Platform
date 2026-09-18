const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { listSkills, addUserSkill, removeUserSkill } = require('../controllers/skills.controller');

router.get('/skills', listSkills);
router.post('/users/skills', authenticate, addUserSkill);
router.delete('/users/skills/:skillId', authenticate, removeUserSkill);

module.exports = router;
