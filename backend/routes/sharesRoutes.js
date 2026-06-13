const express = require('express');
const router = express.Router();

const sharesController = require('../controllers/sharesController');
const { verifyToken } = require('../middleware/authMiddleware');

// =============================
// ADD SHARES
// =============================
router.post('/add', verifyToken, sharesController.addShares);

// =============================
// GET SHARES OF SPECIFIC MEMBER
// =============================
router.get('/member/:id', verifyToken, sharesController.getMemberShares);

// =============================
// GET CONTRIBUTIONS OF SPECIFIC MEMBER (for loan eligibility)
// =============================
router.get('/member/:id/contributions', verifyToken, sharesController.getMemberContributions);

// =============================
// GET SAVINGS OF SPECIFIC MEMBER (cannot be used for loans)
// =============================
router.get('/member/:id/savings', verifyToken, sharesController.getMemberSavings);

// =============================
// GET SHARES SUMMARY BY YEAR
// =============================
router.get('/by-year/:year', sharesController.getSharesByYear);

// =============================
// OPTIONAL: GET ALL SHARES (used by frontend Shares table UI)
// /api/shares
// /api/shares/all
// =============================

// Use controller version if defined
router.get('/', verifyToken, async (req, res) => {
  try {
    // If controller has getAllShares, use that
    if (typeof sharesController.getAllShares === 'function') {
      return sharesController.getAllShares(req, res);
    }

    // Fallback: direct model fetch (no need to edit your controller)
    const Shares = require('../models/shares');
    const rows = await Shares.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/shares:', err);
    return res.status(500).json({ message: 'Error fetching shares', error: err.message });
  }
});

// Alias: /api/shares/all → same result
router.get('/all', verifyToken, async (req, res) => {
  try {
    const Shares = require('../models/shares');
    const rows = await Shares.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/shares/all:', err);
    return res.status(500).json({ message: 'Error fetching all shares', error: err.message });
  }
});

module.exports = router;
