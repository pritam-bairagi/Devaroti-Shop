// controllers/authController.js - Complete Fixed Version
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// ==================== HELPER FUNCTIONS ====================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh', {
    expiresIn: '30d'
  });
};

const getPopulatedUser = async (userId) => {
  return await User.findById(userId)
    .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires -reactivationToken -reactivationExpires')
    .populate({
      path: 'cart.product',
      select: 'name price sellingPrice image stock category'
    })
    .populate({
      path: 'favorites',
      select: 'name price sellingPrice image stock category rating'
    });
};

const validatePhoneNumber = (phone) => {
  const re = /^01[3-9]\d{8}$/;
  return re.test(phone);
};

// ==================== AUTH CONTROLLERS ====================

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password, phoneNumber, role, shopName, location, bio } = req.body;

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid Bangladesh phone number (01XXXXXXXXX)' 
      });
    }

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

    const validRole = ['user', 'seller', 'courier'].includes(role) ? role : 'user';

    const userData = {
      name,
      email,
      password,
      phoneNumber,
      role: validRole,
      location,
      bio
    };

    if (validRole === 'seller') {
      if (!shopName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Shop name is required for sellers' 
        });
      }
      userData.shopName = shopName;
      userData.isSellerApproved = false;
    }

    const user = new User(userData);
    const otp = user.generateOTP();
    await user.save();

    // In production, send actual email here
    console.log(`OTP for ${email}: ${otp}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: user._id,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Registration failed. Please try again.' 
    });
  }
};

const verifyOTP = async (req, res) => {
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

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account already verified' 
      });
    }

    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    user.isVerified = true;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Verification failed. Please try again.' 
    });
  }
};

const resendOTP = async (req, res) => {
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

    const otp = user.generateOTP();
    await user.save();

    console.log(`New OTP for ${user.email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact support.' 
      });
    }

    if (!user.isVerified || !user.isEmailVerified) {
      const otp = user.generateOTP();
      await user.save();

      console.log(`OTP for verification: ${otp}`);

      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    await user.updateLastLogin();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Login failed. Please try again.' 
    });
  }
};

const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and password are required' 
      });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format' 
      });
    }

    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact support.' 
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your account first',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    await user.updateLastLogin();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh');
      
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is deactivated' 
        });
      }

      const newToken = generateToken(user._id);

      return res.status(200).json({
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
    return res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed' 
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await getPopulatedUser(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data' 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with that email, a password reset link has been sent.' 
      });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    console.log(`Reset password link for ${email}: ${resetUrl}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset link sent to email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Password reset request failed' 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
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

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      refreshToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Password reset failed' 
    });
  }
};

const changePassword = async (req, res) => {
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

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to change password' 
    });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        profilePic: user.profilePic,
        level: user.level,
        levelColor: user.levelColor
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication check failed' 
    });
  }
};

const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format' 
      });
    }

    const existingUser = await User.findOne({ 
      phoneNumber, 
      _id: { $ne: user._id } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered' 
      });
    }

    const otp = user.generateOTP();
    user.phoneNumber = phoneNumber;
    await user.save();

    console.log(`Phone OTP for ${phoneNumber}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    });
  }
};

const verifyPhoneOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Verification failed' 
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  loginWithPhone,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  checkAuth,
  sendPhoneOTP,
  verifyPhoneOTP
};