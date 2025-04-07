import React, { useState, useEffect } from 'react';
import './UserPointsPage.scss';
import { Helmet } from 'react-helmet';
import ThanhDinhHuong from '../../components/ThanhDinhHuong/ThanhDinhHuong';
import { useUserContext } from '../../context/Usercontext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faGift, faHistory, faCoins, faCrown, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const UserPointsPage = () => {
  const { getUser } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [redemptionOptions, setRedemptionOptions] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [loadingRedeem, setLoadingRedeem] = useState(false);
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const username = getUser();
    
    // Get user's data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Ưu tiên sử dụng phone nếu có
        const userPhone = userData?.phone || userData?.user?.phone;
        const userEmail = userData?.email || userData?.user?.email;
        let userId = null;
        
        // Lấy userId từ cấu trúc dữ liệu phức tạp
        if (userData?._id) {
          userId = userData._id;
        } else if (userData?.user?._id) {
          userId = userData.user._id;
        } else if (userData?.id) {
          userId = userData.id;
        } else if (userData?.user?.id) {
          userId = userData.user.id;
        }
        
        setPhone(userPhone);
        setEmail(userEmail);
        setUserId(userId);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);
  
  // Cập nhật phần fetch user points để sử dụng tất cả thông tin có sẵn
  const fetchUserPoints = async () => {
    try {
      setLoading(true);
      let response = null;
      
      // Thử tìm theo phone trước tiên
      if (phone) {
        response = await axios.get(`http://localhost:3005/loyalty/user-points/${phone}`);
        if (response.data.success && response.data.hasPoints) {
          setUserPoints(response.data.points);
          setLoading(false);
          return;
        }
      }
      
      // Nếu không có phone hoặc không tìm thấy, thử email
      if (email) {
        response = await axios.get(`http://localhost:3005/loyalty/user-points-by-email/${email}`);
        if (response.data.success && response.data.hasPoints) {
          setUserPoints(response.data.points);
          setLoading(false);
          return;
        }
      }
      
      // Nếu vẫn không tìm thấy, hiển thị điểm mặc định
      setUserPoints({
        totalPoints: 0,
        availablePoints: 0,
        tier: 'standard',
        yearToDatePoints: 0,
        history: []
      });
      
    } catch (error) {
      console.error('Error fetching user points:', error);
      toast.error('Lỗi khi tải thông tin điểm thưởng');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user points data
  useEffect(() => {
    if (!phone) return;
    
    const fetchUserPoints = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3005/loyalty/user-points/${phone}`);
        
        if (response.data.success) {
          setUserPoints(response.data.points);
        } else {
          toast.error('Không thể tải thông tin điểm thưởng');
        }
      } catch (error) {
        console.error('Error fetching user points:', error);
        toast.error('Lỗi khi tải thông tin điểm thưởng');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPoints();
  }, [phone]);

  // Fetch redemption options
  useEffect(() => {
    if (!phone || !userPoints) return;
    
    const fetchRedemptionOptions = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/loyalty/redemption-options?phone=${phone}&tier=${userPoints?.tier || 'standard'}`);
        
        if (response.data.success) {
          setRedemptionOptions(response.data.redemptionOptions || []);
        }
      } catch (error) {
        console.error('Error fetching redemption options:', error);
      }
    };

    fetchRedemptionOptions();
  }, [phone, userPoints]);

  // Fetch redemption history
  useEffect(() => {
    if (!phone) return;
    
    const fetchRedemptionHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/loyalty/redemption-history/${phone}`);
        
        if (response.data.success) {
          setRedemptionHistory(response.data.history || []);
        }
      } catch (error) {
        console.error('Error fetching redemption history:', error);
      }
    };

    fetchRedemptionHistory();
  }, [phone]);

  // Handle redeeming points for a voucher
  const handleRedeem = async (redemptionId) => {
    if (!phone || loadingRedeem) return;

    try {
      setLoadingRedeem(true);
      
      const response = await axios.post('http://localhost:3005/loyalty/redeem', {
        phone,
        redemptionId
      });
      
      if (response.data.success) {
        toast.success('Đổi điểm thành công!');
        
        // Update user points
        const pointsResponse = await axios.get(`http://localhost:3005/loyalty/user-points/${phone}`);
        if (pointsResponse.data.success) {
          setUserPoints(pointsResponse.data.points);
        }
        
        // Update redemption history
        const historyResponse = await axios.get(`http://localhost:3005/loyalty/redemption-history/${phone}`);
        if (historyResponse.data.success) {
          setRedemptionHistory(historyResponse.data.history || []);
        }
        
        // Update redemption options
        const optionsResponse = await axios.get(`http://localhost:3005/loyalty/redemption-options?phone=${phone}&tier=${userPoints?.tier || 'standard'}`);
        if (optionsResponse.data.success) {
          setRedemptionOptions(optionsResponse.data.redemptionOptions || []);
        }
        
        // Show voucher details
        toast.info(
          <div>
            <p><strong>Mã voucher:</strong> {response.data.voucher.code}</p>
            <p><strong>Giá trị:</strong> {response.data.voucher.type === 'percentage' 
              ? `${response.data.voucher.value}%` 
              : `${Number(response.data.voucher.value).toLocaleString('vi-VN')}đ`}
            </p>
            <p><strong>Hết hạn:</strong> {moment(response.data.voucher.expiryDate).format('DD/MM/YYYY')}</p>
          </div>,
          {
            autoClose: 8000,
            className: 'voucher-toast'
          }
        );
        
        // Switch to history tab
        setActiveTab('history');
      } else {
        toast.error(response.data.message || 'Đổi điểm thất bại');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi đổi điểm');
    } finally {
      setLoadingRedeem(false);
    }
  };
  
  // Get tier name in Vietnamese
  const getTierName = (tier) => {
    switch (tier) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Bạch Kim';
      default: return 'Tiêu Chuẩn';
    }
  };
  
  // Get tier background color
  const getTierColor = (tier) => {
    switch (tier) {
      case 'silver': return 'var(--silver-gradient)';
      case 'gold': return 'var(--gold-gradient)';
      case 'platinum': return 'var(--platinum-gradient)';
      default: return 'var(--standard-gradient)';
    }
  };

  // Format points number with commas
  const formatPoints = (points) => {
    return Number(points).toLocaleString('vi-VN');
  };

  // Get progress percentage to next tier
  const getNextTierProgress = () => {
    if (!userPoints || userPoints.tier === 'platinum') return 100;
    
    const pointsToNextTier = userPoints.pointsToNextTier || 0;
    let percentage = 0;
    
    switch (userPoints.tier) {
      case 'standard':
        percentage = ((2000 - pointsToNextTier) / 2000) * 100;
        break;
      case 'silver':
        percentage = ((5000 - pointsToNextTier) / 5000) * 100;
        break;
      case 'gold':
        percentage = ((10000 - pointsToNextTier) / 10000) * 100;
        break;
      default:
        percentage = 0;
    }
    
    return Math.min(Math.max(percentage, 0), 100);
  };

  if (!phone) {
    return (
      <div className="points-page">
        <Helmet>
          <title>Điểm Thưởng | ShopDunk</title>
        </Helmet>
        
        <ThanhDinhHuong
          breadcrumbs={[
            { label: 'Trang Chủ', link: '/' },
            { label: 'Điểm Thưởng', link: '/diem-thuong' }
          ]}
        />
        
        <div className="login-required">
          <FontAwesomeIcon icon={faInfoCircle} className="icon" />
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem thông tin điểm thưởng</p>
          <button className="primary-btn" onClick={() => window.location.href = '/login'}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="points-page">
      <Helmet>
        <title>Điểm Thưởng | ShopDunk</title>
      </Helmet>
      
      <ToastContainer position="top-right" />
      
      <ThanhDinhHuong
        breadcrumbs={[
          { label: 'Trang Chủ', link: '/' },
          { label: 'Điểm Thưởng', link: '/diem-thuong' }
        ]}
      />
      
      <div className="points-container">
        {loading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Đang tải thông tin điểm thưởng...</p>
          </div>
        ) : (
          <>
            <div className="points-header" style={{background: getTierColor(userPoints?.tier)}}>
              <div className="user-info">
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faCrown} />
                </div>
                <div className="user-details">
                  <h2>{getUser() || 'Khách hàng'}</h2>
                  <div className="tier-badge">
                    Hạng {getTierName(userPoints?.tier)}
                  </div>
                </div>
              </div>
              
              <div className="points-summary">
                <div className="points-value">
                  <FontAwesomeIcon icon={faCoins} className="points-icon" />
                  <span>{formatPoints(userPoints?.availablePoints || 0)}</span>
                </div>
                <div className="points-label">Điểm khả dụng</div>
              </div>
            </div>
            
            <div className="points-navigation">
              <button 
                className={`nav-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                <FontAwesomeIcon icon={faStar} />
                <span>Tổng quan</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'redeem' ? 'active' : ''}`}
                onClick={() => setActiveTab('redeem')}
              >
                <FontAwesomeIcon icon={faGift} />
                <span>Đổi điểm</span>
              </button>
              <button 
                className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <FontAwesomeIcon icon={faHistory} />
                <span>Lịch sử</span>
              </button>
            </div>
            
            <div className="points-content">
              {activeTab === 'summary' && (
                <div className="tab-content summary-tab">
                  <div className="points-cards">
                    <div className="points-card">
                      <div className="card-header">Điểm của bạn</div>
                      <div className="card-content">
                        <div className="points-stat">
                          <div className="stat-label">Điểm khả dụng</div>
                          <div className="stat-value">{formatPoints(userPoints?.availablePoints || 0)}</div>
                        </div>
                        
                        <div className="points-stat">
                          <div className="stat-label">Tổng điểm đã tích</div>
                          <div className="stat-value">{formatPoints(userPoints?.totalPoints || 0)}</div>
                        </div>
                        
                        {userPoints?.soonExpiringPoints > 0 && (
                          <div className="points-stat points-expiring">
                            <div className="stat-label">Sắp hết hạn (trong 30 ngày)</div>
                            <div className="stat-value">{formatPoints(userPoints.soonExpiringPoints)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="points-card">
                      <div className="card-header">Cấp thành viên</div>
                      <div className="card-content">
                        <div className="tier-info">
                          <div className="current-tier" style={{color: userPoints?.tier === 'standard' ? '#666' : '#0066cc'}}>
                            <FontAwesomeIcon icon={faCrown} />
                            <span>Hạng {getTierName(userPoints?.tier)}</span>
                          </div>
                          
                          {userPoints?.tier !== 'platinum' && (
                            <div className="next-tier-progress">
                              <div className="progress-label">
                                <span>Tiến độ lên hạng {getTierName(userPoints?.nextTier)}</span>
                                <span>{formatPoints(userPoints?.yearToDatePoints || 0)} / {formatPoints(
                                  userPoints?.tier === 'standard' ? 2000 : 
                                  userPoints?.tier === 'silver' ? 5000 : 10000
                                )} điểm</span>
                              </div>
                              <div className="progress-bar">
                                <div 
                                  className="progress-bar-fill" 
                                  style={{width: `${getNextTierProgress()}%`}}
                                ></div>
                              </div>
                              <div className="progress-info">
                                Cần thêm {formatPoints(userPoints?.pointsToNextTier || 0)} điểm để lên hạng tiếp theo
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tier-benefits">
                    <h3>Quyền lợi thành viên</h3>
                    <div className="benefits-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Quyền lợi</th>
                            <th className="standard-col">Tiêu Chuẩn</th>
                            <th className="silver-col">Bạc</th>
                            <th className="gold-col">Vàng</th>
                            <th className="platinum-col">Bạch Kim</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Tỷ lệ tích điểm</td>
                            <td>1đ / 1.000đ</td>
                            <td>1đ / 1.000đ</td>
                            <td>1đ / 1.000đ</td>
                            <td>1đ / 1.000đ</td>
                          </tr>
                          <tr>
                            <td>Quà sinh nhật</td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                          </tr>
                          <tr>
                            <td>Voucher đặc biệt</td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                          </tr>
                          <tr>
                            <td>Ưu đãi riêng</td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="checkmark">✓</span></td>
                            <td><span className="checkmark">✓</span></td>
                          </tr>
                          <tr>
                            <td>Giao hàng ưu tiên</td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="crossmark">✗</span></td>
                            <td><span className="checkmark">✓</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="recent-activity">
                    <h3>Hoạt động gần đây</h3>
                    {userPoints?.history && userPoints.history.length > 0 ? (
                      <div className="activity-list">
                        {userPoints.history.map((item, index) => (
                          <div className="activity-item" key={index}>
                            <div className="activity-date">
                              {moment(item.date).format('DD/MM/YYYY')}
                            </div>
                            <div className="activity-details">
                              <div className="activity-reason">{item.reason}</div>
                              <div className={`activity-points ${item.amount > 0 ? 'positive' : 'negative'}`}>
                                {item.amount > 0 ? '+' : ''}{formatPoints(item.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-activity">
                        <p>Chưa có hoạt động nào gần đây</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'redeem' && (
                <div className="tab-content redeem-tab">
                  <div className="available-points">
                    <span>Điểm khả dụng:</span>
                    <strong>{formatPoints(userPoints?.availablePoints || 0)}</strong>
                  </div>
                  
                  {redemptionOptions.length > 0 ? (
                    <div className="redemption-options">
                      {redemptionOptions.map((option) => (
                        <div className={`redemption-card ${option.isRedeemed && !option.canRedeem ? 'redeemed' : ''}`} key={option._id}>
                          {option.imageUrl && (
                            <div className="redemption-image">
                              <img src={option.imageUrl} alt={option.name} />
                            </div>
                          )}
                          <div className="redemption-details">
                            <h3>{option.name}</h3>
                            {option.description && <p className="description">{option.description}</p>}
                            
                            <div className="voucher-details">
                              <div className="voucher-value">
                                {option.voucherType === 'percentage' 
                                  ? `Giảm ${option.voucherValue}%` 
                                  : option.voucherType === 'fixed'
                                  ? `Giảm ${option.voucherValue.toLocaleString('vi-VN')}đ`
                                  : option.voucherType === 'shipping'
                                  ? 'Miễn phí vận chuyển'
                                  : `Giảm giá sản phẩm ${option.voucherValue}%`
                                }
                              </div>
                              
                              {option.minOrderValue > 0 && (
                                <div className="min-order">
                                  Đơn tối thiểu: {option.minOrderValue.toLocaleString('vi-VN')}đ
                                </div>
                              )}
                            </div>
                            
                            <div className="points-cost">
                              <FontAwesomeIcon icon={faCoins} />
                              <span>{formatPoints(option.pointsCost)} điểm</span>
                            </div>
                          </div>
                          
                          <div className="redemption-action">
                            {option.isRedeemed && !option.canRedeem ? (
                              <button className="redeem-btn disabled">
                                Đã đổi
                              </button>
                            ) : userPoints?.availablePoints < option.pointsCost ? (
                              <button className="redeem-btn disabled">
                                Thiếu điểm
                              </button>
                            ) : (
                              <button 
                                className="redeem-btn" 
                                onClick={() => handleRedeem(option._id)}
                                disabled={loadingRedeem}
                              >
                                {loadingRedeem ? (
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                ) : 'Đổi ngay'}
                              </button>
                            )}
                          </div>
                          
                          {option.availableTiers && option.availableTiers.length > 0 && (
                            <div className="tier-requirements">
                              Dành cho: {option.availableTiers.map(tier => getTierName(tier)).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-options">
                      <p>Hiện không có quà để đổi điểm</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="tab-content history-tab">
                  {redemptionHistory.length > 0 ? (
                    <div className="redemption-history">
                      <table>
                        <thead>
                          <tr>
                            <th>Ngày đổi</th>
                            <th>Voucher</th>
                            <th>Giá trị</th>
                            <th>Điểm đã dùng</th>
                            <th>Trạng thái</th>
                            <th>Hết hạn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptionHistory.map((item) => (
                            <tr key={item._id}>
                              <td>{moment(item.redemptionDate).format('DD/MM/YYYY')}</td>
                              <td>
                                <div className="voucher-name">{item.voucherName}</div>
                                <div className="voucher-code">{item.voucherCode}</div>
                              </td>
                              <td>
                                {item.discountType === 'percentage' 
                                  ? `${item.discountValue}%` 
                                  : item.discountType === 'fixed'
                                  ? `${item.discountValue.toLocaleString('vi-VN')}đ`
                                  : item.discountType === 'shipping'
                                  ? 'Miễn phí vận chuyển'
                                  : `Giảm giá sản phẩm ${item.discountValue}%`
                                }
                                {item.minOrderValue > 0 && (
                                  <div className="min-order-history">
                                    Tối thiểu: {item.minOrderValue.toLocaleString('vi-VN')}đ
                                  </div>
                                )}
                              </td>
                              <td>{formatPoints(item.pointsSpent)}</td>
                              <td>
                                <span className={`status-badge ${item.status}`}>
                                  {item.status === 'active' ? 'Đang hoạt động' : 
                                   item.status === 'used' ? 'Đã sử dụng' : 'Hết hạn'}
                                </span>
                              </td>
                              <td>{moment(item.expiryDate).format('DD/MM/YYYY')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-history">
                      <p>Bạn chưa đổi điểm lần nào</p>
                      <button 
                        className="primary-btn"
                        onClick={() => setActiveTab('redeem')}
                      >
                        Đổi điểm ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserPointsPage;