const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signStaffToken } = require('../utils/jwt');
const { authAny } = require('../middleware/auth'); // make sure this exists

const router = express.Router();

// STAFF LOGIN
router.post('/staff-login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const query = identifier.includes('@')
      ? { email: identifier }
      : { username: identifier };

    const user = await User.findOne(query);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signStaffToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        username: user.username
      },
      requirePasswordChange: !!user.firstLogin
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CHANGE PASSWORD
router.post('/change-password', authAny, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.auth.id, { passwordHash, firstLogin: false });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
