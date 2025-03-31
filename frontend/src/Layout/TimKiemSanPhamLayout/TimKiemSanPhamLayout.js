import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../../components/ProductItem/ProductCard';
import ThanhDinhHuong from '../../components/ThanhDinhHuong/ThanhDinhHuong';
import { Helmet } from 'react-helmet';
import Loading from '../../components/Loading/Loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faArrowRight, 
  faSearch, 
  faFilter, 
  faTimes,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import './TimKiemSanPhamLayout.scss';
import { debounce } from 'lodash';

const TimKiemSanPhamLayout = () => {
  const { keyword } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy query params từ URL
  const queryParams = new URLSearchParams(location.search);
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField] = useState(queryParams.get('sortField') || 'price');
  const [sortOrder, setSortOrder] = useState(queryParams.get('sortOrder') || 'asc');
  const [searchText, setSearchText] = useState(keyword || '');
  const [category, setCategory] = useState(queryParams.get('category') || '');
  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(queryParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(queryParams.get('maxPrice') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Lỗi khi đọc lịch sử tìm kiếm:', e);
      }
    }
  }, []);

  // Update search history when performing a search
  const updateSearchHistory = (term) => {
    if (!term.trim()) return;
    
    // Add to beginning, remove duplicates, keep maximum 10 items
    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  // Hàm xây dựng query string từ các params
  const buildQueryString = useCallback((params) => {
    const queryString = new URLSearchParams();
    
    if (params.page && params.page > 1) queryString.append('page', params.page);
    if (params.sortOrder && params.sortOrder !== 'asc') queryString.append('sortOrder', params.sortOrder);
    if (params.sortField && params.sortField !== 'price') queryString.append('sortField', params.sortField);
    if (params.category) queryString.append('category', params.category);
    if (params.minPrice) queryString.append('minPrice', params.minPrice);
    if (params.maxPrice) queryString.append('maxPrice', params.maxPrice);
    
    return queryString.toString();
  }, []);
  
  // Hàm cập nhật URL khi các params thay đổi
  const updateUrlParams = useCallback(() => {
    const queryString = buildQueryString({
      page,
      sortOrder,
      sortField,
      category,
      minPrice,
      maxPrice
    });
    
    navigate(`/search-sanpham/${encodeURIComponent(keyword)}${queryString ? `?${queryString}` : ''}`, { replace: true });
  }, [buildQueryString, category, keyword, navigate, page, sortField, sortOrder, minPrice, maxPrice]);
  
  // Effect để cập nhật URL khi params thay đổi
  useEffect(() => {
    updateUrlParams();
  }, [page, sortOrder, sortField, category, minPrice, maxPrice, updateUrlParams]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3005/sanpham');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (term) => {
      if (term.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:3005/search-all?keyword=${encodeURIComponent(term)}&limit=5`);
        const data = await response.json();
        
        if (response.ok) {
          setSuggestions(data.sanphamjson?.slice(0, 5) || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý tìm kiếm:', error);
      }
    }, 300),
    []
  );

  // Update suggestions when search text changes
  useEffect(() => {
    fetchSuggestions(searchText);
    return () => fetchSuggestions.cancel();
  }, [searchText, fetchSuggestions]);
  
  // Debounced search handler
  const debouncedFetchProducts = useCallback(
    debounce((currentKeyword, currentPage, currentLimit, currentSortOrder, currentCategory, currentMinPrice, currentMaxPrice) => {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          
          let url = `http://localhost:3005/search?keyword=${encodeURIComponent(currentKeyword)}&page=${currentPage}&limit=${currentLimit}&sortOrder=${currentSortOrder}`;
          
          if (currentCategory) {
            url += `&category=${encodeURIComponent(currentCategory)}`;
          }
          
          if (currentMinPrice) {
            url += `&minPrice=${currentMinPrice}`;
          }
          
          if (currentMaxPrice) {
            url += `&maxPrice=${currentMaxPrice}`;
          }
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (response.ok && data.success) {
            setProducts(data.products);
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.totalItems);
          } else {
            console.error('Lỗi khi tìm kiếm:', data.message);
            setProducts([]);
            setTotalPages(0);
            setTotalItems(0);
          }
        } catch (error) {
          console.error('Lỗi khi tìm kiếm sản phẩm:', error);
          setProducts([]);
          setTotalPages(0);
          setTotalItems(0);
        } finally {
          setLoading(false);
        }
      };
      
      if (currentKeyword) {
        fetchProducts();
      } else {
        setLoading(false);
        setProducts([]);
      }
    }, 300),
    []
  );
  
  // Effect để fetch sản phẩm khi params thay đổi
  useEffect(() => {
    debouncedFetchProducts(keyword, page, limit, sortOrder, category, minPrice, maxPrice);
    return () => debouncedFetchProducts.cancel();
  }, [keyword, page, limit, sortOrder, category, minPrice, maxPrice, debouncedFetchProducts]);
  
  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      updateSearchHistory(searchText.trim());
      navigate(`/search-sanpham/${encodeURIComponent(searchText.trim())}`);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setCategory('');
    setSortOrder('asc');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };
  
  // Apply price filter
  const applyPriceFilter = () => {
    setPage(1);
    setIsFilterOpen(false);
  };
  
  // Select price range
  const selectPriceRange = (min, max) => {
    setMinPrice(min || '');
    setMaxPrice(max || '');
    setPage(1);
  };
  
  return (
    <div className="search-container">
      <Helmet>
        <title>{`Tìm kiếm: ${keyword} - Shopdunk`}</title>
        <meta name="description" content={`Kết quả tìm kiếm cho: ${keyword}. Tìm thấy ${totalItems} sản phẩm.`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <ThanhDinhHuong
        breadcrumbs={[
          { label: 'Trang Chủ', link: '/' },
          { label: `Tìm kiếm: ${keyword}`, link: `/search-sanpham/${keyword}` }
        ]}
      />

      <div className="search-header">
        <h1>Kết quả tìm kiếm cho: "{keyword}"</h1>
        <p>Tìm thấy {totalItems} sản phẩm</p>

        <div className="search-form">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm"
                  onFocus={() => {
                    if (suggestions.length > 0 || searchHistory.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicks on suggestions
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                
                {showSuggestions && (
                  <div className="search-suggestions">
                    {searchText.trim().length < 2 && searchHistory.length > 0 ? (
                      <>
                        <div className="history-header">
                          <span>Tìm kiếm gần đây</span>
                          <button onClick={(e) => {
                            e.preventDefault();
                            localStorage.removeItem('searchHistory');
                            setSearchHistory([]);
                          }}>Xóa tất cả</button>
                        </div>
                        {searchHistory.map((term, index) => (
                          <a 
                            key={`history-${index}`}
                            href={`/search-sanpham/${encodeURIComponent(term)}`}
                            className="suggestion-item"
                            onClick={(e) => {
                              e.preventDefault();
                              setSearchText(term);
                              updateSearchHistory(term);
                              setShowSuggestions(false);
                              navigate(`/search-sanpham/${encodeURIComponent(term)}`);
                            }}
                          >
                            <FontAwesomeIcon icon={faHistory} className="suggestion-icon" />
                            <span>{term}</span>
                          </a>
                        ))}
                      </>
                    ) : suggestions.length > 0 ? (
                      suggestions.map(suggestion => (
                        <a 
                          key={suggestion._id}
                          href={`/chitietsanpham/${suggestion.nametheloai}/${suggestion.namekhongdau}`}
                          className="suggestion-item"
                          onClick={(e) => {
                            e.preventDefault();
                            setSearchText(suggestion.name);
                            setShowSuggestions(false);
                            navigate(`/chitietsanpham/${suggestion.nametheloai}/${suggestion.namekhongdau}`);
                          }}
                        >
                          <FontAwesomeIcon icon={faSearch} className="suggestion-icon" />
                          <span>{suggestion.name}</span>
                        </a>
                      ))
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="filter-controls">
          <button className="filter-button" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FontAwesomeIcon icon={faFilter} /> Lọc
          </button>
          
          <select
            onChange={(e) => setSortOrder(e.target.value)}
            value={sortOrder}
            className="custom-select"
          >
            <option value="asc">Giá thấp đến cao</option>
            <option value="desc">Giá cao đến thấp</option>
          </select>
          
          {(category || sortOrder !== 'asc' || minPrice || maxPrice) && (
            <button className="reset-button" onClick={resetFilters}>
              <FontAwesomeIcon icon={faTimes} /> Xóa bộ lọc
            </button>
          )}
        </div>
        
        {/* Backdrop for filter sidebar */}
        {isFilterOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setIsFilterOpen(false)}
          ></div>
        )}
        
        {/* Filter sidebar */}
        <div className={`filter-sidebar ${isFilterOpen ? 'open' : ''}`}>
          <div className="filter-header">
            <h3>Lọc sản phẩm</h3>
            <button onClick={() => setIsFilterOpen(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="filter-section">
            <h4>Khoảng giá</h4>
            <div className="price-range">
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button className="apply-price" onClick={applyPriceFilter}>Áp dụng</button>
            </div>
            
            <div className="price-presets">
              <button onClick={() => selectPriceRange(0, 5000000)}>Dưới 5 triệu</button>
              <button onClick={() => selectPriceRange(5000000, 10000000)}>5 - 10 triệu</button>
              <button onClick={() => selectPriceRange(10000000, 20000000)}>10 - 20 triệu</button>
              <button onClick={() => selectPriceRange(20000000, '')}>Trên 20 triệu</button>
            </div>
          </div>
          
          <div className="filter-section">
            <h4>Thể loại</h4>
            <div className="category-list">
              <div className="category-item">
                <input
                  type="radio"
                  id="all-categories"
                  name="category"
                  checked={category === ''}
                  onChange={() => setCategory('')}
                />
                <label htmlFor="all-categories">Tất cả</label>
              </div>
              
              {categories.map((cat) => (
                <div className="category-item" key={cat._id}>
                  <input
                    type="radio"
                    id={`category-${cat._id}`}
                    name="category"
                    checked={category === cat.namekhongdau}
                    onChange={() => setCategory(cat.namekhongdau)}
                  />
                  <label htmlFor={`category-${cat._id}`}>{cat.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="apply-btn" onClick={() => setIsFilterOpen(false)}>
              Áp dụng
            </button>
            <button className="reset-btn" onClick={resetFilters}>
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(category || sortOrder !== 'asc' || minPrice || maxPrice) && (
        <div className="active-filters">
          <span>Bộ lọc đang áp dụng:</span>
          
          {category && (
            <div className="filter-tag">
              Thể loại: {categories.find(c => c.namekhongdau === category)?.name || category}
              <button onClick={() => setCategory('')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
          {(minPrice || maxPrice) && (
            <div className="filter-tag">
              Giá: {minPrice ? `${parseInt(minPrice).toLocaleString('vi-VN')}đ` : 'Từ 0đ'} - {maxPrice ? `${parseInt(maxPrice).toLocaleString('vi-VN')}đ` : 'trở lên'}
              <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
          {sortOrder !== 'asc' && (
            <div className="filter-tag">
              Sắp xếp: Giá cao đến thấp
              <button onClick={() => setSortOrder('asc')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          {products.length > 0 ? (
            <div className="search-results">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  sanpham={product}
                  nametheloai={product.nametheloai}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <h2>Không tìm thấy sản phẩm nào phù hợp</h2>
              <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
              {(category || minPrice || maxPrice) && (
                <button className="reset-filter-btn" onClick={resetFilters}>
                  Bỏ tất cả bộ lọc
                </button>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn"
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              
              {/* Hiển thị các trang */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  // Nếu có ít hơn 5 trang, hiển thị tất cả
                  pageNum = i + 1;
                } else if (page <= 3) {
                  // Nếu đang ở gần đầu
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  // Nếu đang ở gần cuối
                  pageNum = totalPages - 4 + i;
                } else {
                  // Ở giữa, hiển thị 2 trang trước và 2 trang sau
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className="page-btn"
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimKiemSanPhamLayout;