import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Command, Search, Home, ShoppingBag, ShoppingCart, Package, 
  Heart, User, Moon, Sun, X, LayoutDashboard, Mail, PlusCircle, 
  Users, ClipboardList, Keyboard
} from 'lucide-react';
import { useShortcuts } from '../../context/ShortcutsContext';
import { useTheme } from '../../context/ThemeContext';
import './CommandPalette.css';

const iconMap = {
  Command, Search, Home, ShoppingBag, ShoppingCart, Package,
  Heart, User, Moon, Sun, X, LayoutDashboard, Mail, PlusCircle,
  Users, ClipboardList, Keyboard
};

const CommandPalette = () => {
  const { 
    isPaletteOpen, 
    setIsPaletteOpen, 
    getGroupedShortcuts, 
    formatShortcutKeys,
    executeCommand,
    keySequence
  } = useShortcuts();
  const { theme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  
  const groupedShortcuts = getGroupedShortcuts();
  
  // Flatten shortcuts for keyboard navigation
  const allShortcuts = useMemo(() => {
    const result = [];
    Object.entries(groupedShortcuts).forEach(([category, shortcuts]) => {
      shortcuts.forEach(shortcut => {
        result.push({ ...shortcut, category });
      });
    });
    return result;
  }, [groupedShortcuts]);
  
  // Filter shortcuts based on search
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return allShortcuts;
    
    const query = searchQuery.toLowerCase();
    return allShortcuts.filter(shortcut => 
      shortcut.label.toLowerCase().includes(query) ||
      shortcut.category.toLowerCase().includes(query)
    );
  }, [allShortcuts, searchQuery]);
  
  // Group filtered shortcuts
  const filteredGrouped = useMemo(() => {
    const groups = {};
    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });
    return groups;
  }, [filteredShortcuts]);
  
  // Reset state when palette opens
  useEffect(() => {
    if (isPaletteOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isPaletteOpen]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isPaletteOpen) return;
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredShortcuts.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredShortcuts.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredShortcuts[selectedIndex]) {
            executeCommand(filteredShortcuts[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsPaletteOpen(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, filteredShortcuts, selectedIndex, executeCommand, setIsPaletteOpen]);
  
  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector('.command-item.selected');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);
  
  if (!isPaletteOpen) return null;
  
  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || Command;
    return <Icon size={18} />;
  };
  
  let itemIndex = -1;
  
  return (
    <div className="command-palette-overlay" onClick={() => setIsPaletteOpen(false)}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-search">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="command-shortcut-badge">
            <kbd>⌘</kbd><kbd>K</kbd>
          </div>
        </div>
        
        {/* Key Sequence Indicator */}
        {keySequence.length > 0 && (
          <div className="key-sequence-indicator">
            Waiting for next key: {keySequence.map(k => k.key.toUpperCase()).join(' → ')} → ...
          </div>
        )}
        
        {/* Commands List */}
        <div className="command-list" ref={listRef}>
          {Object.entries(filteredGrouped).length === 0 ? (
            <div className="command-empty">
              No commands found for "{searchQuery}"
            </div>
          ) : (
            Object.entries(filteredGrouped).map(([category, shortcuts]) => (
              <div key={category} className="command-group">
                <div className="command-category">{category}</div>
                {shortcuts.map((shortcut) => {
                  itemIndex++;
                  const currentIndex = itemIndex;
                  return (
                    <div
                      key={shortcut.id}
                      className={`command-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                      onClick={() => executeCommand(shortcut.id)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className="command-icon">
                        {getIcon(shortcut.icon)}
                      </div>
                      <span className="command-label">{shortcut.label}</span>
                      <div className="command-keys">
                        {formatShortcutKeys(shortcut.keys).map((key, idx) => (
                          <kbd key={idx}>{key}</kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="command-footer">
          <div className="footer-hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
          </div>
          <div className="footer-hint">
            <kbd>Enter</kbd> to select
          </div>
          <div className="footer-hint">
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
