const Consultation = require('../models/Consultation');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Book a consultation (works for logged-in or guest users)
// @route   POST /api/consultations
// @access  Public
exports.bookConsultation = asyncHandler(async (req, res) => {
  const { fullName, email, phone, consultationType, preferredDate, preferredTime, message } = req.body;

  if (!fullName || !email || !phone || !preferredDate || !preferredTime) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const consultation = await Consultation.create({
    user: req.user ? req.user._id : undefined,
    fullName,
    email,
    phone,
    consultationType,
    preferredDate,
    preferredTime,
    message
  });

  res.status(201).json({
    success: true,
    message: 'Consultation booked! Our team will reach out shortly to confirm.',
    consultation
  });
});

// @desc    Get all consultations (admin)
// @route   GET /api/admin/consultations
// @access  Private/Admin
exports.getAllConsultations = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && status !== 'All') query.status = status;

  const consultations = await Consultation.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: consultations.length, consultations });
});

// @desc    Update consultation status (admin)
// @route   PUT /api/admin/consultations/:id
// @access  Private/Admin
exports.updateConsultation = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  const consultation = await Consultation.findByIdAndUpdate(
    req.params.id,
    { status, adminNote },
    { new: true, runValidators: true }
  );

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation not found.' });
  }

  res.status(200).json({ success: true, consultation });
});
