import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';
import './FAQPage.css';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error('Fetch FAQs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/faqs/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const cat = faq.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <>
    <SEO 
      title="Frequently Asked Questions"
      description="Find answers to common questions about Aabhar jewelry, orders, shipping, returns, payments, and more. Get help with your jewelry shopping experience."
      keywords="FAQ, questions, help, jewelry, orders, shipping, returns, Aabhar"
    />
    <div className="faq-page">
      <div className="container">
        <div className="faq-header">
          <HelpCircle size={48} className="faq-icon" />
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our products and services</p>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="faq-filters">
            <button 
              className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQ List */}
        <div className="faq-content">
          {loading ? (
            <div className="loading">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <HelpCircle size={48} />
              </div>
              <h2>No FAQs Available</h2>
              <p>Check back later for answers to common questions.</p>
            </div>
          ) : (
            Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <div key={category} className="faq-category">
                {activeCategory === 'all' && (
                  <h2 className="category-title">{category}</h2>
                )}
                <div className="faq-list">
                  {categoryFaqs.map(faq => (
                    <div 
                      key={faq.id} 
                      className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                    >
                      <button 
                        className="faq-question"
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      >
                        <span>{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="faq-contact">
          <h3>Still have questions?</h3>
          <p>Can't find what you're looking for? Our customer support team is here to help.</p>
          <a href="/contact" className="btn btn-primary">Contact Us</a>
        </div>
      </div>
    </div>
    </>
  );
};

export default FAQPage;
