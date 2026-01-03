const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Common base URL
const getBaseUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const getBackendUrl = () => process.env.BACKEND_URL || 'http://localhost:5000';

// Generate unsubscribe footer for marketing emails
const getUnsubscribeFooter = (email) => {
  const baseUrl = getBackendUrl();
  const encodedEmail = encodeURIComponent(email);
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodedEmail}`;
  
  return `
    <tr>
      <td style="padding: 25px 40px; text-align: center; background: #0d0d0d;">
        <p style="margin: 0 0 10px; font-size: 12px; color: #666666;">
          You're receiving this email because you subscribed to AABHAR's newsletter.
        </p>
        <a href="${unsubscribeUrl}" style="color: #888888; font-size: 12px; text-decoration: underline;">
          Unsubscribe from our newsletter
        </a>
      </td>
    </tr>
  `;
};

// Common email header with logo from Cloudinary
const getEmailHeader = () => {
  const emblemUrl = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/alankara-emblem.png';
  
  return `
  <tr>
    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center;">
            <table align="center" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align: middle; padding-right: 8px;">
                  <img src="${emblemUrl}" alt="AABHAR" width="50" style="display: block; width: 50px; height: auto;" />
                </td>
                <td style="vertical-align: middle; padding: 0 10px 8px 10px; color: #d4af37; font-size: 40px; font-weight: 300; line-height: 1;">
                  |
                </td>
                <td style="vertical-align: middle;">
                  <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #d4af37; text-transform: uppercase;">
                    AABHAR
                  </h1>
                </td>
              </tr>
            </table>
            <p style="margin: 10px 0 0; font-size: 11px; letter-spacing: 4px; color: #888888; text-transform: uppercase;">
              Fine Jewelry
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;
};

