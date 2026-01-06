import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Heart, LogOut, Plus, Trash2, X, Star, Edit2, Home, Briefcase, Building, Users, Lock, Eye, EyeOff, Mail, CheckCircle, Bell, Camera, Pencil, ImageIcon, Keyboard, RotateCcw, Info, ChevronDown, ChevronUp, Cake, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShortcuts } from '../context/ShortcutsContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import { apiFetch } from '../config/api';
import './Profile.css';

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'office', label: 'Office', icon: Building },
  { value: 'friend', label: 'Friend/Family', icon: Users },
  { value: 'other', label: 'Other', icon: MapPin }
];

// Shortcuts Tab Component
const ShortcutsTabContent = () => {
  const { 
    shortcutsEnabled, 
    toggleShortcutsEnabled, 
    getGroupedShortcuts, 
    formatShortcutKeys,
    updateShortcut,
    resetShortcuts,
    hasConflict,
    setIsPaletteOpen
  } = useShortcuts();
  const toast = useToast();
  const modal = useModal();
  
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [recordedKeys, setRecordedKeys] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const groupedShortcuts = getGroupedShortcuts();
  
  // Handle key recording
  useEffect(() => {
    if (!isRecording) return;
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const key = e.key.toLowerCase();
      
      // Ignore modifier-only keypresses
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;
      
      // Build key with modifiers
      let keyStr = key;
      if (e.ctrlKey) keyStr = 'ctrl+' + key;
      else if (e.metaKey) keyStr = 'meta+' + key;
      else if (e.altKey) keyStr = 'alt+' + key;
      else if (e.shiftKey && key.length > 1) keyStr = 'shift+' + key; // Only for special keys like arrows
      
      // For sequential shortcuts, add to array
      const newKeys = [...recordedKeys, keyStr === 'escape' ? key : keyStr];
      
      // If Escape pressed, cancel recording
      if (key === 'escape') {
        setIsRecording(false);
        setRecordedKeys([]);
        setEditingShortcut(null);
        return;
      }
      
      // If Enter pressed, save the shortcut
      if (key === 'enter' && recordedKeys.length > 0) {
        saveShortcut();
        return;
      }
      
      // Limit to 2 keys for sequential shortcuts
      if (newKeys.length <= 2) {
        setRecordedKeys(newKeys);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, recordedKeys]);
  
  const startRecording = (shortcutId) => {
    setEditingShortcut(shortcutId);
    setRecordedKeys([]);
    setIsRecording(true);
  };
  
  const saveShortcut = () => {
    if (recordedKeys.length === 0) {
      toast.error('Please press at least one key');
      return;
    }
    
    // Check for conflicts
    const conflict = hasConflict(editingShortcut, recordedKeys);
    if (conflict.hasConflict) {
      toast.error(`Conflict: This shortcut is already used for "${conflict.conflictWith}"`);
      return;
    }
    
    updateShortcut(editingShortcut, recordedKeys);
    toast.success('Shortcut updated successfully');
    setIsRecording(false);
    setRecordedKeys([]);
    setEditingShortcut(null);
  };
  
  const cancelRecording = () => {
    setIsRecording(false);
    setRecordedKeys([]);
    setEditingShortcut(null);
  };
  
  const handleReset = async () => {
    const confirmed = await modal.confirm({
      title: 'Reset All Shortcuts?',
      message: 'This will restore all keyboard shortcuts to their default values. This action cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      await resetShortcuts();
      toast.success('Shortcuts reset to defaults');
    }
  };
  
  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>Keyboard Shortcuts</h2>
        <div className="shortcut-header-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsPaletteOpen(true)}
          >
            <Keyboard size={16} /> Try It
          </button>
        </div>
      </div>
      
      <div className="shortcuts-master-toggle">
        <div className="toggle-info">
          <h4>Enable Keyboard Shortcuts</h4>
          <p>Use keyboard shortcuts to navigate and perform actions quickly</p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={shortcutsEnabled}
            onChange={toggleShortcutsEnabled}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div className="shortcuts-hint">
        <p>💡 Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the command palette anytime</p>
      </div>
      
      <div className={`shortcuts-note ${showHelp ? 'expanded' : 'collapsed'}`}>
        <button className="shortcuts-note-toggle" onClick={() => setShowHelp(!showHelp)}>
          <Info size={18} />
          <span>How to Edit Shortcuts</span>
          {showHelp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showHelp && (
          <div className="shortcuts-note-content">
            <p>Click the edit button, then press your desired key combination:</p>
            <ul>
              <li><strong>Single key:</strong> Press any letter or number (e.g., <kbd>T</kbd>, <kbd>1</kbd>)</li>
              <li><strong>Modifier + key:</strong> Hold <kbd>Ctrl</kbd>, <kbd>Alt</kbd>, or <kbd>Shift</kbd> and press a key (e.g., <kbd>Alt</kbd>+<kbd>K</kbd>)</li>
              <li><strong>Sequential keys:</strong> Press two keys one after another (e.g., <kbd>G</kbd> then <kbd>H</kbd>)</li>
            </ul>
            <p><em>Press <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel</em></p>
          </div>
        )}
      </div>
      
      {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
        <div key={category} className="shortcuts-category">
          <h3 className="category-title">{category}</h3>
          <div className="shortcuts-list">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="shortcut-item">
                <div className="shortcut-info">
                  <span className="shortcut-label">{shortcut.label}</span>
                  {shortcut.adminOnly && <span className="admin-badge">Admin</span>}
                </div>
                <div className="shortcut-keys-container">
                  {editingShortcut === shortcut.id && isRecording ? (
                    <div className="shortcut-recording">
                      <div className="recorded-keys">
                        {recordedKeys.length > 0 ? (
                          formatShortcutKeys(recordedKeys).map((key, idx) => (
                            <kbd key={idx}>{key}</kbd>
                          ))
                        ) : (
                          <span className="recording-hint">Press keys...</span>
                        )}
                      </div>
                      <button className="btn-save-shortcut" onClick={saveShortcut}>
                        <CheckCircle size={16} />
                      </button>
                      <button className="btn-cancel-shortcut" onClick={cancelRecording}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="shortcut-keys">
                        {formatShortcutKeys(shortcut.keys).map((key, idx) => (
                          <kbd key={idx}>{key}</kbd>
                        ))}
                      </div>
                      {shortcut.editable && (
                        <button 
                          className="btn-edit-shortcut"
                          onClick={() => startRecording(shortcut.id)}
                          title="Edit shortcut"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="shortcuts-actions">
        <button className="btn btn-outline" onClick={handleReset}>
          <RotateCcw size={16} /> Reset All to Defaults
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, loading: authLoading } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', address_type: 'home'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Email change state
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpValues, setEmailOtpValues] = useState(['', '', '', '', '', '']);
  const [emailChangeStep, setEmailChangeStep] = useState(1);
  const emailOtpRefs = useRef([]);
  
  // Profile edit mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditData, setProfileEditData] = useState({ name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    newsletter: true,
    offers: true,
    festive: true,
    others: true
  });
  const [prefLoading, setPrefLoading] = useState(false);

  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const profileImageInputRef = useRef(null);
  
  // Special dates (birthday/anniversary) state
  const [specialDates, setSpecialDates] = useState({
    birthday: null,
    anniversary: null,
    birthdayCooldown: { canEdit: true, daysLeft: 0, editsRemaining: 2 },
    anniversaryCooldown: { canEdit: true, daysLeft: 0, editsRemaining: 2 }
  });
  const [specialDatesLoading, setSpecialDatesLoading] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAddresses();
    fetchNotificationPrefs();
    fetchProfileImage();
    fetchSpecialDates();
  }, [isAuthenticated, authLoading]);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuOpen && !event.target.closest('.user-avatar-container')) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  const fetchProfileImage = async () => {
    try {
      const res = await apiFetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile_image) {
          // Handle both Cloudinary URLs (full URLs) and local paths
          const imageUrl = data.profile_image.startsWith('http') 
            ? data.profile_image 
            : `http://localhost:5000${data.profile_image}`;
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Fetch profile image error:', error);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('profile_image', file);

      const res = await apiFetch('/api/auth/profile/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Handle both Cloudinary URLs (full URLs) and local paths
        const imageUrl = data.profile_image.startsWith('http') 
          ? data.profile_image 
          : `http://localhost:5000${data.profile_image}`;
        setProfileImage(imageUrl);
        toast.success('Profile picture updated!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload profile image error:', error);
      toast.error('Error uploading image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    try {
      setImageUploading(true);
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: user.name, phone: user.phone, profile_image: null })
      });

      if (res.ok) {
        setProfileImage(null);
        toast.success('Profile picture removed!');
      } else {
        toast.error('Failed to remove picture');
      }
    } catch (error) {
      console.error('Remove profile image error:', error);
      toast.error('Error removing picture');
    } finally {
      setImageUploading(false);
      setAvatarMenuOpen(false);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await apiFetch('/api/email/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationPrefs({
          newsletter: data.newsletter ?? true,
          offers: data.offers ?? true,
          festive: data.festive ?? true,
          others: data.others ?? true
        });
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences');
    }
  };

  const handleTogglePref = async (key) => {
    const newValue = !notificationPrefs[key];
    const newPrefs = { ...notificationPrefs, [key]: newValue };
    setNotificationPrefs(newPrefs);
    
    try {
      setPrefLoading(true);
      const res = await apiFetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newPrefs)
      });
      
      if (res.ok) {
        toast.success('Notification preferences updated');
      } else {
        // Revert on error
        setNotificationPrefs(prev => ({ ...prev, [key]: !newValue }));
        toast.error('Failed to update preferences');
      }
    } catch (error) {
      setNotificationPrefs(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to update preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await apiFetch('/api/auth/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
    }
  };

  // Fetch special dates (birthday/anniversary)
  const fetchSpecialDates = async () => {
    try {
      const res = await apiFetch('/api/auth/special-dates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialDates(data);
      }
    } catch (error) {
      console.error('Fetch special dates error:', error);
    }
  };

  // Handle date input click (check cooldown)
  const handleDateClick = (type, cooldown) => {
    if (!cooldown.canEdit) {
      if (cooldown.daysLeft > 0) {
        setCooldownMessage(`You can update your ${type} after ${cooldown.daysLeft} days.`);
      } else if (cooldown.editsRemaining === 0) {
        setCooldownMessage(`You've reached the maximum ${type} updates for this year.`);
      }
      setShowCooldownModal(true);
      return false;
    }
    return true;
  };

  // Update a special date
  const handleSpecialDateUpdate = async (type, value) => {
    const cooldown = type === 'birthday' ? specialDates.birthdayCooldown : specialDates.anniversaryCooldown;
    if (!handleDateClick(type, cooldown)) return;
    
    setSpecialDatesLoading(true);
    try {
      const res = await apiFetch('/api/auth/special-dates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [type]: value })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`${type === 'birthday' ? 'Birthday' : 'Anniversary'} updated!`);
        fetchSpecialDates();
      } else {
        if (data.daysLeft) {
          setCooldownMessage(data.message);
          setShowCooldownModal(true);
        } else {
          toast.error(data.message || 'Failed to update');
        }
      }
    } catch (error) {
      toast.error('Error updating date');
    } finally {
      setSpecialDatesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', phone: '', address_line1: '', address_line2: '',
      city: '', state: '', pincode: '', address_type: 'home'
    });
    setEditingAddress(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddressModal(true);
  };

  const openEditModal = (addr) => {
    setFormData({
      name: addr.name || '',
      phone: addr.phone || '',
      address_line1: addr.address_line1 || '',
      address_line2: addr.address_line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      address_type: addr.address_type || 'home'
    });
    setEditingAddress(addr);
    setShowAddressModal(true);
  };

  const closeModal = () => {
    setShowAddressModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingAddress 
        ? `/api/auth/addresses/${editingAddress.id}`
        : '/api/auth/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...formData, 
          is_default: !editingAddress && addresses.length === 0 
        })
      });
      
      if (res.ok) {
        await fetchAddresses();
        closeModal();
        toast.success(editingAddress ? 'Address updated!' : 'Address added!');
      } else {
        toast.error('Failed to save address');
      }
    } catch (error) {
      console.error('Save address error:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    modal.confirm(
      'Delete Address',
      'Are you sure you want to delete this address?',
      async () => {
        try {
          const res = await apiFetch(`/api/auth/addresses/${addressId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setAddresses(addresses.filter(a => a.id !== addressId));
            toast.success('Address deleted');
          } else {
            toast.error('Failed to delete address');
          }
        } catch (error) {
          console.error('Delete address error:', error);
          toast.error('Failed to delete address');
        }
      }
    );
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await apiFetch(`/api/auth/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAddresses(addresses.map(a => ({
          ...a,
          is_default: a.id === addressId
        })));
        toast.success('Default address updated');
      } else {
        toast.error('Failed to update default address');
      }
    } catch (error) {
      console.error('Set default error:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      modal.error('Password Mismatch', 'Oops! New password and confirm password do not match. Please check and try again.');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      modal.error('Weak Password', 'Password must be at least 6 characters long for security.');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        modal.success('Password Changed', 'Your password has been updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        modal.error('Change Failed', data.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Change password error:', error);
      modal.error('Network Error', 'Unable to connect to server. Please check your internet connection.');
    }
    setPasswordLoading(false);
  };

  const handleSendEmailChangeOTP = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      modal.error('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    modal.loading('Sending Verification Code', 'Please wait while we send the code to your new email...');
    
    try {
      const res = await apiFetch('/api/auth/send-email-change-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        toast.success('Verification code sent to new email!');
        setEmailChangeStep(2);
      } else {
        modal.error('Error', data.message || 'Failed to send verification code.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server.');
    }
  };

  // Email OTP handlers
  const handleEmailOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtpValues = [...emailOtpValues];
    newOtpValues[index] = value.slice(-1);
    setEmailOtpValues(newOtpValues);
    
    if (value && index < 5) {
      emailOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailOtpValues[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpValues = [...emailOtpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtpValues[i] = pastedData[i];
    }
    setEmailOtpValues(newOtpValues);
    if (pastedData.length > 0) {
      emailOtpRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const getEmailOtpString = () => emailOtpValues.join('');

  const handleVerifyEmailChange = async () => {
    const otp = getEmailOtpString();
    if (otp.length !== 6) {
      modal.error('Invalid OTP', 'Please enter all 6 digits of the verification code.');
      return;
    }

    modal.loading('Updating Email', 'Please wait while we update your email address...');
    
    try {
      const res = await apiFetch('/api/auth/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail, otp })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        modal.success('Email Updated', 'Your email has been changed successfully!');
        setShowEmailChangeModal(false);
        setNewEmail('');
        setEmailOtpValues(['', '', '', '', '', '']);
        setEmailChangeStep(1);
        window.location.reload();
      } else {
        modal.error('Verification Failed', data.message || 'Invalid or expired code.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server.');
    }
  };

  const openEmailChangeModal = () => {
    setNewEmail('');
    setEmailOtpValues(['', '', '', '', '', '']);
    setEmailChangeStep(1);
    setShowEmailChangeModal(true);
  };

  const closeEmailChangeModal = () => {
    setShowEmailChangeModal(false);
    setNewEmail('');
    setEmailOtpValues(['', '', '', '', '', '']);
    setEmailChangeStep(1);
  };

  // Profile edit mode functions
  const startEditProfile = () => {
    setProfileEditData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setIsEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileEditData({ name: '', phone: '' });
  };

  const saveProfile = async () => {
    if (!profileEditData.name.trim()) {
      modal.error('Validation Error', 'Name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    modal.loading('Saving Changes', 'Please wait while we update your profile...');

    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileEditData.name.trim(),
          phone: profileEditData.phone.trim() || null
        })
      });

      const data = await res.json();
      modal.hide();

      if (res.ok) {
        modal.success('Profile Updated', 'Your changes have been saved successfully!');
        setIsEditingProfile(false);
        // Reload to get updated user data
        window.location.reload();
      } else {
        modal.error('Update Failed', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server.');
    }
    setProfileSaving(false);
  };

  const getAddressTypeInfo = (type) => {
    // Handle null, undefined, 0, or invalid types
    if (!type || type === '0' || type === 0) {
      return ADDRESS_TYPES[0]; // Default to 'home'
    }
    return ADDRESS_TYPES.find(t => t.value === type) || ADDRESS_TYPES[0];
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-user">
              <div className="user-avatar-container">
                <div className="user-avatar-wrapper">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt={user.name} 
                      className="user-avatar-img" 
                    />
                  ) : (
                    <div className="user-avatar-letter">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <button 
                  className="avatar-edit-badge"
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                >
                  {imageUploading ? '...' : <Pencil size={12} />}
                </button>
                
                {avatarMenuOpen && (
                  <div className="avatar-menu">
                    {profileImage && (
                      <button onClick={() => { setShowImageModal(true); setAvatarMenuOpen(false); }}>
                        <Eye size={14} /> View Photo
                      </button>
                    )}
                    <button onClick={() => { profileImageInputRef.current?.click(); setAvatarMenuOpen(false); }}>
                      <Camera size={14} /> {profileImage ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {profileImage && (
                      <button className="danger" onClick={handleRemoveProfileImage}>
                        <Trash2 size={14} /> Remove Photo
                      </button>
                    )}
                  </div>
                )}
                
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>
            
            {/* Image View Modal */}
            {showImageModal && profileImage && (
              <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
                <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setShowImageModal(false)}>
                    <X size={20} />
                  </button>
                  <img src={profileImage} alt={user.name} />
                </div>
              </div>
            )}

            <nav className="profile-nav">
              <button 
                className={activeTab === 'profile' ? 'active' : ''} 
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> My Profile
              </button>
              <button 
                className={activeTab === 'addresses' ? 'active' : ''} 
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin size={18} /> Addresses
              </button>
              <button onClick={() => navigate('/orders')}>
                <Package size={18} /> My Orders
              </button>
              <button onClick={() => navigate('/wishlist')}>
                <Heart size={18} /> Wishlist
              </button>
              <button 
                className={activeTab === 'security' ? 'active' : ''} 
                onClick={() => setActiveTab('security')}
              >
                <Lock size={18} /> Security
              </button>
              <button 
                className={activeTab === 'notifications' ? 'active' : ''} 
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} /> Notifications
              </button>
              <button 
                className={activeTab === 'shortcuts' ? 'active' : ''} 
                onClick={() => setActiveTab('shortcuts')}
              >
                <Keyboard size={18} /> Shortcuts (Keyboard)
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="profile-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Personal Information</h2>
                  {!isEditingProfile ? (
                    <button className="btn btn-secondary btn-sm" onClick={startEditProfile}>
                      <Edit2 size={16} /> Edit
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button className="btn btn-ghost btn-sm" onClick={cancelEditProfile} disabled={profileSaving}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={profileSaving}>
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="profile-form">
                  <div className="form-row">
                    <div className="input-group">
                      <label>Full Name</label>
                      {isEditingProfile ? (
                        <input 
                          type="text" 
                          value={profileEditData.name}
                          onChange={(e) => setProfileEditData({ ...profileEditData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <input type="text" value={user.name} readOnly />
                      )}
                    </div>
                    <div className="input-group">
                      <label>Email</label>
                      <div 
                        className="email-field-disabled"
                        onClick={() => toast.info('Email can be changed in the Security tab')}
                        title="Email can be changed in Security tab"
                      >
                        <input 
                          type="email" 
                          value={user.email} 
                          readOnly 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Email can be changed in the Security tab');
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label>Phone</label>
                      {isEditingProfile ? (
                        <input 
                          type="tel" 
                          value={profileEditData.phone}
                          onChange={(e) => setProfileEditData({ ...profileEditData, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <input type="tel" value={user.phone || 'Not set'} readOnly />
                      )}
                    </div>
                    <div className="input-group">
                      <label>Member Since</label>
                      <input type="text" value={new Date(user.created_at).toLocaleDateString()} readOnly />
                    </div>
                  </div>
                </div>
                
                {/* Special Dates Section */}
                <div className="profile-form" style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Gift size={20} /> Special Dates
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>
                      (Receive discount coupons on these occasions!)
                    </span>
                  </h3>
                  <div className="form-row">
                    <div className="input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cake size={16} /> Birthday
                        {!specialDates.birthdayCooldown.canEdit && (
                          <span style={{ fontSize: '11px', color: '#eab308', marginLeft: '8px' }}>
                            (Editable in {specialDates.birthdayCooldown.daysLeft} days)
                          </span>
                        )}
                      </label>
                      <input 
                        type="date" 
                        value={specialDates.birthday ? specialDates.birthday.split('T')[0] : ''}
                        onChange={(e) => handleSpecialDateUpdate('birthday', e.target.value)}
                        onClick={() => handleDateClick('birthday', specialDates.birthdayCooldown)}
                        disabled={!specialDates.birthdayCooldown.canEdit || specialDatesLoading}
                        style={{ 
                          cursor: specialDates.birthdayCooldown.canEdit ? 'pointer' : 'not-allowed',
                          opacity: specialDates.birthdayCooldown.canEdit ? 1 : 0.6
                        }}
                      />
                      {specialDates.birthday && (
                        <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          🎂 {specialDates.birthdayCooldown.editsRemaining} edits remaining this year
                        </p>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Heart size={16} /> Wedding Anniversary
                        {!specialDates.anniversaryCooldown.canEdit && (
                          <span style={{ fontSize: '11px', color: '#eab308', marginLeft: '8px' }}>
                            (Editable in {specialDates.anniversaryCooldown.daysLeft} days)
                          </span>
                        )}
                      </label>
                      <input 
                        type="date" 
                        value={specialDates.anniversary ? specialDates.anniversary.split('T')[0] : ''}
                        onChange={(e) => handleSpecialDateUpdate('anniversary', e.target.value)}
                        onClick={() => handleDateClick('anniversary', specialDates.anniversaryCooldown)}
                        disabled={!specialDates.anniversaryCooldown.canEdit || specialDatesLoading}
                        style={{ 
                          cursor: specialDates.anniversaryCooldown.canEdit ? 'pointer' : 'not-allowed',
                          opacity: specialDates.anniversaryCooldown.canEdit ? 1 : 0.6
                        }}
                      />
                      {specialDates.anniversary && (
                        <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          💍 {specialDates.anniversaryCooldown.editsRemaining} edits remaining this year
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cooldown Warning Modal */}
            {showCooldownModal && (
              <div className="modal-overlay" onClick={() => setShowCooldownModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                  <div className="modal-header">
                    <h3>⏳ Please Wait</h3>
                    <button className="modal-close" onClick={() => setShowCooldownModal(false)}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="modal-body" style={{ textAlign: 'center', padding: '30px' }}>
                    <p style={{ fontSize: '16px', marginBottom: '20px' }}>{cooldownMessage}</p>
                    <p style={{ color: '#888', fontSize: '14px' }}>
                      This restriction helps prevent misuse of discount coupons.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-primary" onClick={() => setShowCooldownModal(false)}>
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Saved Addresses</h2>
                  <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                    <Plus size={16} /> Add Address
                  </button>
                </div>

                <div className="addresses-grid">
                  {addresses.map((addr) => {
                    const typeInfo = getAddressTypeInfo(addr.address_type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div key={addr.id} className={`address-card ${addr.is_default ? 'is-default' : ''}`}>
                        <div className="address-card-header">
                          <div className="address-type-badge">
                            <TypeIcon size={14} />
                            <span>{typeInfo.label}</span>
                          </div>
                          {Boolean(addr.is_default) && <span className="default-badge">Default</span>}
                        </div>
                        
                        <div className="address-card-body">
                          <strong className="address-name">{addr.name}</strong>
                          <p className="address-location">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                        
                        <div className="address-card-actions">
                          {!Boolean(addr.is_default) && (
                            <button 
                              className="action-btn set-default-btn" 
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              <Star size={14} /> Set Default
                            </button>
                          )}
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => openEditModal(addr)}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {addresses.length === 0 && (
                    <div className="no-addresses">
                      <MapPin size={48} strokeWidth={1} />
                      <p>No saved addresses yet</p>
                      <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                        <Plus size={16} /> Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-section">
                <h2>Security Settings</h2>
                <div className="security-grid">
                  {/* Email Section */}
                  <div className="security-card">
                    <div className="security-card-header">
                      <Mail size={24} />
                      <div>
                        <h3>Email Address</h3>
                        <p className="security-desc">Your account email for notifications and login</p>
                      </div>
                    </div>
                    <div className="email-display">
                      <span className="current-email">{user?.email}</span>
                      <span className="email-verified-badge">
                        <CheckCircle size={14} /> Verified
                      </span>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={openEmailChangeModal}
                    >
                      <Edit2 size={16} /> Change Email
                    </button>
                  </div>

                  {/* Password Section */}
                  <div className="security-card">
                    <div className="security-card-header">
                      <Lock size={24} />
                      <div>
                        <h3>Change Password</h3>
                        <p className="security-desc">Update your password regularly for security</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="password-form">
                      <div className="input-group">
                        <label>Current Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="input-group">
                        <label>New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="input-group">
                        <label>Confirm New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Email Notifications</h2>
                </div>
                <p className="section-description">
                  Manage your email preferences. Choose which types of emails you'd like to receive.
                </p>

                <div className="notification-settings">
                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} className="notification-icon" />
                      <div>
                        <h4>Newsletter</h4>
                        <p>Monthly updates, jewelry tips, and styling guides</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationPrefs.newsletter}
                        onChange={() => handleTogglePref('newsletter')}
                        disabled={prefLoading}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} className="notification-icon" />
                      <div>
                        <h4>Special Offers</h4>
                        <p>Exclusive discounts, flash sales, and promotions</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationPrefs.offers}
                        onChange={() => handleTogglePref('offers')}
                        disabled={prefLoading}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} className="notification-icon" />
                      <div>
                        <h4>Festive Greetings</h4>
                        <p>Holiday wishes and festival celebration offers</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationPrefs.festive}
                        onChange={() => handleTogglePref('festive')}
                        disabled={prefLoading}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <Bell size={20} className="notification-icon" />
                      <div>
                        <h4>New Arrivals & Others</h4>
                        <p>New product launches, restocks, and general updates</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationPrefs.others}
                        onChange={() => handleTogglePref('others')}
                        disabled={prefLoading}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <ShortcutsTabContent />
            )}
          </main>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="address-modal-overlay" onClick={closeModal}>
          <div className="address-modal" onClick={e => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="address-modal-form">
              <div className="input-group">
                <label>Address Type</label>
                <div className="address-type-selector">
                  {ADDRESS_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`type-option ${formData.address_type === type.value ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, address_type: type.value })}
                    >
                      <type.icon size={16} />
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    placeholder="Recipient name"
                  />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label>Address Line 1</label>
                <input 
                  type="text" 
                  value={formData.address_line1} 
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} 
                  required 
                  placeholder="House/Flat No., Building Name"
                />
              </div>
              
              <div className="input-group">
                <label>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  value={formData.address_line2} 
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })} 
                  placeholder="Street, Landmark"
                />
              </div>
              
              <div className="form-row form-row-3">
                <div className="input-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    value={formData.state} 
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Pincode</label>
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} 
                    required 
                    maxLength={6}
                  />
                </div>
              </div>
              
              <div className="address-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="address-modal-overlay" onClick={closeEmailChangeModal}>
          <div className="address-modal email-change-modal" onClick={e => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>{emailChangeStep === 1 ? 'Change Email' : 'Verify New Email'}</h3>
              <button className="close-btn" onClick={closeEmailChangeModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="email-change-content">
              {emailChangeStep === 1 ? (
                <>
                  <p className="modal-desc">Enter your new email address. We'll send a verification code to confirm.</p>
                  <div className="input-group">
                    <label>Current Email</label>
                    <input type="email" value={user?.email} readOnly disabled />
                  </div>
                  <div className="input-group">
                    <label>New Email Address</label>
                    <input 
                      type="email" 
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="address-modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={closeEmailChangeModal}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleSendEmailChangeOTP}>
                      Send Verification Code
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="modal-desc">
                    We've sent a 6-digit verification code to <strong>{newEmail}</strong>. 
                    Enter the code below to confirm your email change.
                  </p>
                  <div className="otp-section">
                    <label>Verification Code</label>
                    <div className="otp-boxes">
                      {emailOtpValues.map((value, index) => (
                        <input
                          key={index}
                          ref={el => emailOtpRefs.current[index] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={value}
                          onChange={(e) => handleEmailOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleEmailOtpPaste : undefined}
                          className="otp-box"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="address-modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setEmailChangeStep(1)}>Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleVerifyEmailChange}>
                      Verify & Update Email
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
