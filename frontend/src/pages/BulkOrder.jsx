import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Loader, Send, Award, DollarSign, Palette, Truck } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiFetch } from '../config/api';
import SEO from '../components/SEO';
import './BulkOrder.css';

const BulkOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    category: '',
    quantity: '',
    budget_range: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const categories = [
    'Rings',
    'Necklaces',
    'Earrings',
    'Bangles',
    'Bridal Sets',
    'Custom Design',
    'Mixed Categories'
  ];

  const budgetRanges = [
    'Under ₹1,00,000',
    '₹1,00,000 - ₹5,00,000',
    '₹5,00,000 - ₹10,00,000',
    '₹10,00,000 - ₹25,00,000',
    '₹25,00,000 - ₹50,00,000',
    'Above ₹50,00,000'
  ];

  // React Quill modules - simplified for customer form
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowModal(true);
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit inquiry');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Something went wrong. Please try again.');
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: Award, title: 'BIS Hallmarked', desc: 'Certified purity and quality assured' },
    { icon: DollarSign, title: 'Special Pricing', desc: 'Exclusive wholesale rates' },
    { icon: Palette, title: 'Customization', desc: 'Custom designs available' },
    { icon: Truck, title: 'Pan-India Delivery', desc: 'Secure insured shipping' }
  ];

  // Show confirmation page
  if (submitted && showModal) {
    return (
      <>
        <SEO title="Inquiry Submitted - Aabhar" />
        <div className="bulk-order-page">
          <div className="container">
            <div className="confirmation-page">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h1>Inquiry Submitted Successfully!</h1>
              <p>
                Thank you for your bulk order inquiry. Our team will review your requirements 
                and contact you within 24-48 hours with pricing and availability.
              </p>
              <p className="email-note">
                A confirmation email has been sent to <strong>{formData.email}</strong>
              </p>
              <div className="confirmation-actions">
                <button className="btn btn-primary" onClick={() => navigate('/products')}>
                  Browse Collection
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Bulk Order Inquiry - Aabhar" 
        description="Request bulk orders for jewelry. Special wholesale pricing for businesses, wedding planners, and corporate gifting. Get customized designs and exclusive rates."
      />
      <div className="bulk-order-page">
        <div className="container">
          {/* Hero Section */}
          <div className="bulk-order-hero">
            <span className="hero-badge">B2B & WHOLESALE</span>
            <h1>Bulk Order Inquiry</h1>
            <p>
              Looking to purchase jewelry in bulk? Fill out the form below and our team will get back to 
              you with special pricing and offers.
            </p>
          </div>

          {/* Form Section */}
          <div className="bulk-order-form-wrapper">
            <form onSubmit={handleSubmit} className="bulk-order-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="required">*</span> Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">
                    <span className="required">*</span> Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">
                    <span className="required">*</span> Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company_name">
                    <Package size={14} /> Company Name
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Your company or business name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">
                    <span className="required">*</span> Product Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">
                    <span className="required">*</span> Estimated Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 50"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="budget_range">
                  <span className="required">*</span> Budget Range
                </label>
                <select
                  id="budget_range"
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <div className="form-group quill-group">
                <label htmlFor="message">
                  <Package size={14} /> Your Requirements
                </label>
                <div className="quill-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={formData.message}
                    onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                    modules={quillModules}
                    placeholder="Describe your requirements, preferred designs, customization needs, etc."
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-submit" disabled={submitting}>
                <Send size={18} />
                Submit Inquiry
              </button>
            </form>
          </div>

          {/* Features Section */}
          <div className="bulk-features">
            <h2>Why Choose Us for Bulk Orders?</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">
                    <feature.icon size={24} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submitting Modal */}
        {showModal && submitting && (
          <div className="modal-overlay">
            <div className="submitting-modal">
              <Loader size={48} className="spin" />
              <h3>Submitting Your Inquiry</h3>
              <p>Please wait while we process your request...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BulkOrder;
