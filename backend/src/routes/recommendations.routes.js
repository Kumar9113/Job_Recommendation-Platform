const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getRecommendations, explainRecommendation } = require('../controllers/recommendations.controller');

router.get('/', authenticate, getRecommendations);
router.get('/:jobId', authenticate, explainRecommendation);

module.exports = router;