// Common email footer
const getEmailFooter = () => `
  <tr>
    <td style="padding: 30px 40px; text-align: center; background: #0d0d0d;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center; padding-bottom: 20px;">
            <a href="${getBaseUrl()}" style="color: #888888; font-size: 12px; text-decoration: none; margin: 0 12px;">Shop</a>
            <span style="color: #333;">|</span>
            <a href="${getBaseUrl()}/about" style="color: #888888; font-size: 12px; text-decoration: none; margin: 0 12px;">About</a>
            <span style="color: #333;">|</span>
            <a href="${getBaseUrl()}/contact" style="color: #888888; font-size: 12px; text-decoration: none; margin: 0 12px;">Contact</a>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding-bottom: 20px;">
            <a href="https://instagram.com/Aabhar" style="display: inline-block; margin: 0 8px;">
              <img src="https://img.icons8.com/ios-filled/24/d4af37/instagram-new.png" alt="Instagram" width="24" height="24" style="display: block;" />
            </a>
            <a href="https://facebook.com/Aabhar" style="display: inline-block; margin: 0 8px;">
              <img src="https://img.icons8.com/ios-filled/24/d4af37/facebook-new.png" alt="Facebook" width="24" height="24" style="display: block;" />
            </a>
            <a href="https://twitter.com/Aabhar" style="display: inline-block; margin: 0 8px;">
              <img src="https://img.icons8.com/ios-filled/24/d4af37/twitter.png" alt="Twitter" width="24" height="24" style="display: block;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 5px; font-size: 12px; color: #666666;">
              123 Jewelry Lane, Mumbai, Maharashtra 400001
            </p>
            <p style="margin: 0; font-size: 11px; color: #555555;">
              © ${new Date().getFullYear()} AABHAR. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

// Email base template wrapper
const wrapEmailContent = (content, email = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>AABHAR</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 0; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.3);">
          ${getEmailHeader()}
          ${content}
          ${getEmailFooter()}
          ${email ? getUnsubscribeFooter(email) : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ============================================
// OTP VERIFICATION EMAIL TEMPLATE
// ============================================
const getOTPEmailTemplate = (otp, type) => {
  const isSignup = type === 'signup';
  const title = isSignup ? 'Verify Your Email' : 'Reset Password';
  const subtitle = isSignup 
    ? 'Welcome to AABHAR! Please verify your email to complete your registration.'
    : 'You requested to reset your password. Use the code below.';

  const content = `
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 25px;">
          <tr>
            <td style="width: 70px; height: 70px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
              <span style="font-size: 32px; line-height: 70px;">${isSignup ? '✉️' : '🔐'}</span>
            </td>
          </tr>
        </table>
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 1px;">
          ${title}
        </h2>
        
        <p style="margin: 0 0 35px; font-size: 15px; color: #888888; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
          ${subtitle}
        </p>
        
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #151515 100%); border: 1px solid #333; border-radius: 12px; padding: 30px 40px; margin-bottom: 35px;">
          <p style="margin: 0 0 10px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
            Verification Code
          </p>
          <div style="font-family: 'Courier New', monospace; font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #d4af37;">
            ${otp}
          </div>
        </div>
        
        <p style="margin: 0; font-size: 13px; color: #666666;">
          This code expires in <span style="color: #d4af37; font-weight: 600;">10 minutes</span>
        </p>
        
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #2a2a2a;">
          <p style="margin: 0; font-size: 12px; color: #555555; line-height: 1.6;">
            If you didn't request this code, please ignore this email<br>
            or contact our support team.
          </p>
        </div>
      </td>
    </tr>
  `;

  return wrapEmailContent(content);
};

// ============================================
// WELCOME NEWSLETTER EMAIL TEMPLATE
// ============================================
const getWelcomeNewsletterTemplate = (email) => {
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section with gradient background -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%); position: relative;">
              <!-- Decorative elements -->
              <div style="font-size: 50px; margin-bottom: 25px;">💎</div>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Welcome to
              </p>
              
              <h1 style="margin: 0 0 25px; font-family: 'Georgia', serif; font-size: 36px; font-weight: normal; color: #ffffff; letter-spacing: 2px;">
                Thank You
              </h1>
              
              <p style="margin: 0 0 8px; font-family: 'Georgia', serif; font-size: 20px; color: #d4af37; font-style: italic;">
                for subscribing
              </p>
              
              <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 30px auto;"></div>
              
              <p style="margin: 0; font-size: 15px; color: #888888; line-height: 1.8; max-width: 380px; margin-left: auto; margin-right: auto;">
                You're now part of an exclusive community that appreciates the art of fine jewelry. We're honored to have you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Benefits Section -->
    <tr>
      <td style="padding: 50px 40px; background: #0d0d0d;">
        <h3 style="margin: 0 0 30px; text-align: center; font-family: 'Georgia', serif; font-size: 18px; font-weight: normal; color: #ffffff; letter-spacing: 2px;">
          AS A SUBSCRIBER, YOU'LL RECEIVE
        </h3>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #1a1a1a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" style="color: #d4af37; font-size: 18px;">✦</td>
                  <td style="color: #cccccc; font-size: 14px;">Exclusive member-only discounts</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #1a1a1a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" style="color: #d4af37; font-size: 18px;">✦</td>
                  <td style="color: #cccccc; font-size: 14px;">Early access to new collections</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #1a1a1a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" style="color: #d4af37; font-size: 18px;">✦</td>
                  <td style="color: #cccccc; font-size: 14px;">Jewelry care tips & styling guides</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" style="color: #d4af37; font-size: 18px;">✦</td>
                  <td style="color: #cccccc; font-size: 14px;">Special festive & birthday offers</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- CTA Section -->
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <p style="margin: 0 0 25px; font-size: 14px; color: #888888;">
          Start exploring our exquisite collection
        </p>
        <a href="${getBaseUrl()}/products" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 0;">
          SHOP NOW
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// SPECIAL OFFERS EMAIL TEMPLATE
// ============================================
const getSpecialOffersTemplate = (email, offerData = {}) => {
  const { discount = '20', code = 'SPARKLE20', validUntil = '31st December 2024' } = offerData;
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Banner -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #252525 50%, #1a1a1a 100%);">
              <p style="margin: 0 0 10px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 4px;">
                Exclusive Offer
              </p>
              
              <h1 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 72px; font-weight: normal; color: #d4af37; line-height: 1;">
                ${discount}%
              </h1>
              
              <p style="margin: 0 0 30px; font-family: 'Georgia', serif; font-size: 24px; color: #ffffff; letter-spacing: 4px; text-transform: uppercase;">
                OFF
              </p>
              
              <p style="margin: 0; font-size: 15px; color: #888888; line-height: 1.6;">
                On all jewelry collections for a limited time
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Coupon Code Section -->
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: #0d0d0d;">
        <p style="margin: 0 0 15px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
          Use Code at Checkout
        </p>
        
        <div style="display: inline-block; padding: 20px 50px; border: 2px dashed #d4af37; background: #1a1a1a; margin-bottom: 25px;">
          <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #d4af37;">
            ${code}
          </span>
        </div>
        
        <p style="margin: 0; font-size: 13px; color: #666666;">
          Valid until <span style="color: #d4af37;">${validUntil}</span>
        </p>
      </td>
    </tr>
    
    <!-- Featured Categories -->
    <tr>
      <td style="padding: 40px;">
        <h3 style="margin: 0 0 25px; text-align: center; font-family: 'Georgia', serif; font-size: 16px; font-weight: normal; color: #888888; letter-spacing: 3px; text-transform: uppercase;">
          Shop by Category
        </h3>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="48%" style="padding: 20px; background: #1a1a1a; text-align: center; vertical-align: middle;">
              <span style="font-size: 36px; display: block; margin-bottom: 10px;">💍</span>
              <span style="color: #d4af37; font-size: 13px; letter-spacing: 2px;">RINGS</span>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 20px; background: #1a1a1a; text-align: center; vertical-align: middle;">
              <span style="font-size: 36px; display: block; margin-bottom: 10px;">📿</span>
              <span style="color: #d4af37; font-size: 13px; letter-spacing: 2px;">NECKLACES</span>
            </td>
          </tr>
          <tr><td colspan="3" style="height: 15px;"></td></tr>
          <tr>
            <td width="48%" style="padding: 20px; background: #1a1a1a; text-align: center; vertical-align: middle;">
              <span style="font-size: 36px; display: block; margin-bottom: 10px;">✨</span>
              <span style="color: #d4af37; font-size: 13px; letter-spacing: 2px;">EARRINGS</span>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 20px; background: #1a1a1a; text-align: center; vertical-align: middle;">
              <span style="font-size: 36px; display: block; margin-bottom: 10px;">⭕</span>
              <span style="color: #d4af37; font-size: 13px; letter-spacing: 2px;">BANGLES</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 30px 40px 50px; text-align: center; background: #0d0d0d;">
        <a href="${getBaseUrl()}/products" style="display: inline-block; padding: 18px 55px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">
          SHOP NOW
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// FESTIVE GREETINGS EMAIL TEMPLATE
// ============================================
const getFestiveEmailTemplate = (email, festivalData = {}) => {
  const { festival = 'Festive Season', greeting = 'Wishing you joy, prosperity, and sparkle!' } = festivalData;
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #2d1810 0%, #1a1a1a 50%, #2d1810 100%);">
              <div style="font-size: 60px; margin-bottom: 20px;">🪔✨🎊</div>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Warm Wishes
              </p>
              
              <h1 style="margin: 0 0 25px; font-family: 'Georgia', serif; font-size: 38px; font-weight: normal; color: #ffffff; letter-spacing: 2px;">
                Happy ${festival}!
              </h1>
              
              <div style="width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 0 auto 25px;"></div>
              
              <p style="margin: 0; font-family: 'Georgia', serif; font-size: 18px; color: #cccccc; font-style: italic; line-height: 1.7; max-width: 400px; margin-left: auto; margin-right: auto;">
                "${greeting}"
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Message Section -->
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: #0d0d0d;">
        <p style="margin: 0 0 30px; font-size: 15px; color: #888888; line-height: 1.8; max-width: 420px; margin-left: auto; margin-right: auto;">
          May this auspicious occasion bring you happiness, prosperity, and beautiful moments with your loved ones.
        </p>
        
        <!-- Festive Offer Box -->
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #151515 100%); border: 1px solid #333; padding: 35px; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
            Festive Special
          </p>
          <p style="margin: 0 0 10px; font-family: 'Georgia', serif; font-size: 32px; color: #d4af37;">
            15% OFF
          </p>
          <p style="margin: 0; font-size: 13px; color: #666666;">
            On our festive collection
          </p>
        </div>
      </td>
    </tr>
    
    <!-- CTA Section -->
    <tr>
      <td style="padding: 0 40px 50px; text-align: center; background: #0d0d0d;">
        <a href="${getBaseUrl()}/products?collection=festive" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          EXPLORE FESTIVE COLLECTION
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// NEW ARRIVALS EMAIL TEMPLATE
// ============================================
const getNewArrivalsTemplate = (email, products = []) => {
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #252525 50%, #1a1a1a 100%);">
              <p style="margin: 0 0 15px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Just Arrived
              </p>
              
              <h1 style="margin: 0 0 25px; font-family: 'Georgia', serif; font-size: 36px; font-weight: normal; color: #ffffff; letter-spacing: 3px;">
                NEW COLLECTION
              </h1>
              
              <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 0 auto 25px;"></div>
              
              <p style="margin: 0; font-size: 15px; color: #888888; line-height: 1.6; max-width: 380px; margin-left: auto; margin-right: auto;">
                Be the first to discover our latest exquisite pieces, handcrafted with love and precision.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Featured Products -->
    <tr>
      <td style="padding: 50px 40px; background: #0d0d0d;">
        <h3 style="margin: 0 0 30px; text-align: center; font-family: 'Georgia', serif; font-size: 16px; font-weight: normal; color: #888888; letter-spacing: 3px; text-transform: uppercase;">
          Featured Pieces
        </h3>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="48%" style="padding: 25px; background: #1a1a1a; text-align: center; vertical-align: top;">
              <div style="font-size: 48px; margin-bottom: 15px;">💍</div>
              <h4 style="margin: 0 0 8px; font-family: 'Georgia', serif; font-size: 16px; font-weight: normal; color: #ffffff;">
                Diamond Solitaire
              </h4>
              <p style="margin: 0 0 10px; font-size: 13px; color: #888888;">
                Classic elegance
              </p>
              <p style="margin: 0; font-size: 16px; color: #d4af37; font-weight: 600;">
                ₹85,000
              </p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 25px; background: #1a1a1a; text-align: center; vertical-align: top;">
              <div style="font-size: 48px; margin-bottom: 15px;">📿</div>
              <h4 style="margin: 0 0 8px; font-family: 'Georgia', serif; font-size: 16px; font-weight: normal; color: #ffffff;">
                Gold Necklace
              </h4>
              <p style="margin: 0 0 10px; font-size: 13px; color: #888888;">
                Timeless beauty
              </p>
              <p style="margin: 0; font-size: 16px; color: #d4af37; font-weight: 600;">
                ₹1,25,000
              </p>
            </td>
          </tr>
        </table>
        
        <p style="margin: 30px 0 0; text-align: center; font-size: 13px; color: #666666;">
          Limited pieces available • Shop before they're gone
        </p>
      </td>
    </tr>
    
    <!-- CTA Section -->
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <a href="${getBaseUrl()}/products?sort=newest" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          VIEW ALL NEW ARRIVALS
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// ORDER CONFIRMATION EMAIL TEMPLATE
// ============================================
const getOrderConfirmationTemplate = (orderData) => {
  const { orderId = 'ORD-12345', customerName = 'Customer', items = [], total = '0', address = '' } = orderData;
  
  const content = `
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: #1a1a1a;">
        <div style="width: 70px; height: 70px; margin: 0 auto 25px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px; line-height: 70px;">✓</span>
        </div>
        
        <h1 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 28px; font-weight: normal; color: #ffffff;">
          Order Confirmed!
        </h1>
        
        <p style="margin: 0 0 25px; font-size: 15px; color: #888888;">
          Thank you for your order, ${customerName}
        </p>
        
        <div style="background: #151515; border: 1px solid #2a2a2a; padding: 20px; margin-bottom: 30px;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
            Order Number
          </p>
          <p style="margin: 0; font-size: 20px; color: #d4af37; font-weight: 600; letter-spacing: 2px;">
            ${orderId}
          </p>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 40px 50px; background: #0d0d0d;">
        <p style="margin: 0 0 30px; text-align: center; font-size: 13px; color: #666666;">
          You'll receive another email when your order ships.
        </p>
        
        <a href="${getBaseUrl()}/orders/${orderId}" style="display: block; width: 100%; padding: 16px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-align: center; box-sizing: border-box;">
          VIEW ORDER DETAILS
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content);
};

