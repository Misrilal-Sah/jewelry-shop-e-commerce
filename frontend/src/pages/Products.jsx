import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, X, ChevronDown, Check } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import SEO from '../components/SEO';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOpen, setSortOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const sortRef = useRef(null);

  // Parse comma-separated URL params into arrays
  const parseArrayParam = (param) => {
    const value = searchParams.get(param);
    return value ? value.split(',').filter(Boolean) : [];
  };

  const [filters, setFilters] = useState({
    category: parseArrayParam('category'),
    collection: parseArrayParam('collection'),
    metal_type: parseArrayParam('metal'),
    purity: parseArrayParam('purity'),
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'popular'
  });

  // Sort options
  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' }
  ];

  // Mock products for testing
  const mockProducts = [
    {
      id: 1,
      name: 'Royal Diamond Solitaire Ring',
      category: 'rings',
      collection: 'wedding',
      metal_type: 'diamond',
      purity: '18K',
      weight_grams: 4.5,
      metal_price: 125000,
      making_charges: 15000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/jxyw8vx454t3mnr2q8is.jpg'],
      rating: 4.8,
      review_count: 124,
      is_featured: true,
      stock: 10
    },
    {
      id: 2,
      name: 'Traditional Gold Necklace Set',
      category: 'necklaces',
      collection: 'wedding',
      metal_type: 'gold',
      purity: '22K',
      weight_grams: 45,
      metal_price: 285000,
      making_charges: 35000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/ygijqk8osfqg10qmlzuu.jpg'],
      rating: 4.9,
      review_count: 89,
      is_featured: true,
      stock: 5
    },
    {
      id: 3,
      name: 'Diamond Stud Earrings',
      category: 'earrings',
      collection: 'daily',
      metal_type: 'diamond',
      purity: '18K',
      weight_grams: 3.2,
      metal_price: 85000,
      making_charges: 10000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/expgtk7ilimekmrjewg3.jpg'],
      rating: 4.7,
      review_count: 156,
      is_featured: true,
      stock: 15
    },
    {
      id: 4,
      name: 'Gold Kada Bangles Set',
      category: 'bangles',
      collection: 'festive',
      metal_type: 'gold',
      purity: '22K',
      weight_grams: 32,
      metal_price: 195000,
      making_charges: 25000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/gycyiwsxjsof0i0meafg.jpg'],
      rating: 4.6,
      review_count: 78,
      stock: 8
    },
    {
      id: 5,
      name: 'Bridal Complete Set',
      category: 'bridal',
      collection: 'wedding',
      metal_type: 'gold',
      purity: '22K',
      weight_grams: 120,
      metal_price: 750000,
      making_charges: 95000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/fhlj3efhaafo5amfefyy.jpg'],
      rating: 4.9,
      review_count: 45,
      is_featured: true,
      stock: 3
    },
    {
      id: 6,
      name: 'Platinum Engagement Ring',
      category: 'rings',
      collection: 'wedding',
      metal_type: 'platinum',
      purity: '950',
      weight_grams: 5.8,
      metal_price: 185000,
      making_charges: 22000,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/jxyw8vx454t3mnr2q8is.jpg'],
      rating: 4.8,
      review_count: 67,
      stock: 6
    },
    {
      id: 7,
      name: 'Silver Anklet Pair',
      category: 'bangles',
      collection: 'daily',
      metal_type: 'silver',
      purity: '925',
      weight_grams: 25,
      metal_price: 3500,
      making_charges: 1500,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/gycyiwsxjsof0i0meafg.jpg'],
      rating: 4.5,
      review_count: 234,
      stock: 20
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync filters with URL params when they change
  useEffect(() => {
    const newFilters = {
      category: parseArrayParam('category'),
      collection: parseArrayParam('collection'),
      metal_type: parseArrayParam('metal'),
      purity: parseArrayParam('purity'),
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      sort: searchParams.get('sort') || 'popular'
    };
    setFilters(newFilters);
    window.scrollTo(0, 0);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products?.length > 0 ? data.products : filterMockProducts());
      } else {
        setProducts(filterMockProducts());
      }
    } catch (error) {
      setProducts(filterMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const filterMockProducts = () => {
    let filtered = [...mockProducts];

    // Multiselect filters - check if product matches any selected value
    if (filters.category.length > 0) {
      filtered = filtered.filter(p => filters.category.includes(p.category));
    }
    if (filters.collection.length > 0) {
      filtered = filtered.filter(p => filters.collection.includes(p.collection));
    }
    if (filters.metal_type.length > 0) {
      filtered = filtered.filter(p => filters.metal_type.includes(p.metal_type));
    }
    if (filters.purity.length > 0) {
      filtered = filtered.filter(p => filters.purity.includes(p.purity));
    }
    if (filters.min_price) {
      filtered = filtered.filter(p => 
        (parseFloat(p.metal_price) + parseFloat(p.making_charges)) >= parseFloat(filters.min_price)
      );
    }
    if (filters.max_price) {
      filtered = filtered.filter(p => 
        (parseFloat(p.metal_price) + parseFloat(p.making_charges)) <= parseFloat(filters.max_price)
      );
    }

    // Sort
    switch (filters.sort) {
      case 'price_low':
        filtered.sort((a, b) => 
          (a.metal_price + a.making_charges) - (b.metal_price + b.making_charges)
        );
        break;
      case 'price_high':
        filtered.sort((a, b) => 
          (b.metal_price + b.making_charges) - (a.metal_price + a.making_charges)
        );
        break;
      case 'newest':
        // Keep original order for mock data
        break;
      default:
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return filtered;
  };

  // Handle multiselect toggle for array filters
  const handleMultiSelectChange = (key, value) => {
    setFilters(prev => {
      const currentArray = prev[key];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value) // Remove if exists
        : [...currentArray, value]; // Add if not exists
      
      // Update URL params
      const paramKey = key === 'metal_type' ? 'metal' : key;
      if (newArray.length > 0) {
        searchParams.set(paramKey, newArray.join(','));
      } else {
        searchParams.delete(paramKey);
      }
      setSearchParams(searchParams);
      
      return { ...prev, [key]: newArray };
    });
  };

  // Handle single value filters (price, sort)
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (value) => {
    handleFilterChange('sort', value);
    setSortOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      category: [],
      collection: [],
      metal_type: [],
      purity: [],
      min_price: '',
      max_price: '',
      sort: 'popular'
    });
    setSearchParams({});
  };

  const activeFilterCount = 
    filters.category.length + 
    filters.collection.length + 
    filters.metal_type.length + 
    filters.purity.length + 
    (filters.min_price ? 1 : 0) + 
    (filters.max_price ? 1 : 0);

  const categories = ['rings', 'necklaces', 'earrings', 'bangles'];
  const collections = ['wedding', 'daily', 'festive', 'modern'];
  const metals = ['gold', 'diamond', 'silver', 'platinum'];
  const purities = ['22K', '18K', '14K', '950', '925'];

  const getCurrentSortLabel = () => {
    return sortOptions.find(opt => opt.value === filters.sort)?.label || 'Most Popular';
  };

  // Generate SEO title based on filters
  const getSeoTitle = () => {
    if (filters.category.length === 1) {
      return `${filters.category[0].charAt(0).toUpperCase() + filters.category[0].slice(1)} Jewelry`;
    }
    if (filters.collection.length === 1) {
      return `${filters.collection[0].charAt(0).toUpperCase() + filters.collection[0].slice(1)} Collection`;
    }
    return 'Shop All Jewelry';
  };

  return (
    <>
    <SEO 
      title={getSeoTitle()}
      description={`Explore our exquisite collection of ${filters.category.length === 1 ? filters.category[0] : 'handcrafted jewelry'}. Gold, Diamond, Silver & Platinum pieces for every occasion. BIS Hallmarked with lifetime exchange.`}
      keywords={`jewelry, ${filters.category.join(', ')}, ${filters.metal_type.join(', ')}, Indian jewelry, Aabhar`}
    />
    <div className="products-page">
      <div className="container">
        {/* Header */}
        <div className="products-header">
          <div>
            <h1>
              {filters.category.length === 1 
                ? filters.category[0].charAt(0).toUpperCase() + filters.category[0].slice(1) 
                : filters.collection.length === 1 
                  ? filters.collection[0].charAt(0).toUpperCase() + filters.collection[0].slice(1) + ' Collection'
                  : activeFilterCount > 0 
                    ? `Filtered Results (${activeFilterCount})`
                    : 'All Jewelry'}
            </h1>
            <p>{products.length} products found</p>
          </div>
          <div className="products-controls">
            <button 
              className={`filter-toggle ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              Filters
              {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>
            
            {/* Custom Sort Dropdown */}
            <div className="sort-dropdown-wrapper" ref={sortRef}>
              <button 
                className={`sort-dropdown-trigger ${sortOpen ? 'open' : ''}`}
                onClick={() => setSortOpen(!sortOpen)}
              >
                <span>{getCurrentSortLabel()}</span>
                <ChevronDown size={16} />
              </button>
              {sortOpen && (
                <div className="sort-dropdown-menu">
                  {sortOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`sort-dropdown-option ${filters.sort === option.value ? 'active' : ''}`}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {filters.sort === option.value && <Check size={14} />}
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''} 
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''} 
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3><Filter size={18} /> Filters</h3>
              <button className="clear-filters" onClick={clearFilters}>Clear All</button>
              <button className="close-filters" onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <div className="filter-options">
                {categories.map(cat => (
                  <label key={cat} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(cat)}
                      onChange={() => handleMultiSelectChange('category', cat)}
                    />
                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Collection</h4>
              <div className="filter-options">
                {collections.map(col => (
                  <label key={col} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.collection.includes(col)}
                      onChange={() => handleMultiSelectChange('collection', col)}
                    />
                    <span>{col.charAt(0).toUpperCase() + col.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Metal Type</h4>
              <div className="filter-options">
                {metals.map(metal => (
                  <label key={metal} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.metal_type.includes(metal)}
                      onChange={() => handleMultiSelectChange('metal_type', metal)}
                    />
                    <span>{metal.charAt(0).toUpperCase() + metal.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Purity</h4>
              <div className="filter-options">
                {purities.map(purity => (
                  <label key={purity} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.purity.includes(purity)}
                      onChange={() => handleMultiSelectChange('purity', purity)}
                    />
                    <span>{purity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-range-inputs">
                <div className="price-field">
                  <label>Min ₹</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  />
                </div>
                <span className="price-separator">to</span>
                <div className="price-field">
                  <label>Max ₹</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            {loading ? (
              <div className={`products-grid ${viewMode}`}>
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="product-skeleton">
                    <div className="skeleton" style={{ aspectRatio: 1 }}></div>
                    <div className="skeleton" style={{ height: 24, marginTop: 16, width: '80%' }}></div>
                    <div className="skeleton" style={{ height: 20, marginTop: 8, width: '50%' }}></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={`products-grid ${viewMode}`}>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your filters or browse our full collection.</p>
                <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Quick View Modal */}
    {quickViewProduct && (
      <QuickViewModal 
        product={quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    )}
  </>
  );
};

export default Products;
