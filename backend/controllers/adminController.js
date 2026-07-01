const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Consultation = require('../models/Consultation');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, users: users.map((u) => u.toSafeObject()) });
});

// @desc    Update a user's role or active status (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const updates = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  if (req.params.id === req.user._id.toString() && isActive === false) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.status(200).json({ success: true, message: 'User deleted successfully.' });
});

// @desc    Get dashboard summary stats (admin)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, pendingOrders, paidOrders, pendingConsultations, lowStockProducts] =
    await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.find({ paymentStatus: 'paid' }),
      Consultation.countDocuments({ status: 'pending' }),
      Product.countDocuments({ stock: { $lte: 10 }, isActive: true })
    ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      pendingConsultations,
      lowStockProducts
    },
    recentOrders
  });
});