// ============================================
// ADMIN PROMOTION EMAIL TEMPLATE
// ============================================
const getAdminPromotionTemplate = (userData) => {
  const { name = 'User', email, roleName = '' } = userData;
  const adminDashboardUrl = `${getBaseUrl()}/admin`;
  // Format role name nicely (capitalize first letter of each word)
  const formatRoleName = (rn) => {
    if (!rn) return '';
    return rn.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };
  const displayRoleName = formatRoleName(roleName);
  
  const content = `
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 25px;">
          <tr>
            <td style="width: 80px; height: 80px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
              <span style="font-size: 36px; line-height: 80px;">🛡️</span>
            </td>
          </tr>
        </table>
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 1px;">
          Congratulations, ${name}!
        </h2>
        
        <p style="margin: 0 0 10px; font-family: 'Georgia', serif; font-size: 20px; color: #d4af37; font-style: italic;">
          You've Been Promoted to Admin${displayRoleName ? ` (${displayRoleName})` : ''}
        </p>
        
        <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 25px auto;"></div>
        
        <p style="margin: 0 0 35px; font-size: 15px; color: #888888; line-height: 1.8; max-width: 420px; margin-left: auto; margin-right: auto;">
          You have been granted administrative privileges for AABHAR. As an admin, you now have full access to manage the store, products, orders, and customers.
        </p>
        
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #151515 100%); border: 1px solid #333; border-radius: 12px; padding: 30px 40px; margin-bottom: 35px; text-align: left;">
          <p style="margin: 0 0 20px; font-size: 14px; color: #d4af37; font-weight: 600; letter-spacing: 1px;">
            YOUR NEW CAPABILITIES:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">
                <span style="color: #d4af37; margin-right: 10px;">✦</span> Manage products and inventory
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">
                <span style="color: #d4af37; margin-right: 10px;">✦</span> View and process customer orders
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">
                <span style="color: #d4af37; margin-right: 10px;">✦</span> Access sales reports and analytics
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">
                <span style="color: #d4af37; margin-right: 10px;">✦</span> Manage customer accounts
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">
                <span style="color: #d4af37; margin-right: 10px;">✦</span> Create and manage discount coupons
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px; text-align: center; background: #0d0d0d;">
        <a href="${adminDashboardUrl}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          ACCESS ADMIN DASHBOARD
        </a>
        
        <div style="margin-top: 35px; padding-top: 30px; border-top: 1px solid #2a2a2a;">
          <p style="margin: 0; font-size: 12px; color: #555555; line-height: 1.6;">
            This email confirms your new admin status.<br>
            If you believe this was sent in error, please contact support.
          </p>
        </div>
      </td>
    </tr>
  `;

  return wrapEmailContent(content);
};

