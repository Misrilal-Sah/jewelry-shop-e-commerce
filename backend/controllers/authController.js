const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, sendOTPEmail } = require('../services/emailService');
require('dotenv').config();

// In-memory OTP storage (for simplicity - use Redis in production)
const otpStore = new Map();

// Helper: Store OTP
const storeOTP = (email, otp, type, userData = null) => {
  const key = `${type}:${email}`;
  otpStore.set(key, {
    otp,
    userData,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
};

// Helper: Verify OTP
const verifyStoredOTP = (email, otp, type) => {
  const key = `${type}:${email}`;
  const stored = otpStore.get(key);
  
  if (!stored) return { valid: false, message: 'OTP not found or expired' };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: 'OTP expired' };
  }
  if (stored.otp !== otp) return { valid: false, message: 'Invalid OTP' };
  
  return { valid: true, userData: stored.userData };
};

// Helper: Clear OTP
const clearOTP = (email, type) => {
  otpStore.delete(`${type}:${email}`);
};

// Send Signup OTP
const sendSignupOTP = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate and send OTP
    const otp = generateOTP();
    storeOTP(email, otp, 'signup', { name, email, password, phone });
    
    await sendOTPEmail(email, otp, 'signup');
    
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify Signup OTP and Complete Registration
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const result = verifyStoredOTP(email, otp, 'signup');
    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }
    
    const { name, password, phone } = result.userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const [insertResult] = await pool.query(
      'INSERT INTO users (name, email, password, phone, email_verified) VALUES (?, ?, ?, ?, TRUE)',
      [name, email, hashedPassword, phone]
    );
    
    clearOTP(email, 'signup');
    
    const token = jwt.sign(
      { id: insertResult.insertId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: insertResult.insertId, name, email, role: 'customer' }
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send Password Reset OTP
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Email not registered' });
    }
    
    // Generate and send OTP
    const otp = generateOTP();
    storeOTP(email, otp, 'reset');
    
    await sendOTPEmail(email, otp, 'reset');
    
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send reset OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify Password Reset OTP
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const result = verifyStoredOTP(email, otp, 'reset');
    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }
    
    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password (after OTP verification)
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, decoded.email]
    );
    
    clearOTP(decoded.email, 'reset');
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password (for logged-in users)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register new user (legacy - kept for backward compatibility)
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result.insertId, name, email, role: 'customer' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with role info
    const [users] = await pool.query(
      `SELECT u.*, r.permissions, r.name as role_name, r.display_name as role_display_name, r.can_assign_roles
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, role_name: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Audit log for admin login
    if (user.role === 'admin') {
      const auditLogger = require('../services/auditLogger');
      auditLogger.login(user.id, user.name, req);
    }

    // Parse permissions if admin
    let permissions = null;
    let canAssignRoles = [];
    if (user.role === 'admin' && user.permissions) {
      permissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions;
      canAssignRoles = typeof user.can_assign_roles === 'string'
        ? JSON.parse(user.can_assign_roles)
        : user.can_assign_roles || [];
    }

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        role_id: user.role_id,
        role_name: user.role_name,
        role_display_name: user.role_display_name,
        permissions,
        canAssignRoles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.profile_image, u.created_at,
              u.role_id, r.name as role_name, r.display_name as role_display_name, 
              r.permissions, r.can_assign_roles
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Parse permissions if admin
    let permissions = null;
    let canAssignRoles = [];
    if (user.role === 'admin' && user.permissions) {
      permissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions;
      canAssignRoles = typeof user.can_assign_roles === 'string'
        ? JSON.parse(user.can_assign_roles)
        : user.can_assign_roles || [];
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile_image: user.profile_image,
      created_at: user.created_at,
      role_id: user.role_id,
      role_name: user.role_name,
      role_display_name: user.role_display_name,
      permissions,
      canAssignRoles
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, profile_image } = req.body;

    // If profile_image is explicitly null, clear it
    if (profile_image === null) {
      await pool.query(
        'UPDATE users SET name = ?, phone = ?, profile_image = NULL WHERE id = ?',
        [name, phone, req.user.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = ?, phone = ? WHERE id = ?',
        [name, phone, req.user.id]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get birthday/anniversary dates with cooldown info
const getSpecialDates = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT birthday, anniversary, 
             birthday_last_edited, anniversary_last_edited,
             birthday_edit_count, anniversary_edit_count
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    const user = users[0];
    const now = new Date();
    const COOLDOWN_DAYS = 180; // 6 months
    const MAX_EDITS_PER_YEAR = 2;
    
    const calculateCooldown = (lastEdited, editCount) => {
      if (!lastEdited) return { canEdit: true, daysLeft: 0, editsRemaining: MAX_EDITS_PER_YEAR };
      
      const lastEdit = new Date(lastEdited);
      const daysSinceEdit = Math.floor((now - lastEdit) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, COOLDOWN_DAYS - daysSinceEdit);
      const canEdit = daysLeft === 0 && editCount < MAX_EDITS_PER_YEAR;
      const editsRemaining = Math.max(0, MAX_EDITS_PER_YEAR - editCount);
      
      return { canEdit, daysLeft, editsRemaining, lastEdited };
    };
    
    res.json({
      birthday: user.birthday,
      anniversary: user.anniversary,
      birthdayCooldown: calculateCooldown(user.birthday_last_edited, user.birthday_edit_count || 0),
      anniversaryCooldown: calculateCooldown(user.anniversary_last_edited, user.anniversary_edit_count || 0)
    });
  } catch (error) {
    console.error('Get special dates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update birthday or anniversary with cooldown restriction
const updateSpecialDates = async (req, res) => {
  try {
    const { birthday, anniversary } = req.body;
    const COOLDOWN_DAYS = 180; // 6 months
    const MAX_EDITS_PER_YEAR = 2;
    
    const [users] = await pool.query(`
      SELECT birthday, anniversary,
             birthday_last_edited, anniversary_last_edited,
             birthday_edit_count, anniversary_edit_count
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    const user = users[0];
    const now = new Date();
    const updates = [];
    const values = [];
    
    // Check and update birthday
    if (birthday !== undefined && birthday !== user.birthday) {
      const lastEdit = user.birthday_last_edited ? new Date(user.birthday_last_edited) : null;
      if (lastEdit) {
        const daysSinceEdit = Math.floor((now - lastEdit) / (1000 * 60 * 60 * 24));
        if (daysSinceEdit < COOLDOWN_DAYS) {
          return res.status(400).json({ 
            message: `You can update your birthday after ${COOLDOWN_DAYS - daysSinceEdit} days`,
            daysLeft: COOLDOWN_DAYS - daysSinceEdit
          });
        }
        if ((user.birthday_edit_count || 0) >= MAX_EDITS_PER_YEAR) {
          return res.status(400).json({ 
            message: 'You have reached the maximum number of birthday edits for this year'
          });
        }
      }
      updates.push('birthday = ?', 'birthday_last_edited = NOW()', 'birthday_edit_count = birthday_edit_count + 1');
      values.push(birthday);
    }
    
    // Check and update anniversary
    if (anniversary !== undefined && anniversary !== user.anniversary) {
      const lastEdit = user.anniversary_last_edited ? new Date(user.anniversary_last_edited) : null;
      if (lastEdit) {
        const daysSinceEdit = Math.floor((now - lastEdit) / (1000 * 60 * 60 * 24));
        if (daysSinceEdit < COOLDOWN_DAYS) {
          return res.status(400).json({ 
            message: `You can update your anniversary after ${COOLDOWN_DAYS - daysSinceEdit} days`,
            daysLeft: COOLDOWN_DAYS - daysSinceEdit
          });
        }
        if ((user.anniversary_edit_count || 0) >= MAX_EDITS_PER_YEAR) {
          return res.status(400).json({ 
            message: 'You have reached the maximum number of anniversary edits for this year'
          });
        }
      }
      updates.push('anniversary = ?', 'anniversary_last_edited = NOW()', 'anniversary_edit_count = anniversary_edit_count + 1');
      values.push(anniversary);
    }
    
    if (updates.length === 0) {
      return res.json({ message: 'No changes made' });
    }
    
    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    
    res.json({ message: 'Special dates updated successfully' });
  } catch (error) {
    console.error('Update special dates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile image to Cloudinary
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { uploadFromBuffer, extractPublicId, deleteImage } = require('../services/cloudinaryService');

    // Get current profile image to delete from Cloudinary
    const [users] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [req.user.id]);
    const oldImage = users[0]?.profile_image;

    // Upload new image to Cloudinary (Others folder for profile images)
    const result = await uploadFromBuffer(req.file.buffer, 'Others', 'profile');
    const imageUrl = result.secure_url;

    // Update database
    await pool.query(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [imageUrl, req.user.id]
    );

    // Delete old image from Cloudinary if it exists
    if (oldImage && oldImage.includes('cloudinary.com')) {
      const publicId = extractPublicId(oldImage);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (e) {
          console.error('Failed to delete old profile image:', e.message);
        }
      }
    }

    res.json({ 
      message: 'Profile image updated successfully',
      profile_image: imageUrl
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user addresses
const getAddresses = async (req, res) => {
  try {
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
      [req.user.id]
    );
    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    const { name, phone, address_line1, address_line2, city, state, pincode, is_default, address_type } = req.body;

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, name, phone, address_line1, address_line2, city, state, pincode, is_default, address_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, phone, address_line1, address_line2, city, state, pincode, is_default || false, address_type || 'home']
    );

    res.status(201).json({ message: 'Address added', id: result.insertId });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { name, phone, address_line1, address_line2, city, state, pincode, address_type } = req.body;
    
    await pool.query(
      `UPDATE addresses SET name = ?, phone = ?, address_line1 = ?, address_line2 = ?, 
       city = ?, state = ?, pincode = ?, address_type = ? WHERE id = ? AND user_id = ?`,
      [name, phone, address_line1, address_line2, city, state, pincode, address_type || 'home', req.params.id, req.user.id]
    );
    
    res.json({ message: 'Address updated' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    // First, unset all defaults for this user
    await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    
    // Then set the new default
    await pool.query('UPDATE addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    res.json({ message: 'Default address updated' });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send Email Change OTP
const sendEmailChangeOTP = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    // Check if new email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [newEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This email is already registered to another account' });
    }

    // Generate and send OTP to new email
    const otp = generateOTP();
    storeOTP(newEmail, otp, 'email-change', { userId, newEmail });
    
    await sendOTPEmail(newEmail, otp, 'signup'); // Use signup template
    
    res.json({ message: 'Verification code sent to your new email' });
  } catch (error) {
    console.error('Send email change OTP error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

// Verify Email Change OTP
const verifyEmailChange = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    const userId = req.user.id;

    const result = verifyStoredOTP(newEmail, otp, 'email-change');
    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Verify the userId matches
    if (result.userData.userId !== userId) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Update email in database
    await pool.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
    
    clearOTP(newEmail, 'email-change');

    // Get updated user data
    const [users] = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [userId]);
    
    res.json({ 
      message: 'Email updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ message: 'Failed to update email' });
  }
};

// Google OAuth Login/Register
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Google credential required' });
    }
    
    // Verify the Google token using Google's tokeninfo endpoint
    let payload;
    try {
      const https = require('https');
      
      const verifyToken = () => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'oauth2.googleapis.com',
            path: `/tokeninfo?id_token=${credential}`,
            method: 'GET'
          };
          
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  reject(new Error(parsed.error_description || 'Invalid token'));
                } else {
                  resolve(parsed);
                }
              } catch (e) {
                reject(e);
              }
            });
          });
          
          req.on('error', reject);
          req.end();
        });
      };
      
      payload = await verifyToken();
      
      // Verify the audience matches our client ID
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ message: 'Invalid token audience' });
      }
    } catch (err) {
      console.error('Google token verification error:', err);
      return res.status(401).json({ message: 'Invalid Google credential' });
    }
    
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if user exists with this Google ID
    let [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );
    
    let user;
    
    if (users.length > 0) {
      // User exists with Google ID - login
      user = users[0];
    } else {
      // Check if email already exists (local account)
      [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (users.length > 0) {
        // Email exists - link Google account to existing user
        user = users[0];
        await pool.query(
          'UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?',
          [googleId, 'google', user.id]
        );
        // If user has a profile image from local, keep it; otherwise use Google's
        if (!user.profile_image && picture) {
          await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [picture, user.id]);
        }
      } else {
        // New user - create account
        const [result] = await pool.query(
          `INSERT INTO users (name, email, google_id, auth_provider, profile_image, email_verified)
           VALUES (?, ?, ?, 'google', ?, TRUE)`,
          [name, email, googleId, picture || null]
        );
        
        // Get the newly created user
        [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = users[0];
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileImage,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  sendSignupOTP,
  verifySignupOTP,
  sendResetOTP,
  verifyResetOTP,
  resetPassword,
  changePassword,
  sendEmailChangeOTP,
  verifyEmailChange,
  googleAuth,
  getSpecialDates,
  updateSpecialDates
};

