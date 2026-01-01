import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const ShortcutsContext = createContext();

// Default shortcuts configuration
const getDefaultShortcuts = (isAdmin = false) => {
  const shortcuts = {
    // General
    'palette.open': {
      keys: ['ctrl+k', 'meta+k'],
      label: 'Open Command Palette',
      category: 'General',
      icon: 'Command',
      editable: false
    },
    'search.focus': {
      keys: ['/'],
      label: 'Focus Search',
      category: 'General',
      icon: 'Search',
      editable: true
    },
    'theme.toggle': {
      keys: ['t'],
      label: 'Toggle Theme',
      category: 'Actions',
      icon: 'Moon',
      editable: true
    },
    'ui.escape': {
      keys: ['Escape'],
      label: 'Close Modal/Overlay',
      category: 'General',
      icon: 'X',
      editable: false
    },
    
    // Navigation
    'nav.home': {
      keys: ['g', 'h'],
      label: 'Go to Home',
      category: 'Navigation',
      icon: 'Home',
      editable: true
    },
    'nav.products': {
      keys: ['g', 'p'],
      label: 'Go to Products',
      category: 'Navigation',
      icon: 'ShoppingBag',
      editable: true
    },
    'nav.cart': {
      keys: ['g', 'c'],
      label: 'Go to Cart',
      category: 'Navigation',
      icon: 'ShoppingCart',
      editable: true
    },
    'nav.orders': {
      keys: ['g', 'o'],
      label: 'Go to Orders',
      category: 'Navigation',
      icon: 'Package',
      editable: true
    },
    'nav.wishlist': {
      keys: ['g', 'w'],
      label: 'Go to Wishlist',
      category: 'Navigation',
      icon: 'Heart',
      editable: true
    },
    'nav.profile': {
      keys: ['g', 'f'],
      label: 'Go to Profile',
      category: 'Navigation',
      icon: 'User',
      editable: true
    }
  };
  
  // Admin-only shortcuts
  if (isAdmin) {
    shortcuts['admin.dashboard'] = {
      keys: ['g', 'a'],
      label: 'Go to Admin Dashboard',
      category: 'Admin',
      icon: 'LayoutDashboard',
      editable: true,
      adminOnly: true
    };
    shortcuts['admin.email'] = {
      keys: ['g', 'e'],
      label: 'Go to Email Center',
      category: 'Admin',
      icon: 'Mail',
      editable: true,
      adminOnly: true
    };
    shortcuts['admin.addProduct'] = {
      keys: ['a', 'p'],
      label: 'Add New Product',
      category: 'Admin',
      icon: 'PlusCircle',
      editable: true,
      adminOnly: true
    };
    shortcuts['admin.users'] = {
      keys: ['a', 'u'],
      label: 'View Users',
      category: 'Admin',
      icon: 'Users',
      editable: true,
      adminOnly: true
    };
    shortcuts['admin.orders'] = {
      keys: ['a', 'o'],
      label: 'View All Orders',
      category: 'Admin',
      icon: 'ClipboardList',
      editable: true,
      adminOnly: true
    };
  }
  
  return shortcuts;
};

