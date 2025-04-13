import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faAngleDown,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "./MobileFilters.scss"; // Import the new styles

const MobileFilters = ({
  categories = [],
  initialFilters = {},
  onApplyFilters,
  onResetFilters,
}) => {
  // States for filter UI and values
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [filters, setFilters] = useState({
    minPrice: initialFilters.minPrice || "",
    maxPrice: initialFilters.maxPrice || "",
    category: initialFilters.category || "",
    ...initialFilters,
  });

  // Set up window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Price range options
  const priceRanges = [
    { label: "Dưới 5 triệu", min: "0", max: "5000000" },
    { label: "5 - 10 triệu", min: "5000000", max: "10000000" },
    { label: "10 - 20 triệu", min: "10000000", max: "20000000" },
    { label: "Trên 20 triệu", min: "20000000", max: "" },
  ];

  // Handler functions
  const toggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const selectPriceRange = (min, max) => {
    setFilters({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const handleCategoryChange = (categoryValue) => {
    setFilters({
      ...filters,
      category: categoryValue,
    });
  };

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      category: "",
    });

    if (onResetFilters) {
      onResetFilters();
    }

    closeFilterUI();
  };

  const applyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }

    closeFilterUI();
  };

  const closeFilterUI = () => {
    if (isMobile) {
      setIsDrawerOpen(false);
    } else {
      // Optionally close the expanded panel on desktop after applying
    }
  };

  // Get active price range for highlighting
  const getActivePriceRange = () => {
    const { minPrice, maxPrice } = filters;

    if (!minPrice && !maxPrice) return null;

    return priceRanges.findIndex(
      (range) => range.min === minPrice && range.max === maxPrice
    );
  };

  // Active price range index
  const activePriceRange = getActivePriceRange();

  // Generate filter content (shared between desktop panel and mobile drawer)
  const filterContent = (
    <>
      <div className="filter-panel">
        <h4 className="filter-panel-title">Khoảng giá</h4>
        <div className="price-options">
          {priceRanges.map((range, index) => (
            <div
              key={`price-${index}`}
              className={`price-option ${
                index === activePriceRange ? "active" : ""
              }`}
              onClick={() => selectPriceRange(range.min, range.max)}
            >
              {range.label}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-panel">
        <h4 className="filter-panel-title">Thể loại</h4>
        <div className="category-list">
          <div className="category-item">
            <input
              type="radio"
              id="all-categories"
              name="category"
              checked={filters.category === ""}
              onChange={() => handleCategoryChange("")}
            />
            <label htmlFor="all-categories">Tất cả</label>
          </div>

          {categories.map((cat) => (
            <div className="category-item" key={cat._id || cat.id}>
              <input
                type="radio"
                id={`category-${cat._id || cat.id}`}
                name="category"
                checked={filters.category === cat.namekhongdau}
                onChange={() => handleCategoryChange(cat.namekhongdau)}
              />
              <label htmlFor={`category-${cat._id || cat.id}`}>
                {cat.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {(filters.minPrice || filters.maxPrice || filters.category) && (
        <div className="mobile-filters-active">
          {(filters.minPrice || filters.maxPrice) && (
            <div className="filter-tag">
              Giá:
              {filters.minPrice
                ? ` ${parseInt(filters.minPrice).toLocaleString("vi-VN")}₫`
                : " 0₫"}
              -
              {filters.maxPrice
                ? ` ${parseInt(filters.maxPrice).toLocaleString("vi-VN")}₫`
                : " trở lên"}
              <button
                className="remove-tag"
                onClick={() => selectPriceRange("", "")}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}

          {filters.category && (
            <div className="filter-tag">
              Thể loại:{" "}
              {categories.find((c) => c.namekhongdau === filters.category)
                ?.name || filters.category}
              <button
                className="remove-tag"
                onClick={() => handleCategoryChange("")}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mobile-filters-actions">
        <button className="apply-btn" onClick={applyFilters}>
          Áp dụng
        </button>
        <button className="reset-btn" onClick={resetFilters}>
          Đặt lại
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop/Tablet Filter Panel */}
      <div className="mobile-filters-container">
        <div className="mobile-filters-header">
          <h3>
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            Lọc sản phẩm
          </h3>
          <button
            className={`toggle-btn ${isFilterExpanded ? "open" : ""}`}
            onClick={toggleFilter}
          >
            <FontAwesomeIcon icon={faAngleDown} />
          </button>
        </div>
        <div
          className={`mobile-filters-content ${
            isFilterExpanded ? "expanded" : ""
          }`}
        >
          {filterContent}
        </div>
      </div>

      {/* Mobile Drawer (for small screens) */}
      {isMobile && (
        <>
          <button className="mobile-filter-trigger" onClick={toggleDrawer}>
            <FontAwesomeIcon icon={faFilter} />
          </button>

          <div
            className={`filter-drawer-backdrop ${isDrawerOpen ? "active" : ""}`}
            onClick={toggleDrawer}
          ></div>

          <div className={`filter-drawer ${isDrawerOpen ? "open" : ""}`}>
            <div className="filter-drawer-header">
              <h3>Lọc sản phẩm</h3>
              <button className="close-btn" onClick={toggleDrawer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="filter-drawer-content">{filterContent}</div>

            <div className="filter-drawer-footer">
              <div className="filter-drawer-actions">
                <button className="apply-btn" onClick={applyFilters}>
                  <FontAwesomeIcon icon={faCheck} /> Áp dụng
                </button>
                <button className="reset-btn" onClick={resetFilters}>
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileFilters;
