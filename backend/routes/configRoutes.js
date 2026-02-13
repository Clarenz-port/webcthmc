const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Get config
router.get('/', configController.getConfig);
// Update config
router.put('/', configController.updateConfig);

module.exports = router;
