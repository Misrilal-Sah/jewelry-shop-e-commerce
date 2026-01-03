import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PermissionProvider } from './context/PermissionContext';
import { ToastProvider } from './components/ui/Toast';
import { ModalProvider } from './components/ui/Modal';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ui/ScrollToTop';
import CartSidebar from './components/CartSidebar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import SharedWishlist from './pages/SharedWishlist';
import Notifications from './pages/Notifications';
import Reviews from './pages/Reviews';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminOrderView from './pages/admin/OrderView';
import AdminCustomers from './pages/admin/Customers';
import AdminCoupons from './pages/admin/Coupons';
import AdminReports from './pages/admin/Reports';
import AdminUsers from './pages/admin/AdminUsers';
import EmailCenter from './pages/admin/EmailCenter';
import FlashSales from './pages/admin/FlashSales';
import Testimonials from './pages/admin/Testimonials';
import AdminFAQs from './pages/admin/FAQs';
import AdminBlog from './pages/admin/AdminBlog';
import AdminBulkOrders from './pages/admin/BulkOrders';
import AdminLogs from './pages/admin/Logs';
import CommonDetails from './pages/admin/CommonDetails';
import BulkOrder from './pages/BulkOrder';
import FAQPage from './pages/FAQPage';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import InfoPages from './pages/InfoPages';
import { ShortcutsProvider } from './context/ShortcutsContext';
import CommandPalette from './components/ui/CommandPalette';
import CookieConsent from './components/ui/CookieConsent';
import NewsletterPopup from './components/NewsletterPopup';
import Chatbot from './components/Chatbot/Chatbot';
import './App.css';

// Component to conditionally show footer
const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  return isAdminPage ? null : <Footer />;
};

// App content wrapped in ShortcutsProvider (needs Router context for useNavigate)
const AppContent = () => {
  return (
    <ShortcutsProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/reviews" element={<Reviews />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/wishlist/shared/:shareCode" element={<SharedWishlist />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/faq" element={<FAQPage />} />
            
            {/* Admin Routes with Permission Checks */}
            <Route path="/admin" element={<ProtectedRoute resource="dashboard"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute resource="products"><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/products/new" element={<ProtectedRoute resource="products" action="create"><AdminProductForm /></ProtectedRoute>} />
            <Route path="/admin/products/edit/:id" element={<ProtectedRoute resource="products" action="edit"><AdminProductForm /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute resource="orders"><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/orders/:id" element={<ProtectedRoute resource="orders"><AdminOrderView /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute resource="customers"><AdminCustomers /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute resource="coupons"><AdminCoupons /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute resource="reports"><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute resource="users"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/email-center" element={<ProtectedRoute resource="email"><EmailCenter /></ProtectedRoute>} />
            <Route path="/admin/flash-sales" element={<ProtectedRoute resource="flash_sales"><FlashSales /></ProtectedRoute>} />
            <Route path="/admin/testimonials" element={<ProtectedRoute resource="testimonials"><Testimonials /></ProtectedRoute>} />
            <Route path="/admin/faqs" element={<ProtectedRoute resource="faqs"><AdminFAQs /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute resource="blog"><AdminBlog /></ProtectedRoute>} />
            <Route path="/admin/bulk-orders" element={<ProtectedRoute resource="bulk_orders"><AdminBulkOrders /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute resource="logs"><AdminLogs /></ProtectedRoute>} />
            <Route path="/admin/common-details" element={<ProtectedRoute resource="common_details"><CommonDetails /></ProtectedRoute>} />
            
            <Route path="/bulk-order" element={<BulkOrder />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/:page" element={<InfoPages />} />
          </Routes>
        </main>
        <ConditionalFooter />
        <ScrollToTop />
      </div>
      <CartSidebar />
      <CommandPalette />
      <CookieConsent />
      <NewsletterPopup />
      <Chatbot />
    </ShortcutsProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ModalProvider>
              <Router>
                <PermissionProvider>
                  <AppContent />
                </PermissionProvider>
              </Router>
            </ModalProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
