import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import { apiFetch } from '../config/api';
import './Auth.css';

const GOOGLE_CLIENT_ID = '369652678716-quc851ragg1k8lksqmrnq20vmrkdaanr.apps.googleusercontent.com';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithPhone } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const googleBtnRef = useRef(null);
  
  // Login method tab
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'phone'
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Phone login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(null); // For dev mode testing
  const otpRefs = useRef([]);

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

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Email login handler
  const handleEmailSubmit = async (e) => {
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

  // Send OTP handler
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      modal.error('Invalid Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    setSendingOtp(true);
    modal.loading('Sending OTP', 'Please wait while we send the code to your phone...');
    
    try {
      const res = await apiFetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        setOtpSent(true);
        setResendTimer(30);
        toast.success('OTP sent successfully!');
        
        // Dev mode - store OTP for auto-fill
        if (data.devMode && data.devOtp) {
          setDevOtp(data.devOtp);
        }
        
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        modal.error('Failed', data.message || 'Failed to send OTP');
      }
    } catch (err) {
      modal.hide();
      modal.error('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // OTP input handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // OTP paste handler
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // OTP backspace handler
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      modal.error('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }
    
    setVerifyingOtp(true);
    modal.loading('Verifying OTP', 'Please wait while we verify the code...');
    
    try {
      const res = await apiFetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        modal.loading('Signing In', 'Please wait while we log you in...');
        // Use loginWithPhone from AuthContext
        if (loginWithPhone) {
          await loginWithPhone(data.token, data.user);
        } else {
          // Fallback - store token directly
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        modal.hide();
        toast.success(data.isNewUser ? 'Account created! Welcome!' : 'Welcome back!');
        navigate('/');
      } else {
        modal.hide();
        modal.error('Verification Failed', data.message || 'Invalid OTP');
      }
    } catch (err) {
      modal.hide();
      modal.error('Error', 'Verification failed. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Reset phone login state
  const resetPhoneLogin = () => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setDevOtp(null);
    setResendTimer(0);
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
              <span className="logo-text">AABHAR</span>
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
            <span>or continue with</span>
          </div>

          {/* Login Method Tabs */}
          <div className="login-method-tabs">
            <button 
              className={`method-tab ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => { setLoginMethod('email'); resetPhoneLogin(); }}
            >
              <Mail size={16} />
              <span>Email</span>
            </button>
            <button 
              className={`method-tab ${loginMethod === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('phone')}
            >
              <Phone size={16} />
              <span>Phone</span>
            </button>
          </div>

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="auth-form">
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
            </form>
          )}

          {/* Phone OTP Login Form */}
          {loginMethod === 'phone' && (
            <div className="auth-form phone-login-form">
              {!otpSent ? (
                /* Phone Number Input */
                <>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="phone-input-wrapper">
                      <span className="country-code">+91</span>
                      <input
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        className="phone-input"
                      />
                    </div>
                    <p className="input-hint">We'll send you a one-time password</p>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg auth-submit"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || phone.length !== 10}
                  >
                    Send OTP
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                /* OTP Input */
                <>
                  <div className="otp-section">
                    <p className="otp-message">
                      Enter the 6-digit code sent to <strong>+91 {phone}</strong>
                    </p>
                    
                    {/* Dev Mode Indicator */}
                    {devOtp && (
                      <div className="dev-otp-hint">
                        <span>🔧 Dev Mode OTP: <strong>{devOtp}</strong></span>
                        <button 
                          type="button" 
                          onClick={() => setOtp(devOtp.split(''))}
                          className="btn-auto-fill"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                    
                    <div className="otp-inputs">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => otpRefs.current[i] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          className="otp-input"
                        />
                      ))}
                    </div>
                    
                    <div className="otp-actions">
                      <button 
                        type="button" 
                        className="btn-text"
                        onClick={resetPhoneLogin}
                      >
                        Change Number
                      </button>
                      <button 
                        type="button" 
                        className="btn-text"
                        onClick={handleSendOtp}
                        disabled={resendTimer > 0 || sendingOtp}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg auth-submit"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.join('').length !== 6}
                  >
                    Verify & Sign In
                  </button>
                </>
              )}
            </div>
          )}

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create Account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

