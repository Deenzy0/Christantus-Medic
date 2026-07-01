const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getPublicKey
} = require('../controllers/paymentController');

// Webhook must be public (Paystack calls this directly, no user logged in)
router.post('/webhook', paystackWebhook);

router.use(protect);
router.post('/initialize', initializePayment);
router.get('/verify/:reference', verifyPayment);
router.get('/public-key', getPublicKey);

module.exports = router;
