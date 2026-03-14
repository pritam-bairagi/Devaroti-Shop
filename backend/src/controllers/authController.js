const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET + 'refresh', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password, phoneNumber, role, shopName, location, bio } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });

    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Phone number';
      return res.status(400).json({ 
        success: false, 
        message: `${field} already registered` 
      });
    }

    // Validate role
    const validRole = ['user', 'seller', 'courier'].includes(role) ? role : 'user';

    // Create user with OTP
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      role: validRole,
      shopName: validRole === 'seller' ? shopName : undefined,
      location,
      bio
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - Parash Feri',
        html: emailTemplates.verification(otp, user.name)
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email with the OTP sent.',
        userId: user._id,
        requiresVerification: true
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // If email fails, still create user but mark as not verified
      res.status(201).json({
        success: true,
        message: 'Registration successful but verification email failed. Please request a new OTP.',
        userId: user._id,
        requiresVerification: true,
        emailFailed: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and OTP are required' 
      });
    }

    const user = await User.findById(userId).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account already verified' 
      });
    }

    // Check OTP validity
    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Parash Feri!',
        html: emailTemplates.welcome(user.name)
      });
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail if welcome email fails
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Get populated user data
    const populatedUser = await User.findById(user._id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate('cart.product')
      .populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed. Please try again.' 
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { userId, email } = req.body;

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account already verified' 
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send email
    await sendEmail({
      email: user.email,
      subject: 'New OTP for Verification - Parash Feri',
      html: emailTemplates.verification(otp, user.name)
    });

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact support.' 
      });
    }

    // Check email verification
    if (!user.isVerified || !user.isEmailVerified) {
      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();

      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Get populated user data
    const populatedUser = await User.findById(user._id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'cart.product',
        select: 'name price sellingPrice image stock'
      })
      .populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + 'refresh');
      
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const newToken = generateToken(user._id);

      res.status(200).json({
        success: true,
        token: newToken
      });
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'cart.product',
        select: 'name price sellingPrice image stock category'
      })
      .populate({
        path: 'favorites',
        select: 'name price sellingPrice image stock category'
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data' 
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with that email, a password reset link has been sent.' 
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Parash Feri',
        html: emailTemplates.resetPassword(resetUrl, user.name)
      });

      res.status(200).json({ 
        success: true, 
        message: 'Password reset link sent to email' 
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      
      // Reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Password reset request failed' 
    });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new token for auto-login
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed' 
    });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password' 
    });
  }
};

// @desc    Logout (client-side only, but we provide endpoint for completeness)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // With JWT, logout is handled client-side by removing token
  res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
};

// @desc    Check if authenticated
// @route   GET /api/auth/check
// @access  Private
exports.checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication check failed' 
    });
  }
};