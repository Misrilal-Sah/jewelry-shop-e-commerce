import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';
import './RecommendedProducts.css';

const RecommendedProducts = ({ productId, title = "You May Also Like", limit = 4 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    if (!productId) return;
    
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}/recommendations?limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, limit]);

  if (loading) {
    return (
      <section className="recommended-section">
        <h2 className="recommended-title">{title}</h2>
        <div className="recommended-grid">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="skeleton recommendation-skeleton"></div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <section className="recommended-section">
      <div className="recommended-header">
        <h2 className="recommended-title">{title}</h2>
        <div className="title-divider">
          <span className="divider-diamond">◆</span>
        </div>
      </div>
      
      <div className="recommended-grid">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
        />
      )}
    </section>
  );
};

export default RecommendedProducts;
