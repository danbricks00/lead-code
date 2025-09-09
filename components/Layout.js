import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Chatbot from './Chatbot'; // Import the Chatbot

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
        <title>Kiwi Trade - Connect with Qualified Tradesmen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <span role="img" aria-label="tool emoji">🔧</span>
            <Link href="/" style={styles.logoLink}>Kiwi Trade</Link>
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={styles.navMenu}>
              <Link href="/" style={router.pathname === '/' ? styles.activeLink : styles.navLink}>Home</Link>
              <Link href="/about" style={router.pathname === '/about' ? styles.activeLink : styles.navLink}>About Us</Link>
              <Link href="/contact" style={router.pathname === '/contact' ? styles.activeLink : styles.navLink}>Contact</Link>
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
            <Link href="/about" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
            <Link href="/contact" style={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            <Link href="/tradesman-login" style={styles.mobileLoginBtn} onClick={() => setIsMobileMenuOpen(false)}>Tradesman Login</Link>
          </div>
        )}
      </header>
      <main style={styles.main}>
        {childrenWithProps}
      </main>
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Kiwi Trade. All rights reserved.</p>
      </footer>

      {/* --- Chatbot Integration --- */}
      {/* 
        The Chatbot is now always rendered to preserve its state.
        We use CSS transforms to show/hide it.
      */}
      <div style={{
        ...styles.chatbotContainer,
        transform: isChatOpen ? 'translateY(0)' : 'translateY(calc(100% + 20px))',
        transition: 'transform 0.3s ease-in-out',
      }}>
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
    background: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  nav: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoLink: {
    textDecoration: 'none',
    color: '#333',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
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
    borderRadius: '8px',
    transition: 'background-color 0.3s',
  },
  hamburgerLine: {
    width: '28px',
    height: '3px',
    backgroundColor: '#333',
    margin: '3px 0',
    transition: '0.3s',
    borderRadius: '2px',
  },
  mobileMenu: {
    position: 'absolute',
    top: '70px',
    left: 0,
    right: 0,
    background: 'white',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    borderRadius: '0 0 15px 15px',
    padding: '15px',
    zIndex: 999,
  },
  mobileNavLink: {
    display: 'block',
    padding: '12px 16px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 500,
    borderRadius: '8px',
    marginBottom: '5px',
    transition: 'background-color 0.3s',
  },
  mobileLoginBtn: {
    display: 'block',
    textAlign: 'center',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    marginTop: '10px',
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 500,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
  activeLink: {
    textDecoration: 'none',
    fontWeight: 500,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s',
    background: '#667eea',
    color: 'white',
  },
  loginBtn: {
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '0.6rem 1.2rem',
    borderRadius: '25px',
    fontWeight: 600,
  },
  main: {
    marginTop: '70px',
    minHeight: 'calc(100vh - 120px)', // Adjusted for footer
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderTop: '1px solid #eee',
  },
  // Chatbot styles moved from index.js
  chatbotContainer: { 
    position: 'fixed', 
    bottom: '20px', 
    right: '20px', 
    zIndex: 10001, 
    width: '400px', 
    height: '600px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)' 
  },
  chatBubble: { 
    position: 'fixed', 
    right: '20px', 
    bottom: '20px', 
    width: '60px', 
    height: '60px', 
    borderRadius: '50%', 
    background: 'linear-gradient(135deg, #667eea, #764ba2)', 
    color: 'white', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '24px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', 
    zIndex: 9999 
  },
};

export default Layout;
