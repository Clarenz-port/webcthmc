
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get config
router.get('/', configController.getConfig);
// Update config (must be authenticated)
router.put('/', verifyToken, configController.updateConfig);

module.exports = router;
