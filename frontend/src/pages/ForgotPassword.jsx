import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const modal = useModal();
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

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
    modal.loading('Sending Reset Code', 'Please wait while we send the OTP to your email...');

    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        toast.success('OTP sent to your email!');
        setStep(2);
      } else {
        modal.error('Error', data.message || 'Failed to send OTP. Please check if the email is registered.');
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

    modal.loading('Verifying Code', 'Please wait while we verify your OTP...');

    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        toast.success('OTP verified!');
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        modal.error('Verification Failed', data.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server. Please check your internet connection.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      modal.error('Password Mismatch', 'Oops! New password and confirm password do not match. Please check and try again.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      modal.error('Weak Password', 'Password must be at least 6 characters long for security.');
      return;
    }

    modal.loading('Resetting Password', 'Please wait while we update your password...');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resetToken, 
          newPassword: passwords.newPassword 
        })
      });
      
      const data = await res.json();
      modal.hide();
      
      if (res.ok) {
        modal.success('Password Reset', 'Your password has been reset successfully! You can now login with your new password.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        modal.error('Reset Failed', data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      modal.hide();
      modal.error('Network Error', 'Unable to connect to server. Please check your internet connection.');
    }
  };

  const handleResendOTP = async () => {
    modal.loading('Resending OTP', 'Please wait while we resend the verification code...');
    
    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
            
            {step === 1 && (
              <>
                <h1>Reset Password</h1>
                <p>Enter your email and we'll send you an OTP</p>
              </>
            )}
            {step === 2 && (
              <>
                <h1>Verify OTP</h1>
                <p>Enter the code sent to</p>
                <p className="email-highlight">{email}</p>
              </>
            )}
            {step === 3 && (
              <>
                <h1>New Password</h1>
                <p>Create a new password for your account</p>
              </>
            )}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="auth-form">
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

              <button type="submit" className="btn btn-primary btn-lg auth-submit">
                Send OTP
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
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
                Verify OTP
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

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
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
                    placeholder="Confirm new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit">
                Reset Password
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
