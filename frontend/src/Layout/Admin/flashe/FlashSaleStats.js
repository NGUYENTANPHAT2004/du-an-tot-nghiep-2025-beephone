import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSpinner, 
  faChartBar, 
  faBox, 
  faBoxOpen, 
  faCheck, 
  faExclamationTriangle,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import './FlashSaleStats.scss';

const FlashSaleStats = ({ flashSale, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/admin/flash-sales/${flashSale._id}/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error('Không thể tải thống kê Flash Sale');
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê Flash Sale:', error);
      toast.error('Lỗi khi tải thống kê Flash Sale');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flash-sale-stats">
        <div className="stats-header">
          <h3>Thống kê Flash Sale</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="flash-sale-stats">
        <div className="stats-header">
          <h3>Thống kê Flash Sale</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="no-stats">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Không thể tải thống kê Flash Sale</p>
          <button className="refresh-button" onClick={fetchStats}>
            <FontAwesomeIcon icon={faSpinner} />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flash-sale-stats">
      <div className="stats-header">
        <h3>Thống kê Flash Sale</h3>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="stats-body">
        <div className="sale-info">
          <h4>{stats.name}</h4>
          <div className="sale-dates">
            <span>{moment(stats.startTime).format('DD/MM/YYYY HH:mm')}</span>
            <span> - </span>
            <span>{moment(stats.endTime).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          <div className={`sale-status ${stats.status}`}>
            {stats.status === 'active' ? 'Đang diễn ra' : 
              stats.status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
          </div>
        </div>
        
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBox} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.stats.totalProducts}</div>
              <div className="stat-label">Sản phẩm</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.stats.totalQuantity}</div>
              <div className="stat-label">Tổng số lượng</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.stats.soldQuantity}</div>
              <div className="stat-label">Đã bán</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.stats.soldPercent}%</div>
              <div className="stat-label">Đã bán</div>
            </div>
          </div>
        </div>
        
        <div className="stats-details">
          <div className="stats-section">
            <h5>Trạng thái sản phẩm</h5>
            <div className="status-distribution">
              <div className="status-item">
                <div className="status-label">
                  <div className="status-indicator available"></div>
                  <span>Có sẵn</span>
                </div>
                <div className="status-value">{stats.stats.productStats.available}</div>
              </div>
              
              <div className="status-item">
                <div className="status-label">
                  <div className="status-indicator soldout"></div>
                  <span>Đã hết</span>
                </div>
                <div className="status-value">{stats.stats.productStats.soldout}</div>
              </div>
              
              <div className="status-item">
                <div className="status-label">
                  <div className="status-indicator upcoming"></div>
                  <span>Sắp có</span>
                </div>
                <div className="status-value">{stats.stats.productStats.upcoming}</div>
              </div>
              
              <div className="status-item">
                <div className="status-label">
                  <div className="status-indicator ended"></div>
                  <span>Đã kết thúc</span>
                </div>
                <div className="status-value">{stats.stats.productStats.ended}</div>
              </div>
            </div>
          </div>
          
          <div className="stats-section">
            <h5>Top sản phẩm bán chạy</h5>
            
            {stats.topProducts.length === 0 ? (
              <div className="no-top-products">
                <p>Chưa có sản phẩm nào được bán</p>
              </div>
            ) : (
              <table className="top-products-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đã bán</th>
                    <th>Tỷ lệ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product, index) => (
                    <tr key={product._id}>
                      <td className="product-cell">
                        <div className="product-info">
                          <div className="product-image">
                            <img src={product.image} alt={product.name} />
                          </div>
                          <span className="product-name">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.quantity}</td>
                      <td>{product.soldQuantity}</td>
                      <td>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${product.soldPercent}%` }}
                          ></div>
                          <span className="progress-text">{product.soldPercent}%</span>
                        </div>
                      </td>
                      <td>
                        <div className={`product-status ${product.status}`}>
                          {product.status === 'available' ? 'Còn hàng' : 
                            product.status === 'soldout' ? 'Hết hàng' : 
                            product.status === 'upcoming' ? 'Sắp có' : 'Kết thúc'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <div className="stats-footer">
        <button className="close-btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
};

export default FlashSaleStats;