import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Chatbot from './Chatbot'; // Import the Chatbot
import SEO from './SEO'; // Import the SEO component
// import Analytics from './Analytics'; // Temporarily disabled for build // Import the Analytics component

const Layout = ({ children }) => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(Date.now()); // Key to force re-mount for reset
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => setIsChatOpen(false); // This now just hides the chat
  
  const handleResetAndClose = () => {
    // This function will now fully reset the chatbot by changing its key,
    // which forces React to create a new instance.
    setChatKey(Date.now());
    // We can also close it, or leave it open to show the reset. Let's close it.
    setIsChatOpen(false);
  };
  
  // Pass a function to children to allow them to open the chat
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const openChatFunction = () => {
        console.log('openChat function called from Layout');
        setIsChatOpen(true);
      };
      return React.cloneElement(child, { openChat: openChatFunction });
    }
    return child;
  });

  return (
    <>
      <Head>
        <title>Heat.nz - Connect with Qualified Tradesmen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        
        {/* Preload critical fonts - Modern sans serif for headings, clean body text */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" /></noscript>
        <style jsx global>{`
          /* Mobile chatbot positioning fixes */
          @media (max-width: 768px) {
            .chatbot-container {
              width: calc(100vw - 40px) !important;
              height: calc(100vh - 40px) !important;
              bottom: 20px !important;
              right: 20px !important;
              left: 20px !important;
              max-width: calc(100vw - 40px) !important;
              max-height: calc(100vh - 40px) !important;
            }
          }
          
          @media (max-width: 480px) {
            .chatbot-container {
              width: calc(100vw - 20px) !important;
              height: calc(100vh - 20px) !important;
              bottom: 10px !important;
              right: 10px !important;
              left: 10px !important;
              max-width: calc(100vw - 20px) !important;
              max-height: calc(100vh - 20px) !important;
            }
          }
          
          /* Ensure chatbot doesn't overflow on very small screens */
          @media (max-width: 360px) {
            .chatbot-container {
              width: calc(100vw - 10px) !important;
              height: calc(100vh - 10px) !important;
              bottom: 5px !important;
              right: 5px !important;
              left: 5px !important;
              max-width: calc(100vw - 10px) !important;
              max-height: calc(100vh - 10px) !important;
            }
          }
          
          /* Additional mobile fixes for content overflow */
          @media (max-width: 480px) {
            .chatbot-container * {
              box-sizing: border-box !important;
            }
            
            .chatbot-container .chatbot-messages {
              padding: 10px !important;
            }
            
            .chatbot-container .chatbot-input {
              padding: 10px !important;
            }
            
            .chatbot-container .progress-bar-container {
              margin-top: 5px !important;
            }
          }
        `}</style>
      </Head>
      
      {/* Default SEO for all pages - can be overridden by individual pages */}
      <SEO
        title="Heat NZ | Underfloor Heating Auckland — Free Quote"
        description="Underfloor heating specialists in Auckland. Supply, install & service electric and hydronic systems. Fast quotes & warranties."
        canonical={`https://heat.nz${router.asPath}`}
      />
      
      {/* Analytics tracking */}
        {/* <Analytics /> */}
      
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>🔥</div>
            <Link href="/" style={styles.logoLink}>
              <span style={styles.logoText}>Heat</span>
              <span style={styles.logoAccent}>.nz</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={styles.navMenu}>
              <Link href="/" style={router.pathname === '/' ? styles.activeLink : styles.navLink}>Home</Link>
              <Link href="/about" style={router.pathname === '/about' ? styles.activeLink : styles.navLink}>About</Link>
              <Link href="/faq" style={router.pathname === '/faq' ? styles.activeLink : styles.navLink}>FAQ</Link>
              <Link href="/contact" style={router.pathname === '/contact' ? styles.activeLink : styles.navLink}>Contact</Link>
            <button 
              onClick={() => {
                const openChat = document.querySelector('[data-chat-bubble]');
                if (openChat) openChat.click();
              }}
              style={styles.ctaButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255,107,53,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255,107,53,0.3)';
              }}
            >
              Get Free Quote
            </button>
              <Link href="/tradesman-login" style={styles.loginBtn}>Tradesman Login</Link>
            </div>
          )}
          
          {/* Mobile Hamburger Button */}
          {isMobile && (
            <button 
              style={styles.hamburger}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <span style={{...styles.hamburgerLine, transform: isMobileMenuOpen ? 'rotate(45deg) translateY(8px)' : 'none'}}></span>
              <span style={{...styles.hamburgerLine, opacity: isMobileMenuOpen ? 0 : 1}}></span>
              <span style={{...styles.hamburgerLine, transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'}}></span>
            </button>
          )}
        </nav>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <Link href="/" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/about" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link href="/faq" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
            <Link href="/contact" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                const openChat = document.querySelector('[data-chat-bubble]');
                if (openChat) openChat.click();
              }}
              style={styles.mobileCtaButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255,107,53,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255,107,53,0.3)';
              }}
            >
              Get Free Quote
            </button>
            <Link href="/tradesman-login" style={styles.mobileLoginBtn} onClick={() => setIsMobileMenuOpen(false)}>Tradesman Login</Link>
          </div>
        )}
      </header>
      <main style={styles.main}>
        {childrenWithProps}
      </main>
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Heat.nz</h3>
            <p style={styles.footerText}>Auckland's leading underfloor heating specialists. Expert installation, quality products, trusted service.</p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerSubHeading}>Quick Links</h4>
            <Link href="/" style={styles.footerLink}>Home</Link>
            <Link href="/about" style={styles.footerLink}>About</Link>
            <Link href="/faq" style={styles.footerLink}>FAQ</Link>
            <Link href="/contact" style={styles.footerLink}>Contact</Link>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerSubHeading}>Services</h4>
            <Link href="/services/underfloor-heating" style={styles.footerLink}>Electric Heating</Link>
            <Link href="/services/underfloor-heating" style={styles.footerLink}>Hydronic Heating</Link>
            <Link href="/contact" style={styles.footerLink}>Maintenance & Repair</Link>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerSubHeading}>Contact</h4>
            <p style={styles.footerText}>Serving Auckland & Surrounds</p>
            <button 
              onClick={() => {
                const openChat = document.querySelector('[data-chat-bubble]');
                if (openChat) openChat.click();
              }}
              style={styles.footerCtaButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255,107,53,0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255,107,53,0.3)';
              }}
            >
              Get Free Quote
            </button>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Heat.nz. All rights reserved.</p>
        </div>
      </footer>

      {/* --- Chatbot Integration --- */}
      {/* 
        The Chatbot is now always rendered to preserve its state.
        We use CSS transforms to show/hide it.
      */}
      <div 
        className="chatbot-container"
        style={{
          ...styles.chatbotContainer,
          transform: isChatOpen ? 'translateY(0)' : 'translateY(calc(100% + 20px))',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Chatbot key={chatKey} handleClose={handleClose} handleReset={handleResetAndClose} />
      </div>
      
      {/* The bubble is always visible, but we can hide it when the chat is open if we want */}
      <button 
        data-chat-bubble="true"
        style={{
          ...styles.chatBubble,
          transform: isChatOpen ? 'scale(0)' : 'scale(1)',
          transition: 'transform 0.2s ease-in-out',
        }} 
        onClick={() => setIsChatOpen(true)}
        aria-label="Open chat"
      >
        💬
      </button>
    </>
  );
};

