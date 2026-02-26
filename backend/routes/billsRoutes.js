const express = require('express');
const router = express.Router();
const { addBillPayment, getMemberBills } = require('../controllers/billController');
const { verifyToken } = require('../middleware/authMiddleware');

// keep router paths small; mount in app with prefix like /api/bills
router.post('/add', verifyToken, addBillPayment);
router.get('/member/:memberId', verifyToken, getMemberBills);

module.exports = router;
