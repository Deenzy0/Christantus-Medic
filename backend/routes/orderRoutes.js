const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, getMyOrders, getOrder } = require('../controllers/orderController');

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

module.exports = router;