const styles = {
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  nav: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '80px',
  },
  logo: {
    fontSize: '1.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: "'Poppins', sans-serif",
  },
  logoIcon: {
    fontSize: '1.8rem',
    filter: 'drop-shadow(0 2px 4px rgba(255,107,53,0.3))',
  },
  logoText: {
    color: '#1a1a1a',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    color: '#FF6B35',
    fontWeight: 600,
  },
  logoLink: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
  },
  ctaButton: {
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.75rem',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48px',
    height: '48px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'background-color 0.3s',
  },
  hamburgerLine: {
    width: '28px',
    height: '3px',
    backgroundColor: '#1a1a1a',
    margin: '3px 0',
    transition: '0.3s',
    borderRadius: '2px',
  },
  mobileMenu: {
    position: 'absolute',
    top: '80px',
    left: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    borderRadius: '0 0 20px 20px',
    padding: '20px',
    zIndex: 999,
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
  mobileNavLink: {
    display: 'block',
    padding: '14px 18px',
    textDecoration: 'none',
    color: '#1a1a1a',
    fontWeight: 500,
    borderRadius: '10px',
    marginBottom: '8px',
    transition: 'all 0.3s',
    fontFamily: "'Inter', sans-serif",
  },
  mobileCtaButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 18px',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    marginBottom: '10px',
    fontFamily: "'Inter', sans-serif",
  },
  mobileLoginBtn: {
    display: 'block',
    textAlign: 'center',
    textDecoration: 'none',
    background: 'transparent',
    color: '#1a1a1a',
    padding: '14px 18px',
    borderRadius: '10px',
    fontWeight: 600,
    marginTop: '8px',
    border: '2px solid #e0e0e0',
    fontFamily: "'Inter', sans-serif",
  },
  navLink: {
    textDecoration: 'none',
    color: '#1a1a1a',
    fontWeight: 500,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
  },
  activeLink: {
    textDecoration: 'none',
    fontWeight: 600,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: 'white',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
  },
  loginBtn: {
    textDecoration: 'none',
    background: 'transparent',
    color: '#1a1a1a',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    fontWeight: 600,
    border: '2px solid #e0e0e0',
    transition: 'all 0.3s',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.9rem',
  },
  main: {
    marginTop: '80px',
    minHeight: 'calc(100vh - 120px)',
  },
  footer: {
    background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
    color: 'white',
    padding: '60px 20px 20px',
    marginTop: '60px',
  },
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '3rem',
    marginBottom: '40px',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  footerHeading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    fontFamily: "'Poppins', sans-serif",
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  footerSubHeading: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    fontFamily: "'Inter', sans-serif",
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.6',
    fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif",
  },
  footerLink: {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    marginBottom: '0.75rem',
    transition: 'all 0.3s',
    fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif",
    display: 'block',
  },
  footerCtaButton: {
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
    transition: 'all 0.3s ease',
    marginTop: '0.5rem',
    width: 'fit-content',
    fontFamily: "'Inter', sans-serif",
  },
  footerBottom: {
    maxWidth: '1400px',
    margin: '0 auto',
    paddingTop: '30px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
  },
  // Modern Chatbot styles
  chatbotContainer: { 
    position: 'fixed', 
    bottom: '24px', 
    right: '24px', 
    zIndex: 10001, 
    width: '420px', 
    height: '640px', 
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    borderRadius: '24px',
    overflow: 'hidden',
    maxWidth: 'calc(100vw - 48px)',
    maxHeight: 'calc(100vh - 48px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  chatBubble: { 
    position: 'fixed', 
    right: '24px', 
    bottom: '24px', 
    width: '64px', 
    height: '64px', 
    borderRadius: '50%', 
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
    color: 'white', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '28px', 
    boxShadow: '0 8px 25px rgba(255,107,53,0.4)', 
    zIndex: 9999,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Layout;
