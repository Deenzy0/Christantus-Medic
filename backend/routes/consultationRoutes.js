const express = require('express');
const router = express.Router();
const { bookConsultation } = require('../controllers/consultationController');

// Optional auth: attach user if logged in, but don't require it
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (err) {
    // ignore — guest booking is fine
  }
  next();
};

router.post('/', optionalAuth, bookConsultation);

module.exports = router;
