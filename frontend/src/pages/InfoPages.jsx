import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, HelpCircle, Truck, RotateCcw, Ruler, 
  Sparkles, Shield, Lock, FileText, Clock, CheckCircle, AlertCircle,
  Gem, Coins, CircleDot, Droplet
} from 'lucide-react';
import './InfoPages.css';

const InfoPages = () => {
  const { page } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const renderContactPage = () => (
    <div className="info-page contact-page">
      <h1>Contact Us</h1>
      <p className="page-subtitle">We'd love to hear from you! Reach out to us through any of these channels.</p>
      
      <div className="contact-grid">
        <div className="contact-card">
          <Phone className="contact-icon" />
          <h3>Phone</h3>
          <p>+91 98765 43210</p>
          <p className="contact-hours">Mon-Sat: 10AM - 8PM</p>
        </div>
        <div className="contact-card">
          <Mail className="contact-icon" />
          <h3>Email</h3>
          <p>support@Aabhar.in</p>
          <p className="contact-hours">We respond within 24 hours</p>
        </div>
        <div className="contact-card">
          <MapPin className="contact-icon" />
          <h3>Visit Our Store</h3>
          <p>123 Jewelry Lane, Zaveri Bazaar</p>
          <p>Mumbai, Maharashtra 400001</p>
        </div>
      </div>

      <div className="contact-form-section">
        <h2>Send us a Message</h2>
        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Your email" />
            </div>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" placeholder="How can we help?" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea rows="5" placeholder="Your message..."></textarea>
          </div>
          <button type="submit" className="btn-submit">Send Message</button>
        </form>
      </div>
    </div>
  );

  const renderFAQPage = () => (
    <div className="info-page faq-page">
      <h1>Frequently Asked Questions</h1>
      <p className="page-subtitle">Find answers to common questions about our products and services.</p>
      
      <div className="faq-categories">
        <div className="faq-category">
          <h2><HelpCircle size={24} /> Ordering & Payment</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>What payment methods do you accept?</summary>
              <p>We accept all major credit/debit cards (Visa, MasterCard, American Express), UPI, Net Banking, and Cash on Delivery for orders under ₹50,000.</p>
            </details>
            <details className="faq-item">
              <summary>Is it safe to use my credit card on your website?</summary>
              <p>Absolutely! Our website uses 256-bit SSL encryption. All payment transactions are processed through secure, PCI-compliant payment gateways.</p>
            </details>
            <details className="faq-item">
              <summary>Can I cancel my order?</summary>
              <p>Yes, you can cancel your order within 24 hours of placing it, provided it hasn't been shipped yet. Contact our support team for assistance.</p>
            </details>
          </div>
        </div>

        <div className="faq-category">
          <h2><Truck size={24} /> Shipping & Delivery</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>How long does delivery take?</summary>
              <p>Standard delivery takes 5-7 business days. Express delivery (2-3 business days) is available for metro cities at an additional charge.</p>
            </details>
            <details className="faq-item">
              <summary>Do you ship internationally?</summary>
              <p>Currently, we ship only within India. International shipping will be available soon.</p>
            </details>
            <details className="faq-item">
              <summary>Is shipping free?</summary>
              <p>Yes! We offer free shipping on all orders above ₹10,000. Below that, a flat shipping fee of ₹200 applies.</p>
            </details>
          </div>
        </div>

        <div className="faq-category">
          <h2><RotateCcw size={24} /> Returns & Refunds</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>What is your return policy?</summary>
              <p>We offer a 15-day return policy on all products. Items must be unused, unworn, and in original packaging with all tags attached.</p>
            </details>
            <details className="faq-item">
              <summary>How do I initiate a return?</summary>
              <p>Log into your account, go to Orders, select the item you wish to return, and follow the return process. Our team will arrange pickup.</p>
            </details>
            <details className="faq-item">
              <summary>When will I receive my refund?</summary>
              <p>Refunds are processed within 7-10 business days after we receive and inspect the returned item.</p>
            </details>
          </div>
        </div>

        <div className="faq-category">
          <h2><Shield size={24} /> Product Quality</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>Are your products hallmarked?</summary>
              <p>Yes, all our gold and silver jewelry is BIS Hallmarked, guaranteeing the purity and authenticity of the metal.</p>
            </details>
            <details className="faq-item">
              <summary>Do you provide certificates for diamonds?</summary>
              <p>Yes, all diamonds above 0.30 carats come with IGI or GIA certification.</p>
            </details>
            <details className="faq-item">
              <summary>Do you offer a warranty?</summary>
              <p>Yes, we offer a lifetime warranty against manufacturing defects. This includes free polishing and rhodium plating for white gold items.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShippingPage = () => (
    <div className="info-page shipping-page">
      <h1>Shipping Information</h1>
      <p className="page-subtitle">Everything you need to know about our shipping policies and delivery times.</p>
      
      <div className="info-cards">
        <div className="info-card">
          <Truck className="info-icon" />
          <h3>Free Shipping</h3>
          <p>Enjoy free shipping on all orders above ₹10,000. For orders below this amount, a flat shipping fee of ₹200 applies.</p>
        </div>
        <div className="info-card">
          <Clock className="info-icon" />
          <h3>Delivery Time</h3>
          <p>Standard delivery: 5-7 business days. Express delivery (metro cities): 2-3 business days at ₹350 extra.</p>
        </div>
        <div className="info-card">
          <Shield className="info-icon" />
          <h3>Secure Packaging</h3>
          <p>All jewelry is carefully packaged in tamper-proof boxes with proper cushioning and insurance coverage.</p>
        </div>
      </div>

      <div className="shipping-details">
        <h2>Shipping Zones & Timelines</h2>
        <table className="shipping-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Cities</th>
              <th>Standard Delivery</th>
              <th>Express Delivery</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Zone 1</td>
              <td>Mumbai, Delhi, Bangalore, Chennai, Hyderabad</td>
              <td>3-5 days</td>
              <td>1-2 days</td>
            </tr>
            <tr>
              <td>Zone 2</td>
              <td>Pune, Ahmedabad, Kolkata, Jaipur, Lucknow</td>
              <td>5-7 days</td>
              <td>2-3 days</td>
            </tr>
            <tr>
              <td>Zone 3</td>
              <td>Other major cities</td>
              <td>7-10 days</td>
              <td>3-5 days</td>
            </tr>
            <tr>
              <td>Zone 4</td>
              <td>Remote areas</td>
              <td>10-15 days</td>
              <td>5-7 days</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReturnsPage = () => (
    <div className="info-page returns-page">
      <h1>Returns & Exchange Policy</h1>
      <p className="page-subtitle">We want you to be completely satisfied with your purchase.</p>
      
      <div className="policy-highlights">
        <div className="highlight-card">
          <CheckCircle className="highlight-icon success" />
          <h3>15-Day Returns</h3>
          <p>Easy returns within 15 days of delivery</p>
        </div>
        <div className="highlight-card">
          <RotateCcw className="highlight-icon" />
          <h3>Free Exchange</h3>
          <p>Exchange for different size or design</p>
        </div>
        <div className="highlight-card">
          <Shield className="highlight-icon" />
          <h3>Full Refund</h3>
          <p>100% refund for eligible returns</p>
        </div>
      </div>

      <div className="policy-section">
        <h2>Return Eligibility</h2>
        <ul className="policy-list">
          <li><CheckCircle size={16} /> Item must be unused, unworn, and in original condition</li>
          <li><CheckCircle size={16} /> Original packaging with all tags attached</li>
          <li><CheckCircle size={16} /> Invoice and authentication certificates included</li>
          <li><CheckCircle size={16} /> Return request raised within 15 days of delivery</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>Non-Returnable Items</h2>
        <ul className="policy-list warning">
          <li><AlertCircle size={16} /> Customized or personalized jewelry</li>
          <li><AlertCircle size={16} /> Items with engraving or alterations</li>
          <li><AlertCircle size={16} /> Resized rings or adjusted items</li>
          <li><AlertCircle size={16} /> Items purchased on final sale</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>How to Return</h2>
        <ol className="steps-list">
          <li>Log into your account and go to "My Orders"</li>
          <li>Select the item and click "Return/Exchange"</li>
          <li>Choose reason and preferred resolution</li>
          <li>Schedule a pickup or drop at nearest center</li>
          <li>Refund processed within 7-10 business days</li>
        </ol>
      </div>
    </div>
  );

  const renderSizeGuidePage = () => (
    <div className="info-page size-guide-page">
      <h1>Size Guide</h1>
      <p className="page-subtitle">Find your perfect fit with our comprehensive sizing guide.</p>
      
      <div className="size-section">
        <h2><Ruler size={24} /> Ring Size Guide</h2>
        <p>Use a piece of string or paper strip to measure around your finger. Compare with the chart below:</p>
        <table className="size-table">
          <thead>
            <tr>
              <th>India Size</th>
              <th>US Size</th>
              <th>Diameter (mm)</th>
              <th>Circumference (mm)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>6</td><td>3</td><td>14.0</td><td>44.0</td></tr>
            <tr><td>8</td><td>4</td><td>14.8</td><td>46.5</td></tr>
            <tr><td>10</td><td>5</td><td>15.6</td><td>49.0</td></tr>
            <tr><td>12</td><td>6</td><td>16.5</td><td>51.8</td></tr>
            <tr><td>14</td><td>7</td><td>17.3</td><td>54.4</td></tr>
            <tr><td>16</td><td>8</td><td>18.1</td><td>57.0</td></tr>
            <tr><td>18</td><td>9</td><td>19.0</td><td>59.5</td></tr>
            <tr><td>20</td><td>10</td><td>19.8</td><td>62.1</td></tr>
          </tbody>
        </table>
      </div>

      <div className="size-section">
        <h2>Bangle Size Guide</h2>
        <p>Measure the widest part of your hand when fingers are closed:</p>
        <table className="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Inner Diameter</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>2-2</td><td>53 mm</td><td>Small/Petite hands</td></tr>
            <tr><td>2-4</td><td>57 mm</td><td>Medium hands</td></tr>
            <tr><td>2-6</td><td>60 mm</td><td>Medium-Large hands</td></tr>
            <tr><td>2-8</td><td>63 mm</td><td>Large hands</td></tr>
            <tr><td>2-10</td><td>67 mm</td><td>Extra Large hands</td></tr>
          </tbody>
        </table>
      </div>

      <div className="size-section">
        <h2>Necklace Length Guide</h2>
        <table className="size-table">
          <thead>
            <tr>
              <th>Length</th>
              <th>Name</th>
              <th>Sits At</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>14"</td><td>Collar</td><td>Around the neck</td></tr>
            <tr><td>16"</td><td>Choker</td><td>Base of neck</td></tr>
            <tr><td>18"</td><td>Princess</td><td>Collarbone</td></tr>
            <tr><td>20-22"</td><td>Matinee</td><td>Above bust</td></tr>
            <tr><td>24-28"</td><td>Opera</td><td>At bust</td></tr>
            <tr><td>30"+</td><td>Rope</td><td>Below bust</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCarePage = () => (
    <div className="info-page care-page">
      <h1>Jewelry Care Guide</h1>
      <p className="page-subtitle">Keep your precious jewelry looking beautiful for years to come.</p>
      
      <div className="care-cards">
        <div className="care-card gold">
          <h3><Coins className="care-icon" /> Gold Jewelry Care</h3>
          <ul>
            <li>Remove before swimming or bathing</li>
            <li>Avoid contact with perfumes and lotions</li>
            <li>Clean with mild soap and warm water</li>
            <li>Store in separate soft pouches</li>
            <li>Polish gently with a soft cloth</li>
          </ul>
        </div>
        <div className="care-card diamond">
          <h3><Gem className="care-icon" /> Diamond Jewelry Care</h3>
          <ul>
            <li>Soak in warm water with mild dish soap</li>
            <li>Use a soft brush to clean around settings</li>
            <li>Rinse thoroughly and pat dry</li>
            <li>Have prongs checked annually</li>
            <li>Store separately to avoid scratches</li>
          </ul>
        </div>
        <div className="care-card silver">
          <h3><CircleDot className="care-icon" /> Silver Jewelry Care</h3>
          <ul>
            <li>Store in anti-tarnish bags</li>
            <li>Use silver polishing cloth regularly</li>
            <li>Avoid humidity and sulfur exposure</li>
            <li>Remove during household chores</li>
            <li>Clean with specialized silver cleaner</li>
          </ul>
        </div>
        <div className="care-card pearl">
          <h3><Droplet className="care-icon" /> Pearl Jewelry Care</h3>
          <ul>
            <li>Put on last, take off first</li>
            <li>Avoid contact with all chemicals</li>
            <li>Wipe with soft damp cloth after wearing</li>
            <li>Store flat to prevent stretching</li>
            <li>Have strands restrung annually</li>
          </ul>
        </div>
      </div>

      <div className="care-tips">
        <h2>General Tips</h2>
        <div className="tips-grid">
          <div className="tip">
            <CheckCircle size={20} />
            <p>Remove jewelry before exercise, cleaning, or sleeping</p>
          </div>
          <div className="tip">
            <CheckCircle size={20} />
            <p>Apply makeup, hairspray, and perfume before wearing jewelry</p>
          </div>
          <div className="tip">
            <CheckCircle size={20} />
            <p>Store pieces separately to prevent scratching</p>
          </div>
          <div className="tip">
            <CheckCircle size={20} />
            <p>Have jewelry professionally cleaned once a year</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyPage = () => (
    <div className="info-page legal-page">
      <h1>Privacy Policy</h1>
      <p className="page-subtitle">Last updated: December 2024</p>
      
      <div className="legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly, including name, email, phone number, shipping address, and payment information when you make a purchase or create an account.</p>
        </section>
        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to process orders, communicate about your purchases, send promotional emails (with your consent), improve our services, and prevent fraud.</p>
        </section>
        <section>
          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share data with service providers who assist in delivering orders, processing payments, and providing customer support.</p>
        </section>
        <section>
          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures including SSL encryption, secure payment processing, and regular security audits to protect your information.</p>
        </section>
        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. Contact us at privacy@Aabhar.in for any privacy-related requests.</p>
        </section>
      </div>
    </div>
  );

  const renderTermsPage = () => (
    <div className="info-page legal-page">
      <h1>Terms of Service</h1>
      <p className="page-subtitle">Last updated: December 2024</p>
      
      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using the Aabhar website, you accept and agree to be bound by these Terms of Service and our Privacy Policy.</p>
        </section>
        <section>
          <h2>2. Products and Pricing</h2>
          <p>All product prices are in Indian Rupees (INR) and include applicable taxes. We reserve the right to modify prices without prior notice. Prices are subject to change based on gold/diamond rates.</p>
        </section>
        <section>
          <h2>3. Order Acceptance</h2>
          <p>Your order constitutes an offer to purchase. We reserve the right to accept or decline your order. Order confirmation email does not constitute acceptance until the product is shipped.</p>
        </section>
        <section>
          <h2>4. Authentication</h2>
          <p>All jewelry sold on Aabhar comes with BIS Hallmark certification for gold and silver. Diamonds above 0.30 carats are accompanied by IGI/GIA certificates.</p>
        </section>
        <section>
          <h2>5. Intellectual Property</h2>
          <p>All content on this website, including designs, images, logos, and text, is the property of Aabhar and protected by copyright laws.</p>
        </section>
        <section>
          <h2>6. Limitation of Liability</h2>
          <p>Aabhar shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
        </section>
      </div>
    </div>
  );

  const pages = {
    'contact': renderContactPage,
    'faq': renderFAQPage,
    'shipping': renderShippingPage,
    'returns': renderReturnsPage,
    'size-guide': renderSizeGuidePage,
    'care': renderCarePage,
    'privacy': renderPrivacyPage,
    'terms': renderTermsPage,
  };

  const renderPage = pages[page];

  if (!renderPage) {
    return (
      <div className="info-page not-found">
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="info-pages-container">
      {renderPage()}
    </div>
  );
};

export default InfoPages;
