// LoyaltyStats.js - Statistics and analytics for loyalty program
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faUsers, 
  faStar, 
  faGift, 
  faTrophy, 
  faExchangeAlt,
  faSync,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

const LoyaltyStats = ({ stats: initialStats, refreshStats }) => {
  const [stats, setStats] = useState(initialStats);
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
      generateChartData(initialStats);
    } else {
      fetchStats();
    }
  }, [initialStats]);

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3005/admin/loyalty/stats');
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
        generateChartData(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from actual data
  const generateChartData = (statsData) => {
    if (!statsData || !statsData.pointsHistory) return;
    
    const chartData = {
      labels: statsData.pointsHistory.map(item => moment(item.date).format('MM/YYYY')),
      datasets: [
        {
          name: 'Điểm đã phát',
          data: statsData.pointsHistory.map(item => item.pointsIssued)
        },
        {
          name: 'Điểm đã đổi',
          data: statsData.pointsHistory.map(item => item.pointsRedeemed)
        }
      ]
    };
    
    setChartData(chartData);
  };

  // Fetch statistics by date range
  const fetchStatsByDateRange = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3005/admin/loyalty/stats-by-date', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
        generateChartData(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê theo khoảng thời gian:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date range search
  const handleDateRangeSubmit = (e) => {
    e.preventDefault();
    fetchStatsByDateRange();
  };

  // Render tier distribution
  const renderTierDistribution = () => {
    if (!stats || !stats.tierDistribution) return null;
    
    const tierColors = {
      standard: '#ccc',
      silver: '#A9A9A9',
      gold: '#FFC107',
      platinum: '#3498db'
    };
    
    const total = Object.values(stats.tierDistribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="tier-distribution">
        <div className="distribution-chart">
          {Object.entries(stats.tierDistribution).map(([tier, count]) => {
            const percentage = total > 0 ? (count / total * 100) : 0;
            return (
              <div 
                key={tier} 
                className="chart-bar" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: tierColors[tier]
                }}
                title={`${getTierName(tier)}: ${count} thành viên (${percentage.toFixed(1)}%)`}
              ></div>
            );
          })}
        </div>
        
        <div className="distribution-legend">
          {Object.entries(stats.tierDistribution).map(([tier, count]) => {
            const percentage = total > 0 ? (count / total * 100) : 0;
            return (
              <div key={tier} className="legend-item">
                <span 
                  className="color-box" 
                  style={{ backgroundColor: tierColors[tier] }}
                ></span>
                <span className="tier-name">{getTierName(tier)}</span>
                <span className="tier-count">{count}</span>
                <span className="tier-percentage">({percentage.toFixed(1)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Display tier name
  const getTierName = (tier) => {
    switch (tier) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Bạch Kim';
      default: return 'Tiêu Chuẩn';
    }
  };

  // Render top redemption options
  const renderTopRedemptions = () => {
    if (!stats || !stats.topRedemptions || stats.topRedemptions.length === 0) {
      return (
        <div className="no-data-message">
          <p>Chưa có dữ liệu về quà đổi điểm phổ biến</p>
        </div>
      );
    }
    
    return (
      <div className="top-redemptions">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên quà</th>
              <th>Loại</th>
              <th>Số lượt đổi</th>
              <th>Tổng điểm đã đổi</th>
            </tr>
          </thead>
          <tbody>
            {stats.topRedemptions.map((item, index) => (
              <tr key={item._id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{getVoucherTypeName(item.voucherType)}</td>
                <td>{item.count}</td>
                <td>{item.pointsSpent.toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Display voucher type name
  const getVoucherTypeName = (type) => {
    switch (type) {
      case 'percentage': return 'Giảm %';
      case 'fixed': return 'Giảm tiền';
      case 'shipping': return 'Miễn phí vận chuyển';
      case 'product': return 'Giảm giá sản phẩm';
      default: return 'Khác';
    }
  };

  // If no statistics data
  if (!stats) {
    return (
      <div className="loyalty-stats">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loyalty-stats">
      {/* Filter by date range */}
      <div className="date-range-filter">
        <h4>
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Lọc theo khoảng thời gian</span>
        </h4>
        <form onSubmit={handleDateRangeSubmit}>
          <div className="date-inputs">
            <div className="input-group">
              <label>Từ ngày:</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                max={dateRange.endDate}
              />
            </div>
            <div className="input-group">
              <label>Đến ngày:</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                min={dateRange.startDate}
                max={moment().format('YYYY-MM-DD')}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSync} />
            )}
            <span>Cập nhật</span>
          </button>
        </form>
      </div>

      {/* Points statistics */}
      <div className="stats-section">
        <h4>
          <FontAwesomeIcon icon={faStar} />
          <span>Thống kê điểm thưởng</span>
        </h4>
        
        <div className="stats-cards">
          <div className="stats-card">
            <div className="card-title">Tổng điểm đã phát hành</div>
            <div className="card-value">{stats.pointsStats?.totalPointsIssued?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Điểm còn khả dụng</div>
            <div className="card-value">{stats.pointsStats?.totalPointsAvailable?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Điểm đã đổi</div>
            <div className="card-value">{stats.pointsStats?.pointsRedeemed?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Điểm đã hết hạn</div>
            <div className="card-value">{stats.pointsStats?.pointsExpiredOrAdjusted?.toLocaleString('vi-VN') || 0}</div>
          </div>
        </div>
      </div>

      {/* Member statistics */}
      <div className="stats-section">
        <h4>
          <FontAwesomeIcon icon={faUsers} />
          <span>Phân phối thành viên theo cấp</span>
        </h4>
        
        {renderTierDistribution()}
      </div>

      {/* Top redemption options */}
      <div className="stats-section">
        <h4>
          <FontAwesomeIcon icon={faTrophy} />
          <span>Top quà đổi điểm phổ biến</span>
        </h4>
        
        {renderTopRedemptions()}
      </div>

      {/* Points trend chart */}
      <div className="stats-section">
        <h4>
          <FontAwesomeIcon icon={faExchangeAlt} />
          <span>Xu hướng điểm thưởng</span>
        </h4>
        
        {chartData ? (
          <div className="chart-container">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="color-box issued"></span>
                <span>Điểm đã phát</span>
              </div>
              <div className="legend-item">
                <span className="color-box redeemed"></span>
                <span>Điểm đã đổi</span>
              </div>
            </div>
            
            <div className="chart">
              <div className="chart-bars">
                {chartData.labels.map((label, index) => (
                  <div key={label} className="chart-column">
                    <div className="column-label">{label}</div>
                    <div className="column-bars">
                      <div 
                        className="bar issued" 
                        style={{ height: `${chartData.datasets[0].data[index] / 30000 * 200}px` }}
                        title={`Điểm đã phát: ${chartData.datasets[0].data[index].toLocaleString('vi-VN')}`}
                      ></div>
                      <div 
                        className="bar redeemed" 
                        style={{ height: `${chartData.datasets[1].data[index] / 30000 * 200}px` }}
                        title={`Điểm đã đổi: ${chartData.datasets[1].data[index].toLocaleString('vi-VN')}`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-axis">
                <div className="axis-label">30,000</div>
                <div className="axis-label">20,000</div>
                <div className="axis-label">10,000</div>
                <div className="axis-label">0</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Đang tải biểu đồ...</p>
          </div>
        )}
      </div>

      {/* Redemption statistics */}
      <div className="stats-section">
        <h4>
          <FontAwesomeIcon icon={faGift} />
          <span>Thống kê đổi điểm</span>
        </h4>
        
        <div className="stats-cards">
          <div className="stats-card">
            <div className="card-title">Tổng lượt đổi điểm</div>
            <div className="card-value">{stats.redemptionStats?.total?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Voucher đang hoạt động</div>
            <div className="card-value">{stats.redemptionStats?.active?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Voucher đã sử dụng</div>
            <div className="card-value">{stats.redemptionStats?.used?.toLocaleString('vi-VN') || 0}</div>
          </div>
          <div className="stats-card">
            <div className="card-title">Voucher đã hết hạn</div>
            <div className="card-value">{stats.redemptionStats?.expired?.toLocaleString('vi-VN') || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyStats;