import React, { useState } from "react";
import { Link } from "react-router-dom";
import './CategoryItem.scss'; 
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';

const CategoryItem = ({ category, isMobile, activeSubmenu, toggleSubmenu, level = 0 }) => {
  const hasChildren = category?.children && category.children.length > 0;
  const isActive = activeSubmenu === category._id;
  
  // Handle toggle button
  const handleToggleButton = (e) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements
    e.preventDefault(); // Prevent default link behavior
    toggleSubmenu(category._id);
  };
  
  return (
    <li className={`category-item ${hasChildren ? 'has-submenu' : ''} ${isActive ? 'is-active' : ''} level-${level}`}>
      <div className="category-header">
        {/* For desktop, we use a regular link that navigates normally */}
        {/* For mobile with children, we need special handling */}
        <Link 
          to={`/danh-muc/${category.namekhongdau}`} 
          className="category-link"
          onClick={isMobile && hasChildren ? handleToggleButton : undefined}
        >
          <span className="category-name">{category.name}</span>
        </Link>
        
        {/* Toggle button only for mobile */}
        {hasChildren && isMobile && (
          <button 
            className="toggle-button"
            onClick={handleToggleButton}
            aria-label={`${isActive ? 'Thu gọn' : 'Mở rộng'} danh mục ${category.name}`}
          >
            <FaChevronDown className={`toggle-icon ${isActive ? 'active' : ''}`} />
          </button>
        )}
        
        {/* For desktop, show a right arrow */}
        {hasChildren && !isMobile && (
          <span className="desktop-arrow">
            <FaChevronRight className="arrow-icon" />
          </span>
        )}
      </div>
      
      {hasChildren && (
        <ul className={`subcategory-list ${isActive ? 'active' : ''}`}>
          {category.children.map((child) => (
            <CategoryItem 
              key={child._id} 
              category={child} 
              isMobile={isMobile}
              activeSubmenu={activeSubmenu}
              toggleSubmenu={toggleSubmenu}
              level={level + 1} // Pass down the level information
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default CategoryItem;