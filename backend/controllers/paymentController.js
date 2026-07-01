const fetch = require('node-fetch');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// @desc    Initialize a Paystack transaction for an existing order
// @route   POST /api/payments/initialize
// @access  Private
exports.initializePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'orderId is required.' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'This order does not belong to you.' });
  }
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'This order has already been paid for.' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.includes('xxxx')) {
    return res.status(500).json({
      success: false,
      message: 'Paystack is not configured on the server. Add a real PAYSTACK_SECRET_KEY to backend/.env'
    });
  }

  // Paystack expects amount in kobo (smallest currency unit) = Naira * 100
  const amountInKobo = Math.round(order.totalAmount * 100);

  const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: req.user.email,
      amount: amountInKobo,
      reference: order.orderNumber,
      callback_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-callback.html?orderId=${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName: req.user.name
      }
    })
  });

  const data = await paystackRes.json();

  if (!data.status) {
    return res.status(400).json({ success: false, message: data.message || 'Failed to initialize payment with Paystack.' });
  }

  order.paymentReference = order.orderNumber;
  await order.save();

  res.status(200).json({
    success: true,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference
  });
});

// @desc    Verify a Paystack transaction after redirect/callback
// @route   GET /api/payments/verify/:reference
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.includes('xxxx')) {
    return res.status(500).json({ success: false, message: 'Paystack is not configured on the server.' });
  }

  const verifyRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const data = await verifyRes.json();

  if (!data.status || data.data.status !== 'success') {
    return res.status(400).json({ success: false, message: 'Payment was not successful.', data: data.data });
  }

  const order = await Order.findOne({ orderNumber: reference });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found for this payment reference.' });
  }

  // Idempotency guard — don't double-process if webhook + redirect both fire
  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.orderStatus = 'processing';
    order.statusHistory.push({ status: 'processing', note: 'Payment confirmed via Paystack' });
    await order.save();

    // Deduct stock now that payment is confirmed
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  res.status(200).json({ success: true, message: 'Payment verified successfully.', order });
});

// @desc    Paystack webhook listener (server-to-server, more reliable than redirect)
// @route   POST /api/payments/webhook
// @access  Public (but verified via signature)
exports.paystackWebhook = asyncHandler(async (req, res) => {
  const crypto = require('crypto');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const order = await Order.findOne({ orderNumber: reference });

    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      order.orderStatus = 'processing';
      order.statusHistory.push({ status: 'processing', note: 'Payment confirmed via Paystack webhook' });
      await order.save();

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }
  }

  // Always respond 200 quickly so Paystack doesn't retry unnecessarily
  res.sendStatus(200);
});

// @desc    Get the public key so frontend can use Paystack inline popup (optional flow)
// @route   GET /api/payments/public-key
// @access  Private
exports.getPublicKey = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, publicKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
});