export const ShortcutsProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const { toggleTheme } = useTheme();
  
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [customShortcuts, setCustomShortcuts] = useState({});
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keySequence, setKeySequence] = useState([]);
  const [sequenceTimeout, setSequenceTimeout] = useState(null);
  
  const isAdmin = user?.role === 'admin';
  const defaultShortcuts = getDefaultShortcuts(isAdmin);
  
  // Merge default shortcuts with custom overrides
  const shortcuts = Object.keys(defaultShortcuts).reduce((acc, key) => {
    acc[key] = {
      ...defaultShortcuts[key],
      keys: customShortcuts[key]?.keys || defaultShortcuts[key].keys
    };
    return acc;
  }, {});
  
  // Load preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated || !token) {
        // Use localStorage for guests
        const savedPrefs = localStorage.getItem('shortcutPreferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          setShortcutsEnabled(prefs.shortcuts_enabled ?? true);
          setCustomShortcuts(prefs.custom_shortcuts || {});
        }
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/preferences', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const prefs = await response.json();
          setShortcutsEnabled(prefs.shortcuts_enabled ?? true);
          setCustomShortcuts(prefs.custom_shortcuts || {});
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
      setIsLoading(false);
    };
    
    loadPreferences();
  }, [isAuthenticated, token]);
  
  // Save preferences to API
  const savePreferences = async (newEnabled, newCustomShortcuts) => {
    const prefs = {
      shortcuts_enabled: newEnabled,
      custom_shortcuts: newCustomShortcuts
    };
    
    if (!isAuthenticated || !token) {
      // Save to localStorage for guests
      localStorage.setItem('shortcutPreferences', JSON.stringify(prefs));
      return;
    }
    
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prefs)
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };
  
  // Toggle shortcuts enabled
  const toggleShortcutsEnabled = useCallback(() => {
    const newEnabled = !shortcutsEnabled;
    setShortcutsEnabled(newEnabled);
    savePreferences(newEnabled, customShortcuts);
  }, [shortcutsEnabled, customShortcuts]);
  
  // Update a specific shortcut
  const updateShortcut = useCallback((commandId, newKeys) => {
    const newCustomShortcuts = {
      ...customShortcuts,
      [commandId]: { keys: newKeys }
    };
    setCustomShortcuts(newCustomShortcuts);
    savePreferences(shortcutsEnabled, newCustomShortcuts);
  }, [customShortcuts, shortcutsEnabled]);
  
  // Reset all shortcuts to defaults
  const resetShortcuts = useCallback(async () => {
    setCustomShortcuts({});
    
    if (!isAuthenticated || !token) {
      localStorage.removeItem('shortcutPreferences');
      return;
    }
    
    try {
      await fetch('/api/preferences/reset-shortcuts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to reset shortcuts:', error);
    }
  }, [isAuthenticated, token]);
  
  // Command actions
  const executeCommand = useCallback((commandId) => {
    switch (commandId) {
      case 'palette.open':
        setIsPaletteOpen(true);
        break;
      case 'search.focus':
        document.querySelector('.action-btn[aria-label="Search"]')?.click();
        break;
      case 'theme.toggle':
        toggleTheme();
        break;
      case 'ui.escape':
        setIsPaletteOpen(false);
        break;
      case 'nav.home':
        navigate('/');
        break;
      case 'nav.products':
        navigate('/products');
        break;
      case 'nav.cart':
        navigate('/cart');
        break;
      case 'nav.orders':
        navigate('/orders');
        break;
      case 'nav.wishlist':
        navigate('/wishlist');
        break;
      case 'nav.profile':
        navigate('/profile');
        break;
      case 'admin.dashboard':
        if (isAdmin) navigate('/admin');
        break;
      case 'admin.email':
        if (isAdmin) navigate('/admin/email');
        break;
      case 'admin.addProduct':
        if (isAdmin) navigate('/admin?tab=products&action=add');
        break;
      case 'admin.users':
        if (isAdmin) navigate('/admin?tab=users');
        break;
      case 'admin.orders':
        if (isAdmin) navigate('/admin?tab=orders');
        break;
      default:
        console.log('Unknown command:', commandId);
    }
    setIsPaletteOpen(false);
  }, [navigate, toggleTheme, isAdmin]);
  
  // Check if key matches shortcut
  const matchesShortcut = useCallback((shortcutKeys, pressedKeys) => {
    if (shortcutKeys.length === 1) {
      // Single key shortcuts (e.g., 't', '/')
      const key = shortcutKeys[0].toLowerCase();
      if (key.includes('+')) {
        // Modifier key shortcuts (e.g., 'ctrl+k')
        const parts = key.split('+');
        const modifier = parts[0];
        const mainKey = parts[1];
        return pressedKeys.length === 1 && 
               pressedKeys[0].modifier === modifier && 
               pressedKeys[0].key === mainKey;
      }
      return pressedKeys.length === 1 && pressedKeys[0].key === key;
    } else {
      // Sequential shortcuts (e.g., ['g', 'h'])
      return shortcutKeys.every((key, idx) => 
        pressedKeys[idx] && pressedKeys[idx].key === key.toLowerCase()
      );
    }
  }, []);
  
  // Handle keyboard events
  useEffect(() => {
    if (!shortcutsEnabled) return;
    
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape and Ctrl+K in inputs
        if (e.key !== 'Escape' && !(e.ctrlKey && e.key === 'k') && !(e.metaKey && e.key === 'k')) {
          return;
        }
      }
      
      // Build key info
      const keyInfo = {
        key: e.key.toLowerCase(),
        modifier: e.ctrlKey ? 'ctrl' : e.metaKey ? 'meta' : e.altKey ? 'alt' : null
      };
      
      // Handle Ctrl+K / Cmd+K for palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }
      
      // Handle Escape
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setKeySequence([]);
        return;
      }
      
      // Build new sequence
      const newSequence = [...keySequence, keyInfo];
      
      // Clear previous timeout
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
      }
      
      // Check for matching shortcuts
      for (const [commandId, shortcut] of Object.entries(shortcuts)) {
        if (matchesShortcut(shortcut.keys, newSequence)) {
          e.preventDefault();
          executeCommand(commandId);
          setKeySequence([]);
          return;
        }
      }
      
      // Check if any shortcut could match with more keys
      const couldMatch = Object.values(shortcuts).some(shortcut => {
        if (shortcut.keys.length <= newSequence.length) return false;
        return shortcut.keys.slice(0, newSequence.length).every((key, idx) => 
          newSequence[idx] && newSequence[idx].key === key.toLowerCase()
        );
      });
      
      if (couldMatch) {
        setKeySequence(newSequence);
        // Set timeout to clear sequence
        const timeout = setTimeout(() => {
          setKeySequence([]);
        }, 1000);
        setSequenceTimeout(timeout);
      } else {
        setKeySequence([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsEnabled, shortcuts, keySequence, sequenceTimeout, matchesShortcut, executeCommand]);
  
  // Get shortcuts grouped by category
  const getGroupedShortcuts = useCallback(() => {
    const groups = {};
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
      // Skip admin shortcuts for non-admin users
      if (shortcut.adminOnly && !isAdmin) return;
      
      const category = shortcut.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ id, ...shortcut });
    });
    return groups;
  }, [shortcuts, isAdmin]);
  
  // Format shortcut keys for display
  const formatShortcutKeys = useCallback((keys) => {
    return keys.map(key => {
      if (key.includes('+')) {
        return key.split('+').map(k => {
          if (k === 'ctrl') return 'Ctrl+';
          if (k === 'meta') return 'Cmd+';
          if (k === 'alt') return 'Alt+';
          if (k === 'shift') return 'Shift+';
          return k.toUpperCase();
        }).join('');
      }
      return key.toUpperCase();
    });
  }, []);
  
  // Check for shortcut conflicts
  const hasConflict = useCallback((commandId, newKeys) => {
    const keyString = newKeys.join('+');
    for (const [id, shortcut] of Object.entries(shortcuts)) {
      if (id !== commandId && shortcut.keys.join('+') === keyString) {
        return { hasConflict: true, conflictWith: shortcut.label };
      }
    }
    return { hasConflict: false };
  }, [shortcuts]);
  
  return (
    <ShortcutsContext.Provider value={{
      shortcuts,
      shortcutsEnabled,
      toggleShortcutsEnabled,
      updateShortcut,
      resetShortcuts,
      executeCommand,
      isPaletteOpen,
      setIsPaletteOpen,
      getGroupedShortcuts,
      formatShortcutKeys,
      hasConflict,
      isLoading,
      keySequence
    }}>
      {children}
    </ShortcutsContext.Provider>
  );
};

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
};