// Send admin promotion email
const sendAdminPromotionEmail = async (email, userData) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: '🛡️ You\'ve Been Promoted to Admin - AABHAR',
      html: getAdminPromotionTemplate(userData)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Admin promotion email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending admin promotion email:', error);
    throw error;
  }
};

// ============================================
// SEND EMAIL FUNCTIONS
// ============================================

// Send OTP email
const sendOTPEmail = async (email, otp, type) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const subject = type === 'signup' 
      ? 'Verify Your Email - AABHAR' 
      : 'Reset Your Password - AABHAR';
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: subject,
      html: getOTPEmailTemplate(otp, type)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send marketing email
const sendMarketingEmail = async (email, type, data = {}) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    let subject, html;
    
    switch (type) {
      case 'newsletter':
        subject = 'Welcome to AABHAR Newsletter! 💎';
        html = getWelcomeNewsletterTemplate(email);
        break;
      case 'offers':
        subject = `🎁 Special Offer: ${data.discount || '20'}% OFF at AABHAR!`;
        html = getSpecialOffersTemplate(email, data);
        break;
      case 'festive':
        subject = `🪔 ${data.festival || 'Festive'} Greetings from AABHAR!`;
        html = getFestiveEmailTemplate(email, data);
        break;
      case 'others':
      case 'arrivals':
        subject = '✨ New Arrivals at AABHAR - Be the First!';
        html = getNewArrivalsTemplate(email, data.products);
        break;
      case 'order':
        subject = `Order Confirmed - ${data.orderId} | AABHAR`;
        html = getOrderConfirmationTemplate(data);
        break;
      default:
        throw new Error('Invalid email type');
    }
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: subject,
      html: html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`${type} email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending marketing email:', error);
    throw error;
  }
};

// Send test emails to a specific address
const sendTestEmails = async (testEmail) => {
  const results = {};
  
  try {
    // Send welcome newsletter
    await sendMarketingEmail(testEmail, 'newsletter');
    results.newsletter = true;
    console.log('newsletter email sent to ' + testEmail);
    
    // Send special offers
    await sendMarketingEmail(testEmail, 'offers', { discount: '25', code: 'TEST25' });
    results.offers = true;
    console.log('offers email sent to ' + testEmail);
    
    // Send festive greetings
    await sendMarketingEmail(testEmail, 'festive', { festival: 'Diwali', greeting: 'May your life sparkle like diamonds!' });
    results.festive = true;
    console.log('festive email sent to ' + testEmail);
    
    // Send new arrivals
    await sendMarketingEmail(testEmail, 'arrivals', {});
    results.arrivals = true;
    console.log('arrivals email sent to ' + testEmail);
    
    console.log('All test emails sent successfully!');
    return results;
  } catch (error) {
    console.error('Error sending test emails:', error);
    throw error;
  }
};

// ============================================
// EMAIL PREVIEW TEMPLATES (for browser viewing)
// ============================================
const getEmailPreviewHTML = () => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AABHAR Email Templates Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    h1 { text-align: center; font-size: 32px; color: #d4af37; margin-bottom: 10px; letter-spacing: 4px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 50px; }
    .templates-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .template-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 25px; text-align: center; transition: all 0.3s; }
    .template-card:hover { border-color: #d4af37; transform: translateY(-5px); }
    .template-icon { font-size: 40px; margin-bottom: 15px; }
    .template-title { font-size: 18px; margin-bottom: 10px; color: #fff; }
    .template-desc { font-size: 13px; color: #888; margin-bottom: 20px; }
    .template-btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #d4af37, #b7953f); color: #000; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 1px; }
    .template-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AABHAR</h1>
    <p class="subtitle">Email Templates Preview</p>
    
    <div class="templates-grid">
      <div class="template-card">
        <div class="template-icon">📧</div>
        <h3 class="template-title">OTP Verification</h3>
        <p class="template-desc">Email verification and password reset</p>
        <a href="/api/email/preview/otp" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">💎</div>
        <h3 class="template-title">Welcome Newsletter</h3>
        <p class="template-desc">Thank you for subscribing email</p>
        <a href="/api/email/preview/newsletter" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🎁</div>
        <h3 class="template-title">Special Offers</h3>
        <p class="template-desc">Discount and promo code emails</p>
        <a href="/api/email/preview/offers" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🪔</div>
        <h3 class="template-title">Festive Greetings</h3>
        <p class="template-desc">Festival wishes and special offers</p>
        <a href="/api/email/preview/festive" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">✨</div>
        <h3 class="template-title">New Arrivals</h3>
        <p class="template-desc">Latest collection announcements</p>
        <a href="/api/email/preview/arrivals" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">✓</div>
        <h3 class="template-title">Order Confirmation</h3>
        <p class="template-desc">Order success notification</p>
        <a href="/api/email/preview/order" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🛡️</div>
        <h3 class="template-title">Admin Promotion</h3>
        <p class="template-desc">Promoted to admin notification</p>
        <a href="/api/email/preview/admin-promotion" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🔔</div>
        <h3 class="template-title">Back In Stock</h3>
        <p class="template-desc">Stock alert notification</p>
        <a href="/api/email/preview/back-in-stock" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">📉</div>
        <h3 class="template-title">Price Drop</h3>
        <p class="template-desc">Price drop alert notification</p>
        <a href="/api/email/preview/price-drop" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">📦</div>
        <h3 class="template-title">Bulk Order - Customer</h3>
        <p class="template-desc">Customer inquiry confirmation</p>
        <a href="/api/email/preview/bulk-order-customer" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🔔</div>
        <h3 class="template-title">Bulk Order - Admin</h3>
        <p class="template-desc">Admin new inquiry notification</p>
        <a href="/api/email/preview/bulk-order-admin" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">🎂</div>
        <h3 class="template-title">Birthday Email</h3>
        <p class="template-desc">Birthday wishes with 15% discount</p>
        <a href="/api/email/preview/birthday" class="template-btn" target="_blank">PREVIEW</a>
      </div>
      
      <div class="template-card">
        <div class="template-icon">💍</div>
        <h3 class="template-title">Anniversary Email</h3>
        <p class="template-desc">Anniversary wishes with 10% discount</p>
        <a href="/api/email/preview/anniversary" class="template-btn" target="_blank">PREVIEW</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================
// BACK IN STOCK ALERT EMAIL TEMPLATE
// ============================================
const getBackInStockTemplate = (email, productData) => {
  const { 
    productName = 'Your favorite product', 
    productImage = '', 
    productPrice = '₹0',
    productId = 1
  } = productData;
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 50px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #252525 50%, #1a1a1a 100%);">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 25px;">
                <tr>
                  <td style="width: 70px; height: 70px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 32px; line-height: 70px;">🔔</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #22c55e; text-transform: uppercase; letter-spacing: 4px;">
                Good News!
              </p>
              
              <h1 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 32px; font-weight: normal; color: #ffffff; letter-spacing: 2px;">
                Back In Stock
              </h1>
              
              <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 0 auto 25px;"></div>
              
              <p style="margin: 0; font-size: 15px; color: #888888; line-height: 1.6;">
                The item you've been waiting for is now available!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Product Section -->
    <tr>
      <td style="padding: 40px; background: #0d0d0d; text-align: center;">
        ${productImage ? `<img src="${productImage}" alt="${productName}" style="width: 200px; height: 200px; object-fit: cover; border: 2px solid #333; margin-bottom: 20px;">` : ''}
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 20px; font-weight: normal; color: #ffffff;">
          ${productName}
        </h2>
        
        <p style="margin: 0 0 25px; font-size: 24px; color: #d4af37; font-weight: 600;">
          ${productPrice}
        </p>
        
        <a href="${getBaseUrl()}/products/${productId}" style="display: inline-block; padding: 16px 50px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          SHOP NOW
        </a>
        
        <p style="margin: 25px 0 0; font-size: 12px; color: #666666;">
          Limited stock available. Don't miss out!
        </p>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// PRICE DROP ALERT EMAIL TEMPLATE
// ============================================
const getPriceDropTemplate = (email, productData) => {
  const { 
    productName = 'Your favorite product', 
    productImage = '', 
    originalPrice = '₹0',
    newPrice = '₹0',
    discountPercent = 0,
    productId = 1
  } = productData;
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 50px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #252525 50%, #1a1a1a 100%);">
              <div style="font-size: 50px; margin-bottom: 20px;">📉</div>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Price Alert
              </p>
              
              <h1 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 32px; font-weight: normal; color: #ffffff; letter-spacing: 2px;">
                Price Drop!
              </h1>
              
              <div style="display: inline-block; padding: 10px 25px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 50px;">
                <span style="font-size: 20px; color: #ef4444; font-weight: 600;">
                  ${discountPercent}% OFF
                </span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Product Section -->
    <tr>
      <td style="padding: 40px; background: #0d0d0d; text-align: center;">
        ${productImage ? `<img src="${productImage}" alt="${productName}" style="width: 200px; height: 200px; object-fit: cover; border: 2px solid #333; margin-bottom: 20px;">` : ''}
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 20px; font-weight: normal; color: #ffffff;">
          ${productName}
        </h2>
        
        <div style="margin-bottom: 25px;">
          <span style="font-size: 16px; color: #666666; text-decoration: line-through; margin-right: 15px;">
            ${originalPrice}
          </span>
          <span style="font-size: 28px; color: #d4af37; font-weight: 600;">
            ${newPrice}
          </span>
        </div>
        
        <a href="${getBaseUrl()}/products/${productId}" style="display: inline-block; padding: 16px 50px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          GRAB THE DEAL
        </a>
        
        <p style="margin: 25px 0 0; font-size: 12px; color: #666666;">
          Hurry! Price may change anytime.
        </p>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// Send back in stock email
const sendBackInStockEmail = async (email, productData) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `🔔 Back In Stock: ${productData.productName} - AABHAR`,
      html: getBackInStockTemplate(email, productData)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Back in stock email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending back in stock email:', error);
    throw error;
  }
};

// Send price drop email
const sendPriceDropEmail = async (email, productData) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `📉 Price Drop: ${productData.discountPercent}% OFF on ${productData.productName}!`,
      html: getPriceDropTemplate(email, productData)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Price drop email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending price drop email:', error);
    throw error;
  }
};

// ============================================
// BULK ORDER EMAIL TEMPLATES
// ============================================

// Customer confirmation email for bulk order inquiry
const getBulkOrderCustomerConfirmationTemplate = (data) => {
  const { name, category, quantity, budget_range, inquiryId } = data;
  const storePhone = '+91 9876543210';
  
  const content = `
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <table border="0" cellpadding="0" cellspacing="0" width="70" height="70" style="margin: 0 auto 25px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%;">
          <tr>
            <td align="center" valign="middle" style="color: #ffffff; font-size: 32px; font-weight: bold;">✓</td>
          </tr>
        </table>
        
        <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
          Inquiry Received
        </p>
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 1px;">
          Thank You, ${name}!
        </h2>
        
        <p style="margin: 0 0 35px; font-size: 15px; color: #888888; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
          We've received your bulk order inquiry. Our team will contact you within 24-48 hours with pricing and availability.
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px; background: #0d0d0d;">
        <p style="margin: 0 0 25px; text-align: center; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
          Your Inquiry Summary
        </p>
        
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #151515 100%); border: 1px solid #333; border-radius: 12px; padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${category ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Category</p>
                <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 600;">${category}</p>
              </td>
            </tr>
            ` : ''}
            ${quantity ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Quantity</p>
                <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 600;">${quantity} pieces</p>
              </td>
            </tr>
            ` : ''}
            ${budget_range ? `
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Budget Range</p>
                <p style="margin: 0; font-size: 16px; color: #d4af37; font-weight: 600;">${budget_range}</p>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="margin: 30px 0 0; text-align: center; font-size: 13px; color: #666666;">
          Meanwhile, feel free to browse our collection or call us at<br>
          <a href="tel:${storePhone}" style="color: #d4af37; text-decoration: none; font-weight: 600;">${storePhone}</a>
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <a href="${getBaseUrl()}/products" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          BROWSE COLLECTION
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content);
};

// Admin notification email for bulk order inquiry
const getBulkOrderAdminNotificationTemplate = (data) => {
  const { customerName, customerEmail, customerPhone, companyName, category, quantity, budgetRange, message, inquiryId } = data;
  const adminPanelUrl = `${getBaseUrl()}/admin/bulk-orders`;
  
  const content = `
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <table border="0" cellpadding="0" cellspacing="0" width="70" height="70" style="margin: 0 auto 25px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); border-radius: 50%;">
          <tr>
            <td align="center" valign="middle" style="color: #ffffff; font-size: 32px;">📦</td>
          </tr>
        </table>
        
        <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
          New Inquiry
        </p>
        
        <h2 style="margin: 0 0 15px; font-family: 'Georgia', serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 1px;">
          Bulk Order Inquiry
        </h2>
        
        <p style="margin: 0; font-size: 15px; color: #888888;">
          A new bulk order inquiry has been submitted
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px; background: #0d0d0d;">
        <p style="margin: 0 0 25px; text-align: center; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
          Inquiry Details
        </p>
        
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #151515 100%); border: 1px solid #333; border-radius: 12px; padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" style="padding: 10px 10px 10px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Name</p>
                <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: 600;">${customerName}</p>
              </td>
              <td width="50%" style="padding: 10px 0 10px 10px; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                <p style="margin: 0; font-size: 14px; color: #d4af37;">${customerEmail}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding: 10px 10px 10px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Phone</p>
                <p style="margin: 0; font-size: 14px; color: #ffffff;">${customerPhone || 'Not provided'}</p>
              </td>
              <td width="50%" style="padding: 10px 0 10px 10px; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Company</p>
                <p style="margin: 0; font-size: 14px; color: #ffffff;">${companyName || 'Not specified'}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding: 10px 10px 10px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Category</p>
                <p style="margin: 0; font-size: 14px; color: #ffffff;">${category || 'Not specified'}</p>
              </td>
              <td width="50%" style="padding: 10px 0 10px 10px; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Quantity</p>
                <p style="margin: 0; font-size: 14px; color: #d4af37; font-weight: 600;">${quantity || 'Not specified'}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 0; border-bottom: 1px solid #2a2a2a;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Budget Range</p>
                <p style="margin: 0; font-size: 16px; color: #d4af37; font-weight: 600;">${budgetRange || 'Not specified'}</p>
              </td>
            </tr>
            ${message ? `
            <tr>
              <td colspan="2" style="padding: 10px 0;">
                <p style="margin: 0 0 5px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Requirements</p>
                <p style="margin: 0; font-size: 14px; color: #cccccc; line-height: 1.6;">${message}</p>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);">
        <a href="${adminPanelUrl}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
          VIEW IN ADMIN PANEL
        </a>
      </td>
    </tr>
  `;

  return wrapEmailContent(content);
};

// Send bulk order customer confirmation email
const sendBulkOrderCustomerConfirmation = async (data) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: data.email,
      subject: '✓ Bulk Order Inquiry Received - AABHAR',
      html: getBulkOrderCustomerConfirmationTemplate(data)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Bulk order confirmation email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error('Error sending bulk order confirmation email:', error);
    throw error;
  }
};

// Send bulk order admin notification email
const sendBulkOrderAdminNotification = async (data) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: data.adminEmail,
      subject: `📦 New Bulk Order Inquiry from ${data.customerName} - AABHAR`,
      html: getBulkOrderAdminNotificationTemplate(data)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Bulk order admin notification sent to ${data.adminEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending bulk order admin notification:', error);
    throw error;
  }
};

// ============================================
// BIRTHDAY EMAIL TEMPLATE
// ============================================
const getBirthdayEmailTemplate = (email, data = {}) => {
  const { 
    name = 'Valued Customer', 
    couponCode = 'BDAY15', 
    discount = 15,
    minOrder = 1000,
    validDays = 7 
  } = data;
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const validUntilStr = validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section with Cake -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d1f3d 50%, #1a1a1a 100%);">
              <div style="font-size: 80px; margin-bottom: 20px;">🎂</div>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Happy Birthday
              </p>
              
              <h1 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 36px; font-weight: normal; color: #ffffff; line-height: 1.2;">
                ${name}!
              </h1>
              
              <p style="margin: 0; font-size: 16px; color: #cccccc; line-height: 1.6; max-width: 400px; margin: 0 auto;">
                Wishing you a day filled with joy, love, and of course, beautiful jewelry! 🎉
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Special Gift Section -->
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: #0d0d0d;">
        <p style="margin: 0 0 10px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
          Your Birthday Gift
        </p>
        
        <h2 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 56px; font-weight: normal; color: #d4af37; line-height: 1;">
          ${discount}% OFF
        </h2>
        
        <p style="margin: 0 0 30px; font-size: 14px; color: #888888;">
          On your next purchase · Min. order ₹${minOrder.toLocaleString()}
        </p>
        
        <!-- Coupon Code Box -->
        <table align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 20px 50px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%); border: 2px dashed #d4af37; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
                Use Code
              </p>
              <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 4px;">
                ${couponCode}
              </p>
            </td>
          </tr>
        </table>
        
        <p style="margin: 25px 0 0; font-size: 13px; color: #666666;">
          Valid until ${validUntilStr}
        </p>
      </td>
    </tr>
    
    <!-- CTA Section -->
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%);">
        <a href="${getBaseUrl()}/products" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 0;">
          SHOP NOW
        </a>
        <p style="margin: 20px 0 0; font-size: 12px; color: #666666;">
          Treat yourself to something special ✨
        </p>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// ============================================
