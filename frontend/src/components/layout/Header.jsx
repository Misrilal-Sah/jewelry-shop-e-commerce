import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Heart, User, Menu, X, 
  Sun, Moon, ChevronDown, LogOut, ShoppingCart, FileText
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

  // Fetch products for search suggestions
  const [allProducts, setAllProducts] = useState([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=100');
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.products || []);
        }
      } catch (error) {
        console.error('Fetch products error:', error);
      }
    };
    fetchProducts();
  }, []);

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
    if (searchQuery.trim().length > 0 && allProducts.length > 0) {
      const filtered = allProducts.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product) => {
    setSearchQuery('');
    navigate(`/products/${product.id}`);
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
          <span className="logo-text">AABHAR</span>
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
              {suggestions.map((product) => (
                <div 
                  key={product.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(product)}
                >
                  <Search size={16} className="suggestion-icon" />
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {/* Quick Actions - moved from header */}
          <div className="mobile-quick-actions">
            <button 
              className="mobile-action-btn"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            <button 
              className="mobile-action-btn"
              onClick={() => { navigate('/cart'); setIsMobileMenuOpen(false); }}
            >
              <ShoppingCart size={20} />
              <span>Cart {itemCount > 0 && `(${itemCount})`}</span>
            </button>
            
            {isAuthenticated && (
              <button 
                className="mobile-action-btn"
                onClick={() => { navigate('/wishlist'); setIsMobileMenuOpen(false); }}
              >
                <Heart size={20} />
                <span>Wishlist</span>
              </button>
            )}

            <button 
              className="mobile-action-btn"
              onClick={() => { navigate('/blog'); setIsMobileMenuOpen(false); }}
            >
              <FileText size={20} />
              <span>Blog</span>
            </button>
            
            {isAuthenticated ? (
              <>
                <button 
                  className="mobile-action-btn"
                  onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                >
                  <User size={20} />
                  <span>My Profile</span>
                </button>
                <button 
                  className="mobile-action-btn"
                  onClick={() => { navigate('/orders'); setIsMobileMenuOpen(false); }}
                >
                  <ShoppingBag size={20} />
                  <span>My Orders</span>
                </button>
                {user?.role === 'admin' && (
                  <button 
                    className="mobile-action-btn"
                    onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  >
                    <User size={20} />
                    <span>Admin Dashboard</span>
                  </button>
                )}
                <button 
                  className="mobile-action-btn logout"
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button 
                className="mobile-action-btn"
                onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
              >
                <User size={20} />
                <span>Login / Register</span>
              </button>
            )}
          </div>

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
