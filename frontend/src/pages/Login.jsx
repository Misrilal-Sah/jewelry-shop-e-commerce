import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import './Auth.css';

const GOOGLE_CLIENT_ID = '369652678716-quc851ragg1k8lksqmrnq20vmrkdaanr.apps.googleusercontent.com';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const googleBtnRef = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google credential response
  const handleGoogleCallback = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/');
      } else {
        modal.error('Login Failed', result.message || 'Google sign in failed');
      }
    } catch (err) {
      modal.error('Login Failed', 'Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate, toast, modal]);

  // Initialize Google Sign-In
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.getElementById('google-signin-script')) {
        initializeGoogle();
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        initializeGoogle();
      };
    };

    const initializeGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        
        // Render official Google button
        window.google.accounts.id.renderButton(
          googleBtnRef.current,
          { 
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 320,
            logo_alignment: 'center'
          }
        );
      }
    };
    
    // Small delay to ensure ref is ready
    setTimeout(loadGoogleScript, 100);
  }, [handleGoogleCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      const errorMsg = result.message || 'Invalid credentials';
      modal.error('Login Failed', errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <img 
                src="https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/alankara-emblem.png" 
                alt="Aabhar" 
                className="logo-emblem"
              />
              <span className="logo-divider">|</span>
              <span className="logo-text">Aabhar</span>
            </Link>
            <h1>Welcome Back</h1>
            <p>Sign in to access your account</p>
          </div>

          {/* Google Sign-In Button */}
          <div className="social-login">
            <div ref={googleBtnRef} className="google-btn-container"></div>
            {googleLoading && <p className="social-loading">Signing in with Google...</p>}
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="demo-info">
              <Info size={16} />
              <span>Demo: admin@Aabhar.in / admin123</span>
            </div>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create Account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
