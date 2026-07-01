const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create a new order (status pending until payment confirms)
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: 'Shipping address is required.' });
  }

  // Re-validate prices & stock server-side (never trust client-sent prices)
  let itemsTotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Only ${product.stock} left.` });
    }

    const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    itemsTotal += unitPrice * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: unitPrice,
      quantity: item.quantity
    });
  }

  const shippingFee = itemsTotal >= 50000 ? 0 : 1500; // free shipping over ₦50,000
  const totalAmount = itemsTotal + shippingFee;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    itemsTotal,
    shippingFee,
    totalAmount,
    paymentMethod: paymentMethod || 'paystack',
    notes,
    statusHistory: [{ status: 'pending', note: 'Order created' }]
  });

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in user's own orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get single order (must belong to user, or be admin)
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You do not have access to this order.' });
  }

  res.status(200).json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status && status !== 'All') query.orderStatus = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    orders
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, note } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid order status.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.orderStatus = orderStatus;
  order.statusHistory.push({ status: orderStatus, note: note || '' });

  // If order cancelled and stock had been deducted, restock it
  if (orderStatus === 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  await order.save();
  res.status(200).json({ success: true, order });
});
