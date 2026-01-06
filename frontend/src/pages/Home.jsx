import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Crown, Gift, Star, Zap, Quote, MessageSquarePlus, Truck } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import FlashSaleTimer from '../components/product/FlashSaleTimer';
import TestimonialModal from '../components/TestimonialModal/TestimonialModal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [flashSales, setFlashSales] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  
  // Dynamic content from admin settings
  const [siteSettings, setSiteSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);

  // Fetch site settings, categories, and collections on mount
  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const [settingsRes, categoriesRes, collectionsRes] = await Promise.all([
          apiFetch('/api/common/settings/public'),
          apiFetch('/api/common/categories/public?homepage=true'),
          apiFetch('/api/common/collections/public?homepage=true')
        ]);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSiteSettings(data);
        }
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
        if (collectionsRes.ok) {
          setCollections(await collectionsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dynamic content:', error);
      }
    };
    
    fetchDynamicContent();
  }, []);

  // Fetch subscription state from DB on mount for logged-in users
  useEffect(() => {
    const fetchSubscriptionState = async () => {
      if (!isAuthenticated || !token) return;
      
      try {
        const res = await apiFetch('/api/email/preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsSubscribed(data.newsletter === true || data.newsletter === 1);
        }
      } catch (error) {
        console.error('Failed to fetch subscription state');
      }
    };
    
    fetchSubscriptionState();
  }, [isAuthenticated, token]);

  // Subscribe logged-in user using their account email
  const handleAuthenticatedSubscribe = async () => {
    if (!user?.email) return;
    
    // Already subscribed - show info toast
    if (isSubscribed) {
      toast.info('You are already subscribed to our newsletter!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update email preferences to enable newsletter
      const res = await apiFetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newsletter: true, offers: true, festive: true, others: true })
      });
      
      if (res.ok) {
        setIsSubscribed(true);
        toast.success('Successfully subscribed to newsletter!');
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subscribe guest user with email input
  const handleGuestSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Successfully subscribed! You\'ll get 10% off your first order.');
        setNewsletterEmail('');
      } else {
        toast.error(data.message || 'Failed to subscribe');
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Fetch featured products from API
    const fetchFeatured = async () => {
      try {
        const res = await apiFetch('/api/products/featured');
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data || []);
        } else {
          console.error('Failed to fetch featured products');
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
    fetchFlashSales();
    fetchTestimonials();
  }, []);

  // Fetch active flash sales
  const fetchFlashSales = async () => {
    try {
      const res = await apiFetch('/api/flash-sales/active');
      if (res.ok) {
        const data = await res.json();
        setFlashSales(data);
      }
    } catch (error) {
      console.error('Fetch flash sales error:', error);
    }
  };

  // Fetch testimonials
  const fetchTestimonials = async () => {
    try {
      const res = await apiFetch('/api/testimonials');
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error('Fetch testimonials error:', error);
    }
  };

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Cloudinary base URL
  const cloudinaryBase = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products';
  
  // Fallback data - used if API doesn't return categories/collections
  const fallbackCategories = [
    { name: 'rings', display_name: 'Rings', image: `${cloudinaryBase}/jxyw8vx454t3mnr2q8is.jpg` },
    { name: 'necklaces', display_name: 'Necklaces', image: `${cloudinaryBase}/ygijqk8osfqg10qmlzuu.jpg` },
    { name: 'earrings', display_name: 'Earrings', image: `${cloudinaryBase}/expgtk7ilimekmrjewg3.jpg` },
    { name: 'bangles', display_name: 'Bangles', image: `${cloudinaryBase}/gycyiwsxjsof0i0meafg.jpg` }
  ];

  const fallbackCollections = [
    { name: 'wedding', display_name: 'Wedding Collection', tagline: 'Celebrate your special day', image: `${cloudinaryBase}/fhlj3efhaafo5amfefyy.jpg` },
    { name: 'daily', display_name: 'Daily Wear', tagline: 'Elegance for everyday', image: `${cloudinaryBase}/expgtk7ilimekmrjewg3.jpg` },
    { name: 'festive', display_name: 'Festive', tagline: 'Shine at every celebration', image: `${cloudinaryBase}/gycyiwsxjsof0i0meafg.jpg` }
  ];

  // Use API data if available, otherwise fallback
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const displayCollections = collections.length > 0 ? collections : fallbackCollections;
  
  // Get hero settings with fallbacks
  const getSetting = (key, fallback = '') => {
    const heroSettings = siteSettings.hero;
    if (!Array.isArray(heroSettings)) return fallback;
    const setting = heroSettings.find(s => s.setting_key === key);
    return setting?.setting_value || fallback;
  };

  return (
    <>
    <SEO 
      title="Premium Indian Jewelry"
      description="Aabhar - Exquisite Gold, Diamond, Silver & Platinum Jewelry for Every Occasion. Discover our handcrafted collection of rings, necklaces, earrings, and bangles."
      type="website"
    />
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <img src={`${cloudinaryBase}/fhlj3efhaafo5amfefyy.jpg`} alt="" />
          <div className="hero-overlay"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-slide-up">
            <span className="hero-badge">
              <Sparkles size={16} /> {getSetting('hero_badge', 'PREMIUM INDIAN JEWELRY')}
            </span>
            <h1>{getSetting('hero_title', 'Exquisite Jewelry')} <span className="text-gradient">{getSetting('hero_title_highlight', 'for Every Occasion')}</span></h1>
            <p>{getSetting('hero_description', 'Discover our handcrafted collection of gold, diamond, silver, and platinum jewelry. BIS Hallmarked with lifetime exchange.')}</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Collection <ArrowRight size={20} />
              </Link>
              <Link to="/products?collection=wedding" className="btn btn-secondary btn-lg">
                Bridal Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Sales Section */}
      {flashSales.length > 0 && (
        <section className="flash-sales-section">
          <div className="container">
            <div className="flash-sales-header">
              <div className="flash-sales-title">
                <Zap size={28} className="flash-icon" />
                <h2>Flash Sale</h2>
                <span className="flash-badge">Limited Time!</span>
              </div>
            </div>
            <div className="flash-sales-grid">
              {flashSales.slice(0, 4).map((sale) => {
                const images = typeof sale.images === 'string' ? JSON.parse(sale.images) : sale.images;
                const gstPercent = parseFloat(sale.gst_percent || 3) / 100;
                const originalPrice = parseFloat(sale.original_price) || 0;
                const originalPriceWithGst = originalPrice * (1 + gstPercent);
                const discountedPrice = sale.flash_price 
                  ? parseFloat(sale.flash_price) 
                  : originalPrice * (1 - sale.discount_percentage / 100);
                const discountedPriceWithGst = discountedPrice * (1 + gstPercent);
                
                return (
                  <Link to={`/products/${sale.product_id}`} key={sale.id} className="flash-sale-card">
                    <div className="flash-sale-badge">
                      <Zap size={14} />
                      {sale.discount_percentage}% OFF
                    </div>
                    <div className="flash-sale-timer-badge">
                      <FlashSaleTimer endTime={sale.end_time} size="small" showLabel={false} />
                    </div>
                    <div className="flash-sale-image">
                      <img src={images?.[0] || '/placeholder.jpg'} alt={sale.name} />
                    </div>
                    <div className="flash-sale-info">
                      <h4>{sale.name}</h4>
                      <div className="flash-sale-prices">
                        <span className="original-price">₹{Math.round(originalPriceWithGst).toLocaleString()}</span>
                        <span className="discounted-price">₹{Math.round(discountedPriceWithGst).toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Find the perfect piece for every style</p>
          </div>
          <div className="categories-grid">
            {displayCategories.map((cat) => (
              <Link to={`/products?category=${cat.name}`} key={cat.name} className="category-card">
                <div className="category-image">
                  <img src={cat.image} alt={cat.display_name || cat.name} />
                </div>
                <h3>{cat.display_name || cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Featured Collection</h2>
              <p>Our most loved pieces, handpicked for you</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="product-skeleton">
                  <div className="skeleton" style={{ height: 280 }}></div>
                  <div className="skeleton" style={{ height: 24, marginTop: 16, width: '80%' }}></div>
                  <div className="skeleton" style={{ height: 20, marginTop: 8, width: '50%' }}></div>
                </div>
              ))
            ) : (
              featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickView={setQuickViewProduct}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Collections Banner */}
      <section className="collections-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-badge"><Crown size={16} /> Curated Collections</span>
            <h2>Explore Our Collections</h2>
            <p>From wedding elegance to everyday charm</p>
          </div>
          <div className="collections-grid">
            {displayCollections.map((col) => (
              <Link to={`/products?collection=${col.name}`} key={col.name} className="collection-card">
                <div className="collection-image">
                  <img src={col.image} alt={col.display_name || col.name} />
                </div>
                <div className="collection-content">
                  <h3>{col.display_name || col.name}</h3>
                  <p>{col.tagline || ''}</p>
                  <span className="collection-link">
                    Explore <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid features-grid-centered">
            <div className="feature-card">
              <div className="feature-icon">
                <Star />
              </div>
              <h4>BIS Hallmarked</h4>
              <p>100% certified gold and silver jewelry with purity guarantee</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Gift />
              </div>
              <h4>Lifetime Exchange</h4>
              <p>Exchange your old jewelry at full value anytime</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Crown />
              </div>
              <h4>Premium Craftsmanship</h4>
              <p>Handcrafted by master artisans with decades of expertise</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Truck />
              </div>
              <h4>Secure Delivery</h4>
              <p>Insured shipping with tamper-proof packaging across India</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="testimonials-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>What Our Customers Say</h2>
                <p>Trusted by thousands of happy customers</p>
              </div>
              {isAuthenticated && (
                <button 
                  className="btn btn-secondary share-experience-btn"
                  onClick={() => setShowTestimonialModal(true)}
                >
                  <MessageSquarePlus size={18} />
                  Share Your Experience
                </button>
              )}
            </div>
            <div className="testimonials-carousel">
              <div className="testimonial-card">
                <Quote size={32} className="quote-icon" />
                <p className="testimonial-text">"{testimonials[currentTestimonial]?.testimonial_text}"</p>
                <div className="testimonial-author">
                  {testimonials[currentTestimonial]?.customer_image ? (
                    <img 
                      src={testimonials[currentTestimonial].customer_image} 
                      alt={testimonials[currentTestimonial].customer_name}
                      className="author-avatar"
                    />
                  ) : (
                    <div className="author-avatar-fallback">
                      {testimonials[currentTestimonial]?.customer_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="author-info">
                    <strong>{testimonials[currentTestimonial]?.customer_name}</strong>
                    {testimonials[currentTestimonial]?.customer_location && (
                      <span>{testimonials[currentTestimonial].customer_location}</span>
                    )}
                    <div className="testimonial-stars">
                      {(() => {
                        const rating = testimonials[currentTestimonial]?.rating || 5;
                        const fullStars = Math.floor(rating);
                        const hasHalfStar = rating % 1 >= 0.5;
                        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                        return (
                          <>
                            {Array.from({ length: fullStars }, (_, i) => (
                              <Star key={`full-${i}`} size={14} fill="#d4af37" color="#d4af37" />
                            ))}
                            {hasHalfStar && (
                              <span style={{ position: 'relative', display: 'inline-flex', width: '14px', height: '14px' }}>
                                <Star size={14} fill="none" color="#555" style={{ position: 'absolute' }} />
                                <Star size={14} fill="#d4af37" color="#d4af37" style={{ position: 'absolute', clipPath: 'inset(0 50% 0 0)' }} />
                              </span>
                            )}
                            {Array.from({ length: emptyStars }, (_, i) => (
                              <Star key={`empty-${i}`} size={14} fill="none" color="#555" />
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              {testimonials.length > 1 && (
                <div className="testimonial-dots">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                      onClick={() => setCurrentTestimonial(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Get 10% Off Your First Order</h2>
              <p>Subscribe to our newsletter for exclusive offers and new arrivals</p>
              
              {isAuthenticated ? (
                <button 
                  className={`btn btn-primary cta-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                  onClick={handleAuthenticatedSubscribe}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Subscribing...' : isSubscribed ? '✓ Subscribed' : 'Subscribe to Newsletter'}
                </button>
              ) : (
                <form className="cta-form" onSubmit={handleGuestSubscribe}>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Quick View Modal */}
    {quickViewProduct && (
      <QuickViewModal 
        product={quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    )}

    {/* Testimonial Submit Modal */}
    <TestimonialModal
      isOpen={showTestimonialModal}
      onClose={() => setShowTestimonialModal(false)}
      onSuccess={(msg) => {
        toast.success(msg);
        fetchTestimonials();
      }}
    />
  </>
  );
};

export default Home;
