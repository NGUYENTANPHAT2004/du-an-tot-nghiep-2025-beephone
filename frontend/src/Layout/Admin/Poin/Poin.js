// Poin.js - Main admin dashboard for loyalty program
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faGift, 
  faChartLine, 
  faUser, 
  faSync, 
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './Poin.scss';

// Import components
import UserPointsManagement from './UserPointsManagement';
import RedemptionOptions from './RedemptionOptions';
import LoyaltyStats from './LoyaltyStats';

function LoyaltyPointsAdminLayout() {
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Get overview stats when component mounts
  useEffect(() => {
    fetchOverviewStats();
  }, []);

  // Fetch overview stats from API
  const fetchOverviewStats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:3005/admin/loyalty/stats');
      
      if (response.data.success) {
        setStats(response.data);
      } else {
        toast.error('Không thể tải thống kê điểm thưởng');
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      toast.error('Lỗi khi tải thống kê điểm thưởng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resetting YTD points yearly
  const handleResetYTDPoints = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đặt lại điểm YTD của tất cả thành viên? Hành động này không thể hoàn tác và chỉ nên thực hiện một lần mỗi năm.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:3005/admin/loyalty/reset-ytd-points');
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchOverviewStats();
      } else {
        toast.error('Không thể đặt lại điểm YTD');
      }
    } catch (error) {
      console.error('Lỗi khi đặt lại điểm YTD:', error);
      toast.error('Lỗi khi đặt lại điểm YTD');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle processing expired points
  const handleProcessExpiredPoints = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xử lý các điểm đã hết hạn?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:3005/admin/loyalty/process-expiring-points');
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchOverviewStats();
      } else {
        toast.error('Không thể xử lý điểm hết hạn');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý điểm hết hạn:', error);
      toast.error('Lỗi khi xử lý điểm hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loyalty-admin-container">
      <ToastContainer position="top-right" />
      <div className="loyalty-admin-header">
        <h2>Quản lý Điểm thưởng ShopDunk</h2>
        
        {/* Stats dashboard */}
        <div className="loyalty-stats-cards">
          <div className="stats-card">
            <div className="card-icon users">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="card-content">
              <h3>{stats?.totalUsers || 0}</h3>
              <p>Thành viên</p>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="card-icon points">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="card-content">
              <h3>{stats?.pointsStats?.totalPointsIssued?.toLocaleString('vi-VN') || 0}</h3>
              <p>Tổng điểm</p>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="card-icon redemptions">
              <FontAwesomeIcon icon={faGift} />
            </div>
            <div className="card-content">
              <h3>{stats?.redemptionStats?.total || 0}</h3>
              <p>Lượt đổi điểm</p>
            </div>
          </div>
        </div>

        {/* Tab menu */}
        <div className="loyalty-admin-tabs">
          <button 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Thành viên</span>
          </button>
          
          <button 
            className={activeTab === 'redemptions' ? 'active' : ''}
            onClick={() => setActiveTab('redemptions')}
          >
            <FontAwesomeIcon icon={faGift} />
            <span>Quà đổi điểm</span>
          </button>
          
          <button 
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Thống kê</span>
          </button>
        </div>
        
        {/* Action buttons */}
        <div className="loyalty-admin-actions">
          <button 
            className="action-button refresh"
            onClick={fetchOverviewStats}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faSync} spin={isLoading} />
            <span>Làm mới</span>
          </button>
          
          <button 
            className="action-button process"
            onClick={handleProcessExpiredPoints}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTrash} />
            <span>Xử lý điểm hết hạn</span>
          </button>
          
          <button 
            className="action-button reset"
            onClick={handleResetYTDPoints}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faSync} />
            <span>Đặt lại điểm YTD</span>
          </button>
        </div>
      </div>

      <div className="loyalty-admin-content">
        {activeTab === 'users' && <UserPointsManagement />}
        {activeTab === 'redemptions' && <RedemptionOptions />}
        {activeTab === 'stats' && <LoyaltyStats stats={stats} refreshStats={fetchOverviewStats} />}
      </div>
    </div>
  );
}

export default LoyaltyPointsAdminLayout;