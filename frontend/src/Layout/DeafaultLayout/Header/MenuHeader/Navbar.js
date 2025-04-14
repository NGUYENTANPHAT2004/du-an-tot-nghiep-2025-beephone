import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Navbar.scss";
import Header from "../Header";
import CategoryItem from "../CategoryItem/CategoryItem";
import { FaBars, FaTimes, FaChevronDown, FaSearch } from "react-icons/fa";

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  // Check for mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:3005/listcate");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && 
          !menuRef.current.contains(event.target) &&
          !event.target.closest('.menu-toggle')) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Toggle menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) {
      // Reset active submenu when opening menu
      setActiveSubmenu(null);
      setCategoryMenuOpen(false);
    }
  };

  // Toggle category dropdown
  const toggleCategoryMenu = () => {
    if (isMobile) {
      setCategoryMenuOpen(!categoryMenuOpen);
      if (categoryMenuOpen) {
        // If closing category menu, also reset active submenus
        setActiveSubmenu(null);
      }
    }
  };

  // Toggle submenu
  const toggleSubmenu = (categoryId) => {
    if (activeSubmenu === categoryId) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(categoryId);
    }
  };

  return (
    <nav className="navbar-modern">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-container">
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <img src="/logo1.png" alt="ShopDunk" className="logo-image" />
            </Link>
          </div>
          
          <div className="header-wrapper">
            <Header />
          </div>
        </div>
      </div>
      
      {/* Main menu */}
      <div className="menu-bar">
        <div className="menu-container">
          {/* Mobile menu toggle */}
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
            <span className="toggle-text">Menu</span>
          </button>
          
          {/* Main navigation */}
          <div className={`menu-wrapper ${menuOpen ? 'menu-open' : ''}`}>
            {menuOpen && <div className="menu-backdrop" onClick={toggleMenu}></div>}
            
            <div ref={menuRef} className="main-menu">
              {menuOpen && (
                <div className="mobile-menu-header">
                  <span>Danh mục</span>
                  <button className="close-menu" onClick={toggleMenu}>
                    <FaTimes />
                  </button>
                </div>
              )}
              
              <ul className="menu-list">
                <li className="menu-item">
                  <Link to="/" className="menu-link">Trang chủ</Link>
                </li>
                
                <li className={`menu-item has-submenu ${categoryMenuOpen ? 'submenu-active' : ''}`}>
                  <button 
                    className="menu-button" 
                    onClick={toggleCategoryMenu}
                    aria-expanded={categoryMenuOpen}
                  >
                    <span>Danh mục sản phẩm</span>
                    <FaChevronDown className={`submenu-icon ${categoryMenuOpen ? 'active' : ''}`} />
                  </button>
                  
                  <div className={`submenu-container ${categoryMenuOpen ? 'active' : ''}`}>
                    <ul className="submenu-list">
                      {categories.map((category) => (
                        <CategoryItem 
                          key={category._id} 
                          category={category} 
                          isMobile={isMobile}
                          activeSubmenu={activeSubmenu}
                          toggleSubmenu={toggleSubmenu}
                        />
                      ))}
                    </ul>
                  </div>
                </li>
                
                <li className="menu-item">
                  <Link to="/gioi-thieu" className="menu-link">Giới thiệu</Link>
                </li>
                
                <li className="menu-item">
                  <Link to="/san-pham" className="menu-link">Sản phẩm</Link>
                </li>
                
                <li className="menu-item">
                  <Link to="/lien-he" className="menu-link">Liên hệ</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;