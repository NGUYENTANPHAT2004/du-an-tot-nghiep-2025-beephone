const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model'); // Đảm bảo schema có `socialLogins`
const router = express.Router();

const GOOGLE_CLIENT_ID = "625355579712-siv3ab624075ufh4uatn695jqe80m5fc.apps.googleusercontent.com";  
const jwtSecret = "NzNkMjY0NjMtMmU4NS00OWRlLTk3OWItOTM5OTRjZjFlN2Iw";

// 🛠 Hàm tạo JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: "7d" });
};


// 🔹 Đăng nhập bằng Google
router.post('/auth/google', async (req, res) => {
  try {
    const { token, phone } = req.body;

    if (!token) return res.status(400).json({ message: 'Token Google không hợp lệ' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });

    const { email, name, sub: googleId } = ticket.getPayload();

    if (!email || !googleId) return res.status(400).json({ message: 'Google không trả về thông tin hợp lệ' });  // Look for user with this Google ID or email
    let user = await User.User.findOne({'socialLogins.google': googleId });
    if (!user) {
      const username = name || email.split('@')[0];
      user = new User.User({ 
        username, 
        email, 
        socialLogins: { google: googleId }, 
        role: 'user',
        phone: phone || ''
      });
      await user.save();
    }

    const jwtToken = generateToken(user);
    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({ message: 'Google login failed', error: error.message });
  }
});

// 🔹 Đăng nhập bằng Facebook
router.post('/auth/facebook', async (req, res) => {
  try {
    const { token, phone } = req.body;

    if (!token) return res.status(400).json({ message: 'Token Facebook không hợp lệ' });

    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
    const { id: facebookId, name, email } = response.data;
    let user = await User.User.findOne({'socialLogins.facebook': facebookId });
    if (!user) {
      const userEmail = email || `fb-${facebookId}@placeholder.com`;
      user = new User.User({ 
        username: name || `user-${facebookId}`, 
        email: userEmail, 
        socialLogins: { facebook: facebookId }, 
        role: 'user',
        phone: phone || '' // Store phone if provided
      });
      await user.save();
    }
    const jwtToken = generateToken(user);
    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error('Facebook Auth Error:', error);
    res.status(400).json({ message: 'Facebook login failed', error: error.message });
  }
});

module.exports = router;