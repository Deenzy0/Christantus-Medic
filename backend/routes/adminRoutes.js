const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');

const { getAllUsers, updateUser, deleteUser, getDashboardStats } = require('../controllers/adminController');

const { getAllConsultations, updateConsultation } = require('../controllers/consultationController');

// Every route below requires a logged-in admin
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Consultations
router.get('/consultations', getAllConsultations);
router.put('/consultations/:id', updateConsultation);

module.exports = router;