// ANNIVERSARY EMAIL TEMPLATE
// ============================================
const getAnniversaryEmailTemplate = (email, data = {}) => {
  const { 
    name = 'Valued Customer', 
    couponCode = 'ANNIV10', 
    discount = 10,
    minOrder = 1000,
    validDays = 7 
  } = data;
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const validUntilStr = validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Hero Section with Rings -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #3d1f2d 50%, #1a1a1a 100%);">
              <div style="font-size: 80px; margin-bottom: 20px;">💍</div>
              
              <p style="margin: 0 0 10px; font-size: 12px; color: #d4af37; text-transform: uppercase; letter-spacing: 4px;">
                Happy Anniversary
              </p>
              
              <h1 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 36px; font-weight: normal; color: #ffffff; line-height: 1.2;">
                ${name}!
              </h1>
              
              <p style="margin: 0; font-size: 16px; color: #cccccc; line-height: 1.6; max-width: 400px; margin: 0 auto;">
                Celebrating another year of love and togetherness. Here's a little something from us! 💕
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Special Gift Section -->
    <tr>
      <td style="padding: 50px 40px; text-align: center; background: #0d0d0d;">
        <p style="margin: 0 0 10px; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
          Anniversary Gift
        </p>
        
        <h2 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 56px; font-weight: normal; color: #d4af37; line-height: 1;">
          ${discount}% OFF
        </h2>
        
        <p style="margin: 0 0 30px; font-size: 14px; color: #888888;">
          On your next purchase · Min. order ₹${minOrder.toLocaleString()}
        </p>
        
        <!-- Coupon Code Box -->
        <table align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 20px 50px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%); border: 2px dashed #d4af37; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
                Use Code
              </p>
              <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 4px;">
                ${couponCode}
              </p>
            </td>
          </tr>
        </table>
        
        <p style="margin: 25px 0 0; font-size: 13px; color: #666666;">
          Valid until ${validUntilStr}
        </p>
      </td>
    </tr>
    
    <!-- CTA Section -->
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%);">
        <a href="${getBaseUrl()}/products" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #d4af37 0%, #b7953f 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 0;">
          SHOP NOW
        </a>
        <p style="margin: 20px 0 0; font-size: 12px; color: #666666;">
          Make this celebration extra special ✨
        </p>
      </td>
    </tr>
  `;

  return wrapEmailContent(content, email);
};

// Send birthday email
const sendBirthdayEmail = async (email, data) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `🎂 Happy Birthday ${data.name}! Here's a Special Gift - AABHAR`,
      html: getBirthdayEmailTemplate(email, data)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Birthday email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending birthday email:', error);
    throw error;
  }
};

