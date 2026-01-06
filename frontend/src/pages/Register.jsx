import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import { apiFetch } from '../config/api';
import './Auth.css';

const GOOGLE_CLIENT_ID = '369652678716-quc851ragg1k8lksqmrnq20vmrkdaanr.apps.googleusercontent.com';

const Register = () => {
  const navigate = useNavigate();
  const { login: authLogin, loginWithGoogle } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const googleBtnRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputRefs = useRef([]);

  // Handle Google credential response
  const handleGoogleCallback = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        modal.error('Registration Failed', result.message || 'Google sign up failed');
      }
    } catch (err) {
      modal.error('Registration Failed', 'Google sign up failed');
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
      if (window.google && googleBtnRef.current && step === 1) {
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
            text: 'signup_with',
            width: 320,
            logo_alignment: 'center'
          }
        );
      }
    };
    
    // Small delay to ensure ref is ready
    setTimeout(loadGoogleScript, 100);
  }, [handleGoogleCallback, step]);

  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpValues = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtpValues[i] = pastedData[i];
    }
    setOtpValues(newOtpValues);
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const getOtpString = () => otpValues.join('');

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      modal.error('Password Mismatch', 'Oops! The passwords you entered do not match. Please check and try again.');
      return;
    }

    if (formData.password.length < 6) {
      modal.error('Weak Password', 'Password must be at least 6 characters long for security.');
      return;
    }

    modal.loading('Sending Verification Email', 'Please wait while we send the OTP to your email...');
    
    try {
      const res = await apiFetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        toast.success('OTP sent to your email!');
        setStep(2);
      } else {
        modal.error('Registration Error', data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server. Please check your internet connection.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otp = getOtpString();

    if (otp.length !== 6) {
      modal.error('Invalid OTP', 'Please enter all 6 digits of the verification code.');
      return;
    }

    modal.loading('Verifying Email', 'Please wait while we verify your email address...');
    
    try {
      const res = await apiFetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        modal.success('Welcome to Aabhar!', 'Your account has been created successfully.');
        localStorage.setItem('token', data.token);
        authLogin(data.token, data.user);
        setTimeout(() => navigate('/'), 1500);
      } else {
        modal.error('Verification Failed', data.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server. Please check your internet connection.');
    }
  };

  const handleResendOTP = async () => {
    modal.loading('Resending OTP', 'Please wait while we resend the verification code...');
    
    try {
      const res = await apiFetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        })
      });
      
      modal.hide();
      
      if (res.ok) {
        toast.success('OTP resent to your email!');
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const data = await res.json();
        modal.error('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server.');
    }
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
            
            {step === 1 ? (
              <>
                <h1>Create Account</h1>
                <p>Join us for exclusive offers and more</p>
              </>
            ) : (
              <>
                <h1>Verify Email</h1>
                <p>Enter the OTP sent to</p>
                <p className="email-highlight">{formData.email}</p>
              </>
            )}
          </div>

          {step === 1 ? (
            <>
              {/* Google Sign-Up Button */}
              <div className="social-login">
                <div ref={googleBtnRef} className="google-btn-container"></div>
                {googleLoading && <p className="social-loading">Creating account with Google...</p>}
              </div>

              <div className="auth-divider">
                <span>or register with email</span>
              </div>

              <form onSubmit={handleSendOTP} className="auth-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
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

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <label className="terms-checkbox">
                  <input type="checkbox" required />
                  <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
                </label>

                <button type="submit" className="btn btn-primary btn-lg auth-submit">
                  Continue
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOTP} className="auth-form otp-form">
              <div className="otp-boxes">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="otp-box"
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit">
                Verify & Create Account
              </button>

              <div className="otp-actions">
                <button type="button" className="btn-link" onClick={handleResendOTP}>
                  Resend OTP
                </button>
                <button type="button" className="btn-link" onClick={() => { setStep(1); setOtpValues(['', '', '', '', '', '']); }}>
                  <ArrowLeft size={16} /> Change Email
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
