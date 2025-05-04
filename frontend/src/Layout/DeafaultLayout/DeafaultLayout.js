import React, { useState } from "react";
import Navbar from "./Header/MenuHeader/Navbar";
import { Footer } from "./Footer";
import Call from "./FloatingChat/Call/Call";
import Zalo from "./FloatingChat/Zalo/Zalo";
import ChatAI from "./FloatingChat/Chatai/chatai";
import { FaTimes, FaComments, FaPhone, FaRobot } from "react-icons/fa";
import "./DefaultLayout.scss";

function DefaultLayout({ children }) {
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const toggleFloatingMenu = () => {
    setShowFloatingMenu(!showFloatingMenu);
  };

  // Hiển thị nút scroll to top khi người dùng cuộn xuống
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="container-default">
      <div className="header-navbar">
        <Navbar />
      </div>
      
      <div className="content">{children}</div>
      
      <Footer />
      
      {/* Floating buttons với animation mượt hơn */}
      <div className={`floating-buttons ${showFloatingMenu ? 'open' : ''}`}>
        <div className="toggle-button" onClick={toggleFloatingMenu} aria-label="Mở menu hỗ trợ">
          {showFloatingMenu ? <FaTimes /> : <FaComments />}
        </div>
        
        {showFloatingMenu && (
          <div className="floating-menu">
            <div className="floating-item chatai-button">
              <ChatAI />
              <span className="floating-tooltip">Chat AI</span>
            </div>
            <div className="floating-item zalo-button">
              <Zalo />
              <span className="floating-tooltip">Zalo</span>
            </div>
            <div className="floating-item call-button">
              <Call />
              <span className="floating-tooltip">Gọi ngay</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Nút scroll to top */}
      {showScrollToTop && (
        <div className="scroll-to-top" onClick={scrollToTop}>
          <span className="arrow">↑</span>
        </div>
      )}
    </div>
  );
}

export default DefaultLayout;