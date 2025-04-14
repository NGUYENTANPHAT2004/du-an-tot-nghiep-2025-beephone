import React, { useState, useEffect, useRef } from 'react'
import './Header.scss'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaTicketAlt, FaBell, FaShoppingCart, FaUserAlt, FaBars, FaTimes } from 'react-icons/fa'
import { Link } from "react-router-dom"
import { useUserContext } from '../../../context/Usercontext'
import { ToastContainer, toast } from 'react-toastify'
import VoucherModal from '../../../components/VoucherModal/VoucherModal'
import VoucherNotification from '../../../notifi/VoucherNotification'
import WelcomeVoucher from '../../../notifi/WelcomeVoucher'
import UserPointsInfo from '../../../components/UserPointsInfo/UserPointsInfo';

const Header = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [itemCount, setItemCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const { getUser, logout, welcomeVoucher, dismissWelcomeVoucher, user } = useUserContext()
  const [username, setUsername] = useState(null)
  const [hasNewVouchers, setHasNewVouchers] = useState(false)
  const [lastVoucherCheck, setLastVoucherCheck] = useState(0)
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)

  // Lấy userId từ thông tin người dùng - giữ nguyên logic
  const getUserId = () => {
    if (!user) return null;
    return user._id || (user.user && user.user._id);
  };

  // Initialize user data - giữ nguyên logic
  useEffect(() => {
    const userData = getUser();
    setUsername(userData);
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const userId = userData?._id || userData?.user?._id;
        
        if (userId) {
          checkForNewVouchers(userId);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [getUser])
  
  // Update user data when logout event occurs
  useEffect(() => {
    const updateUser = () => {
      const userData = getUser();
      setUsername(userData);
    };
  
    window.addEventListener("userLogout", updateUser);
    return () => window.removeEventListener("userLogout", updateUser);
  }, [getUser]);
  
  // Check for new vouchers with reduced frequency
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    
    const now = Date.now();
    if (now - lastVoucherCheck > 15 * 60 * 1000) {
      checkForNewVouchers(userId);
    }
    
    const intervalId = setInterval(() => {
      checkForNewVouchers(userId);
    }, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user, lastVoucherCheck]);
  
  // Check for new vouchers with throttling - giữ nguyên logic
  const checkForNewVouchers = async (userId) => {
    try {
      const now = Date.now();
      if (now - lastVoucherCheck < 15 * 60 * 1000) {
        return;
      }
      
      setLastVoucherCheck(now);
      
      const response = await fetch(`http://localhost:3005/checknewvouchers/${userId}`);
      const data = await response.json();
      
      if (response.ok && data.hasNewVouchers) {
        setHasNewVouchers(true);
      }
    } catch (error) {
      console.error('Error checking for new vouchers:', error);
    }
  };
  
  // Update cart count - giữ nguyên logic
  const updateCartCount = () => {
    const cart = localStorage.getItem('cart')
    setItemCount(cart ? JSON.parse(cart).length : 0)
  }

  useEffect(() => {
    updateCartCount()

    const handleCartChange = () => updateCartCount()
    window.addEventListener('cartUpdated', handleCartChange)
    return () => window.removeEventListener('cartUpdated', handleCartChange)
  }, [])

  const handleSearch = () => {
    if (searchKeyword.trim() !== '') {
      navigate(`/search/${encodeURIComponent(searchKeyword)}`)
      setIsSearchExpanded(false)
    }
  }

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded)
    setTimeout(() => {
      if (!isSearchExpanded && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }
  
  const openVoucherModal = () => {
    if (username) {
      const userId = getUserId();
      if (userId) {
        setIsVoucherModalOpen(true);
        setHasNewVouchers(false);
      } else {
        toast.warning('Không tìm thấy thông tin người dùng của bạn', {
          position: "top-right",
          autoClose: 3000
        });
      }
    } else {
      toast.info('Vui lòng đăng nhập để xem mã giảm giá của bạn', {
        position: "top-right",
        autoClose: 3000
      });
      setTimeout(() => navigate('/login'), 1000);
    }
  }

  // Handle click outside user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isSearchExpanded) {
          setIsSearchExpanded(false);
        }
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isUserMenuOpen, isSearchExpanded]);

  // UI Mới nhưng giữ nguyên logic hoạt động
  return (
    <header className="header">
      <ToastContainer />
      
      <div className="header-container">
        {/* Vùng tìm kiếm */}
        <div className={`search-container ${isSearchExpanded ? 'expanded' : ''}`}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="search-button" 
            onClick={handleSearch}
            aria-label="Tìm kiếm"
          >
            <FaSearch />
          </button>
          
          <button 
            className="search-toggle" 
            onClick={toggleSearch}
            aria-label={isSearchExpanded ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
          >
            {isSearchExpanded ? <FaTimes /> : <FaSearch />}
          </button>
        </div>
        
        {/* Điểm người dùng */}
        {username && <div className="user-points"><UserPointsInfo /></div>}
        
        {/* Giỏ hàng */}
        <Link to="/cart" className="cart-button" aria-label="Giỏ hàng">
          <FaShoppingCart />
          {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
        </Link>
        
        {/* User menu */}
        <div ref={userMenuRef} className="user-menu">
          <button 
            className="user-button" 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            {username ? (
              <span className="username">{username}</span>
            ) : (
              <FaUserAlt />
            )}
          </button>
          
          {isUserMenuOpen && (
            <div className="user-dropdown">
              {username ? (
                <>
                  <button onClick={openVoucherModal} className="dropdown-item voucher-item">
                    <span>Mã giảm giá</span>
                    <FaTicketAlt />
                    {hasNewVouchers && <span className="notification-dot"></span>}
                  </button>
                  <Link to="/orders" className="dropdown-item">
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <Link to="/profile" className="dropdown-item">
                    <span>Tài khoản</span>
                  </Link>
                  <button onClick={logout} className="dropdown-item logout-item">
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="dropdown-item">
                    <span>Đăng nhập</span>
                  </Link>
                  <Link to="/register" className="dropdown-item">
                    <span>Đăng ký</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Voucher Components - giữ nguyên */}
      <VoucherModal 
        isOpen={isVoucherModalOpen} 
        onClose={() => setIsVoucherModalOpen(false)}
      />
      
      {/* Voucher Notification cho người dùng đã đăng nhập */}
      {username && getUserId() && (
        <VoucherNotification 
          onVoucherClick={openVoucherModal}
        />
      )}
      
      {/* Welcome Voucher cho người dùng mới */}
      {welcomeVoucher && (
        <WelcomeVoucher 
          voucher={welcomeVoucher} 
          onClose={dismissWelcomeVoucher}
        />
      )}
    </header>
  )
}

export default Header