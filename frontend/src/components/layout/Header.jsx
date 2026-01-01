import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Heart, User, Menu, X, 
  Sun, Moon, ChevronDown, LogOut 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from '../ui/NotificationBell';
import './Header.css';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sample product names for suggestions
  const productNames = [
    'Royal Diamond Solitaire Ring',
    'Traditional Gold Necklace Set',
    'Diamond Stud Earrings',
    'Gold Kada Bangles Set',
    'Bridal Complete Set',
    'Platinum Engagement Ring',
    'Silver Anklet Pair',
    'Gold Wedding Ring',
    'Diamond Pendant Necklace',
    'Pearl Earrings'
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close all dropdowns/overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search overlay
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target)) {
        // Check if click is not on the search button
        if (!event.target.closest('.action-btn[aria-label="Search"]')) {
          setIsSearchOpen(false);
          setShowSuggestions(false);
        }
      }
      
      // Close nav dropdowns
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      
      // Close user menu
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, isUserMenuOpen]);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = productNames.filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/products?search=${encodeURIComponent(suggestion)}`);
    setSearchQuery('');
    setIsSearchOpen(false);
    setShowSuggestions(false);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleCategoryClick = (path) => {
    setOpenDropdown(null);
    navigate(path);
  };

  const categories = [
    { name: 'Rings', path: '/products?category=rings' },
    { name: 'Necklaces', path: '/products?category=necklaces' },
    { name: 'Earrings', path: '/products?category=earrings' },
    { name: 'Bangles', path: '/products?category=bangles' },
    { name: 'Bridal', path: '/products?category=bridal' }
  ];

  const collections = [
    { name: 'Wedding Collection', path: '/products?collection=wedding' },
    { name: 'Daily Wear', path: '/products?collection=daily' },
    { name: 'Festive', path: '/products?collection=festive' },
    { name: 'Modern', path: '/products?collection=modern' }
  ];

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo - clicks scroll to top or navigate home */}
        <div 
          className="header-logo" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.location.pathname !== '/') {
              navigate('/');
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src="https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/alankara-emblem.png" 
            alt="Aabhar" 
            className="logo-emblem"
          />
          <span className="logo-divider">|</span>
          <span className="logo-text">Aabhar</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav" ref={dropdownRef}>
          <div className={`nav-item has-dropdown ${openDropdown === 'categories' ? 'open' : ''}`}>
            <button 
              className="nav-link"
              onClick={() => toggleDropdown('categories')}
            >
              Categories <ChevronDown size={16} />
            </button>
            {openDropdown === 'categories' && (
              <div className="nav-dropdown">
                {categories.map(cat => (
                  <button 
                    key={cat.name} 
                    className="dropdown-item"
                    onClick={() => handleCategoryClick(cat.path)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`nav-item has-dropdown ${openDropdown === 'collections' ? 'open' : ''}`}>
            <button 
              className="nav-link"
              onClick={() => toggleDropdown('collections')}
            >
              Collections <ChevronDown size={16} />
            </button>
            {openDropdown === 'collections' && (
              <div className="nav-dropdown">
                {collections.map(col => (
                  <button 
                    key={col.name} 
                    className="dropdown-item"
                    onClick={() => handleCategoryClick(col.path)}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/products" className="nav-link">All Jewelry</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {/* Search */}
          <button 
            className="action-btn" 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Theme Toggle */}
          <button 
            className="action-btn theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/wishlist" className="action-btn" aria-label="Wishlist">
              <Heart size={20} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="action-btn cart-btn" aria-label="Cart">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button 
                className="action-btn user-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <User size={20} />
              </button>
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    My Profile
                  </Link>
                  <Link to="/orders" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    My Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={() => { logout(); setIsUserMenuOpen(false); }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="action-btn" aria-label="Login">
              <User size={20} />
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="action-btn mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Search Overlay with Auto-suggest */}
      {isSearchOpen && (
        <div className="search-overlay" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for jewelry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="search-input"
            />
            <button type="button" onClick={() => setIsSearchOpen(false)} className="search-close">
              <X size={20} />
            </button>
          </form>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search size={16} className="suggestion-icon" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <div className="mobile-nav-section">
              <span className="mobile-nav-title">Categories</span>
              {categories.map(cat => (
                <button 
                  key={cat.name} 
                  className="mobile-nav-link"
                  onClick={() => { handleCategoryClick(cat.path); setIsMobileMenuOpen(false); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="mobile-nav-section">
              <span className="mobile-nav-title">Collections</span>
              {collections.map(col => (
                <button 
                  key={col.name} 
                  className="mobile-nav-link"
                  onClick={() => { handleCategoryClick(col.path); setIsMobileMenuOpen(false); }}
                >
                  {col.name}
                </button>
              ))}
            </div>
            <button 
              className="mobile-nav-link"
              onClick={() => { navigate('/products'); setIsMobileMenuOpen(false); }}
            >
              All Jewelry
            </button>
            <button 
              className="mobile-nav-link"
              onClick={() => { navigate('/blog'); setIsMobileMenuOpen(false); }}
            >
              Blog
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
