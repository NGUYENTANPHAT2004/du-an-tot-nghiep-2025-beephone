// UserPointsManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHistory, faSpinner, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

const UserPointsManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [userDetailsMap, setUserDetailsMap] = useState({});
  const itemsPerPage = 10;

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch user points accounts
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3005/admin/loyalty/users');
      
      if (response.data && response.data.success) {
        const userPointsData = response.data.data;
        setUsers(userPointsData);
        setSearchResults(userPointsData);
        
        // Lấy danh sách userId để fetch thông tin chi tiết
        const userIds = userPointsData
          .filter(user => user.userId)
          .map(user => user.userId);
        
        if (userIds.length > 0) {
          fetchUserDetails(userIds);
        }
      } else {
        toast.error('Không thể tải danh sách thành viên');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách thành viên:', error);
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userIds) => {
    try {
      const response = await axios.get('http://localhost:3005/auth/userlist');
      
      if (response.data) {
        // Tạo map từ dữ liệu user trả về
        const detailsMap = {};
        response.data.forEach(user => {
          if (user._id) {
            detailsMap[user._id] = user;
          }
        });
        
        setUserDetailsMap(detailsMap);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin chi tiết người dùng:', error);
    }
  };

  // Filter search results when searchTerm changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(users);
    } else {
      // Tìm kiếm cục bộ
      filterResults();
    }
  }, [searchTerm, users, userDetailsMap]);

  // Filter results locally
  const filterResults = () => {
    const term = searchTerm.trim().toLowerCase();
    const results = users.filter(user => {
      // Tìm theo phone, email
      const phoneMatch = user.phone && user.phone.toLowerCase().includes(term);
      const emailMatch = user.email && user.email.toLowerCase().includes(term);
      
      // Tìm theo tên người dùng từ userDetailsMap
      let nameMatch = false;
      if (user.userId && userDetailsMap[user.userId]) {
        const userDetail = userDetailsMap[user.userId];
        const userName = userDetail.username || '';
        nameMatch = userName.toLowerCase().includes(term);
      }
      
      return phoneMatch || emailMatch || nameMatch;
    });
    
    setSearchResults(results);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchTerm.trim() === '') {
      setSearchResults(users);
      return;
    }
    
    // Check if local filtering found results
    if (searchResults.length > 0) {
      return; // Local filtering worked, no need to query API
    }
    
    // If no local results, search through API
    searchUserByTerm(searchTerm.trim());
  };

  // Search user by term via API
  const searchUserByTerm = async (term) => {
    try {
      setLoading(true);
      
      // First try searching by username
      const userResponse = await axios.get(`http://localhost:3005/admin/loyalty/search?term=${encodeURIComponent(term)}`);
      
      if (userResponse.data && userResponse.data.success && userResponse.data.data.length > 0) {
        // Add the new user details to our map
        const newDetailsMap = { ...userDetailsMap };
        userResponse.data.userDetails.forEach(user => {
          newDetailsMap[user._id] = user;
        });
        setUserDetailsMap(newDetailsMap);
        
        // Add the points data to our list
        setUsers(prevUsers => {
          // Avoid duplicates
          const newUsers = userResponse.data.data.filter(
            newUser => !prevUsers.some(user => user._id === newUser._id)
          );
          return [...prevUsers, ...newUsers];
        });
        
        setSearchResults(userResponse.data.data);
      } else {
        toast.info('Không tìm thấy thành viên với từ khóa này');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm thành viên:', error);
      toast.error('Lỗi khi tìm kiếm thành viên');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Open points history modal
  const openHistoryModal = async (user) => {
    setSelectedUser(user);
    fetchPointsHistory(user);
    setHistoryModalOpen(true);
  };

  // Fetch points history
  const fetchPointsHistory = async (user) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/admin/loyalty/user-points-history/${user._id}`);
      
      if (response.data && response.data.success) {
        setPointsHistory(response.data.data);
      } else {
        toast.error('Không thể tải lịch sử điểm thưởng');
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử điểm thưởng:', error);
      toast.error('Không thể tải lịch sử điểm thưởng');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const paginatedResults = searchResults.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);

  // Display tier name
  const getTierName = (tier) => {
    switch (tier) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Bạch Kim';
      default: return 'Tiêu Chuẩn';
    }
  };

  // Display transaction type
  const getTransactionType = (type) => {
    switch (type) {
      case 'earned': return 'Tích điểm';
      case 'redeemed': return 'Đổi điểm';
      case 'adjusted': return 'Điều chỉnh';
      case 'expired': return 'Hết hạn';
      default: return 'Khác';
    }
  };

  // Get username from userDetailsMap
  const getUserName = (userId) => {
    if (!userId || !userDetailsMap[userId]) return 'N/A';
    return userDetailsMap[userId].username || 'N/A';
  };

  return (
    <div className="user-points-management">
      <div className="search-section">
        <h3>Tìm kiếm thành viên</h3>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )}
            <span>Tìm kiếm</span>
          </button>
        </form>
      </div>

      <div className="results-section">
        <h3>Danh sách thành viên ({searchResults.length})</h3>
        
        {loading && searchResults.length === 0 ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="no-results">
            <p>Không tìm thấy thành viên nào</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tên người dùng</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Tổng điểm</th>
                    <th>Điểm khả dụng</th>
                    <th>Hạng thành viên</th>
                    <th>Cập nhật lần cuối</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-name">
                          <FontAwesomeIcon icon={faUser} className="user-icon" />
                          <span>{getUserName(user.userId)}</span>
                        </div>
                      </td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td>{user.totalPoints.toLocaleString('vi-VN')}</td>
                      <td>{user.availablePoints.toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`tier-badge ${user.tier}`}>
                          {getTierName(user.tier)}
                        </span>
                      </td>
                      <td>{moment(user.lastUpdated).format('DD/MM/YYYY')}</td>
                      <td>
                        <button 
                          className="action-button history"
                          onClick={() => openHistoryModal(user)}
                        >
                          <FontAwesomeIcon icon={faHistory} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(1)} 
                  disabled={page === 1}
                >
                  &laquo;
                </button>
                <button 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                  disabled={page === 1}
                >
                  &lt;
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setPage(index + 1)}
                    className={page === index + 1 ? 'active' : ''}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={page === totalPages}
                >
                  &gt;
                </button>
                <button 
                  onClick={() => setPage(totalPages)} 
                  disabled={page === totalPages}
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Points history modal */}
      {historyModalOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Lịch sử điểm thưởng</h3>
              <button 
                className="close-button"
                onClick={() => setHistoryModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-info">
                <p><strong>Tên người dùng:</strong> {getUserName(selectedUser.userId)}</p>
                <p><strong>Số điện thoại:</strong> {selectedUser.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p><strong>Điểm hiện tại:</strong> {selectedUser.availablePoints.toLocaleString('vi-VN')}</p>
                <p><strong>Hạng thành viên:</strong> {getTierName(selectedUser.tier)}</p>
              </div>
              
              {loading ? (
                <div className="loading-container">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <p>Đang tải lịch sử điểm...</p>
                </div>
              ) : pointsHistory.length === 0 ? (
                <div className="no-results">
                  <p>Chưa có lịch sử điểm thưởng</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Loại</th>
                        <th>Số điểm</th>
                        <th>Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsHistory.map((history, index) => (
                        <tr key={index}>
                          <td>{moment(history.date).format('DD/MM/YYYY')}</td>
                          <td>{getTransactionType(history.type)}</td>
                          <td className={history.amount >= 0 ? 'positive' : 'negative'}>
                            {history.amount >= 0 ? '+' : ''}{history.amount.toLocaleString('vi-VN')}
                          </td>
                          <td>{history.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="submit"
                onClick={() => setHistoryModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPointsManagement;