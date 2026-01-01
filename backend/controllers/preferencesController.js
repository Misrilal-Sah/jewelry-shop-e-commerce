const db = require('../config/db');

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      // Return defaults if no preferences saved
      return res.json({
        shortcuts_enabled: true,
        custom_shortcuts: null,
        theme_preference: 'system'
      });
    }
    
    // Parse JSON if string
    const prefs = rows[0];
    if (typeof prefs.custom_shortcuts === 'string') {
      prefs.custom_shortcuts = JSON.parse(prefs.custom_shortcuts);
    }
    
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences' });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shortcuts_enabled, custom_shortcuts, theme_preference } = req.body;
    
    // Check if preferences exist
    const [existing] = await db.query(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    const shortcutsJson = custom_shortcuts ? JSON.stringify(custom_shortcuts) : null;
    
    if (existing.length === 0) {
      // Insert new preferences
      await db.query(
        `INSERT INTO user_preferences (user_id, shortcuts_enabled, custom_shortcuts, theme_preference) 
         VALUES (?, ?, ?, ?)`,
        [userId, shortcuts_enabled ?? true, shortcutsJson, theme_preference ?? 'system']
      );
    } else {
      // Update existing preferences
      const updates = [];
      const values = [];
      
      if (shortcuts_enabled !== undefined) {
        updates.push('shortcuts_enabled = ?');
        values.push(shortcuts_enabled);
      }
      if (custom_shortcuts !== undefined) {
        updates.push('custom_shortcuts = ?');
        values.push(shortcutsJson);
      }
      if (theme_preference !== undefined) {
        updates.push('theme_preference = ?');
        values.push(theme_preference);
      }
      
      if (updates.length > 0) {
        values.push(userId);
        await db.query(
          `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
    }
    
    // Fetch and return updated preferences
    const [rows] = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    const prefs = rows[0];
    if (typeof prefs.custom_shortcuts === 'string') {
      prefs.custom_shortcuts = JSON.parse(prefs.custom_shortcuts);
    }
    
    res.json(prefs);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Reset shortcuts to defaults
const resetShortcuts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.query(
      'UPDATE user_preferences SET custom_shortcuts = NULL WHERE user_id = ?',
      [userId]
    );
    
    res.json({ message: 'Shortcuts reset to defaults', custom_shortcuts: null });
  } catch (error) {
    console.error('Error resetting shortcuts:', error);
    res.status(500).json({ message: 'Failed to reset shortcuts' });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  resetShortcuts
};
