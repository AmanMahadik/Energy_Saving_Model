const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// Setup transporter using nodemailer (Gmail or any SMTP)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your_email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_app_password'
  }
});

// ✅ Register new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) {
      console.error('Check user DB error:', checkError);
      return res.status(500).json({ message: 'Server database error' });
    }

    if (existingUsers && existingUsers.length > 0) {
      const isUsernameDup = existingUsers.some(u => u.username === username);
      return res.status(400).json({ 
        message: isUsernameDup ? 'Username already exists' : 'Email already exists' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ username, email, password: hashedPassword }])
      .select();

    if (insertError || !newUser || newUser.length === 0) {
      console.error('Error creating user:', insertError);
      return res.status(500).json({ message: 'Error creating user' });
    }

    const createdUser = newUser[0];
    const token = jwt.sign(
      { id: createdUser.id, username: createdUser.username }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: '7d' }
    );

    res.json({ token, id: createdUser.id, username: createdUser.username, email: createdUser.email });
  } catch (error) {
    console.error('Register API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Login DB error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) return res.status(400).json({ message: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: '7d' }
    );

    res.json({ token, id: user.id, username: user.username, email: user.email });
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Forgot Password with internal sendEmail utility
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    const { error: updateError } = await supabase
      .from('users')
      .update({ reset_token: token, reset_expires: expiry })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ message: 'Failed to set reset token' });
    }

    // Generate reset link dynamically based on the request host
    const host = req.headers.host || 'localhost:3000';
    const resetLink = `http://${host}/reset?token=${token}`;

    try {
      await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);
      res.json({ message: 'Reset email sent!' });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ message: 'Failed to send reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Reset password via token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });

  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .gt('reset_expires', Date.now())
      .maybeSingle();

    if (findError || !user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, reset_token: null, reset_expires: null })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Forgot password via Nodemailer (alternative API route)
router.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000;

    await supabase
      .from('users')
      .update({ reset_token: token, reset_expires: expiry })
      .eq('email', email);

    const host = req.headers.host || 'localhost:3000';
    const resetLink = `http://${host}/reset-password/${token}`;
    const mailOptions = {
      from: 'Energy Saver <your_email@gmail.com>',
      to: email,
      subject: 'Reset your password',
      text: `Click the following link to reset your password: ${resetLink}`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Nodemailer error:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.json({ message: 'Password reset email sent' });
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Reset via Nodemailer token
router.post('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .gt('reset_expires', Date.now())
      .maybeSingle();

    if (findError || !user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, reset_token: null, reset_expires: null })
      .eq('email', user.email);

    if (updateError) {
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    res.json({ message: 'Password has been updated' });
  } catch (error) {
    console.error('Reset password token API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Resend reset link
router.post('/resend-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let token = user.reset_token;
    let expires = user.reset_expires;
    const now = Date.now();

    if (!token || expires < now) {
      token = crypto.randomBytes(20).toString('hex');
      expires = now + 3600000;

      await supabase
        .from('users')
        .update({ reset_token: token, reset_expires: expires })
        .eq('id', user.id);
    }

    const host = req.headers.host || 'localhost:3000';
    const resetLink = `http://${host}/reset?token=${token}`;
    
    sendEmail(email, 'Password Reset - Resent', `Click to reset your password: ${resetLink}`)
      .then(() => res.json({ message: 'Reset email resent!' }))
      .catch(err => {
        console.error('Email resent error:', err);
        res.status(500).json({ message: 'Server error sending email' });
      });
  } catch (error) {
    console.error('Resend reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Verify token
router.get('/verify', auth, (req, res) => {
  res.json({ message: 'Token is valid', user: { id: req.user.id, username: req.user.username } });
});

// ✅ Refresh token
router.post('/refresh-token', auth, (req, res) => {
  const token = jwt.sign({ id: req.user.id, username: req.user.username }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
  res.json({ token });
});

// ✅ Get user info
router.get('/user', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
