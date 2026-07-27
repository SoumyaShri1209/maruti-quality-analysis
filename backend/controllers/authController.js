const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const getClientBaseUrl = () => {
  return (process.env.CLIENT_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user (with email verification)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationToken = uuidv4();
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    const verifyUrl = `${getClientBaseUrl()}/verify/${verificationToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email – QualiCheck',
        html: `
          <h2>Welcome to QualiCheck!</h2>
          <p>Please click the link below to verify your email:</p>
          <a href="${verifyUrl}">${verifyUrl}</a>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.error('Verification email failed:', emailError.message);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user (only verified accounts)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user registered via Google (no password)
    if (user.googleId && !user.password) {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please login with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Please verify your email before logging in. Check your inbox.',
        isNotVerified: true,  // special flag so frontend can offer resend
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google authentication
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;   // Google ID token from frontend

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but didn't have googleId, attach it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;  // Google emails are verified
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new token
    user.verificationToken = uuidv4();
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${getClientBaseUrl()}/verify/${user.verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your email – QualiCheck',
      html: `<h2>New verification link</h2><a href="${verifyUrl}">Click here to verify</a>`,
    });

    res.json({ message: 'Verification email resent. Please check your inbox.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getMe unchanged
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, verifyEmail, loginUser, googleAuth, resendVerification, getMe };