// Send anniversary email
const sendAnniversaryEmail = async (email, data) => {
  try {
    const transporter = createTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'AABHAR';
    const fromEmail = process.env.SMTP_EMAIL;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `💍 Happy Anniversary ${data.name}! A Gift for You - AABHAR`,
      html: getAnniversaryEmailTemplate(email, data)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Anniversary email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending anniversary email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendMarketingEmail,
  sendTestEmails,
  sendAdminPromotionEmail,
  // Preview functions
  getEmailPreviewHTML,
  getOTPEmailTemplate,
  getWelcomeNewsletterTemplate,
  getSpecialOffersTemplate,
  getFestiveEmailTemplate,
  getNewArrivalsTemplate,
  getOrderConfirmationTemplate,
  getAdminPromotionTemplate,
  // Alert email functions
  sendBackInStockEmail,
  sendPriceDropEmail,
  getBackInStockTemplate,
  getPriceDropTemplate,
  wrapEmailContent,
  getBaseUrl,
  // Bulk order email functions
  sendBulkOrderCustomerConfirmation,
  sendBulkOrderAdminNotification,
  getBulkOrderCustomerConfirmationTemplate,
  getBulkOrderAdminNotificationTemplate,
  // Birthday/Anniversary email functions
  sendBirthdayEmail,
  sendAnniversaryEmail,
  getBirthdayEmailTemplate,
  getAnniversaryEmailTemplate
};

