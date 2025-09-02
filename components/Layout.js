import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Chatbot from './Chatbot'; // Import the Chatbot

const Layout = ({ children }) => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(Date.now()); // Key to force re-mount for reset

  const handleClose = () => setIsChatOpen(false);
  
  const handleResetAndClose = () => {
    setIsChatOpen(false);
    // Change the key to force React to create a new instance of the Chatbot
    setChatKey(Date.now()); 
  };
  
  // Pass a function to children to allow them to open the chat
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { openChat: () => setIsChatOpen(true) });
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
          <div style={styles.navMenu}>
            <Link href="/" style={router.pathname === '/' ? styles.activeLink : styles.navLink}>Home</Link>
            <Link href="/about" style={router.pathname === '/about' ? styles.activeLink : styles.navLink}>About Us</Link>
            <Link href="/contact" style={router.pathname === '/contact' ? styles.activeLink : styles.navLink}>Contact</Link>
            <a href="#" style={styles.loginBtn}>Tradesman Login</a>
          </div>
        </nav>
      </header>
      <main style={styles.main}>
        {childrenWithProps}
      </main>
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Kiwi Trade. All rights reserved.</p>
      </footer>

      {/* Chatbot Integration */}
      {isChatOpen && (
        <div style={styles.chatbotContainer}>
          <Chatbot key={chatKey} handleClose={handleClose} handleReset={handleResetAndClose} />
        </div>
      )}
      
      {!isChatOpen && (
         <button style={styles.chatBubble} onClick={() => setIsChatOpen(true)}>
           💬
         </button>
      )}
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
  chatbotContainer: { position: 'fixed', bottom: '20px', right: '20px', zIndex: 10001, width: '400px', height: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  chatBubble: { position: 'fixed', right: '20px', bottom: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999 },
};

export default Layout;
