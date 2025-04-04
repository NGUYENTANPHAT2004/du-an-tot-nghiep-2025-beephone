import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaSearch, FaGift, FaUserShield } from 'react-icons/fa';
import { FaTrashCan } from 'react-icons/fa6';
import './UserLayout.scss';

function UserLayout() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const itemsPerPage = 5;

  // Fetch dữ liệu từ API
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3005/auth/userlist');
      if (response.ok) {
        const users = await response.json();
        setData(users);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // API cập nhật trạng thái user
  const updateUserStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3005/auth/updateStatus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setData((prevData) =>
          prevData.map((user) =>
            user._id === id ? { ...user, status: newStatus } : user
          )
        );
      } else {
        console.error('Cập nhật trạng thái thất bại');
      }
    } catch (error) {
      console.error('Lỗi server:', error);
    }
  };

  // API cập nhật role user
  const updateUserRole = async (id, newRole) => {
    try {
      const response = await fetch(`http://localhost:3005/auth/updateRole/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setData((prevData) =>
          prevData.map((user) =>
            user._id === id ? { ...user, role: newRole } : user
          )
        );
        setShowRoleModal(false);
      } else {
        console.error('Cập nhật role thất bại');
      }
    } catch (error) {
      console.error('Lỗi server:', error);
    }
  };

  // Xử lý bật/tắt trạng thái
  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateUserStatus(id, newStatus);
  };

  // Xử lý mở modal thay đổi role
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  // Xử lý tìm kiếm
  const filteredData = data.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý phân trang
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Hiển thị role bằng tiếng Việt
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'user': return 'Người dùng';
      default: return role;
    }
  };

  // Hiển thị trạng thái bằng tiếng Việt
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Tạm khóa';
      case 'pending': return 'Chờ xác nhận';
      default: return status;
    }
  };

  return (
    <div className="blog_container">
      <div className="nav_chucnang">
        <button className="btn-voucher">
          <FaGift /> Add Voucher
        </button>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            <FaSearch />
          </button>
        </div>
      </div>
      <table className="tablenhap">
        <thead>
          <tr>
            <th>STT</th>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Phương thức</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((item, index) => (
            <tr key={index}>
              <td>{indexOfFirstItem + index + 1}</td>
              <td>{item._id}</td>
              <td>{item.username}</td>
              <td>{item.email}</td>
              <td>{item.socialLogins && (item.socialLogins.google || item.socialLogins.facebook) ? 'Google/Facebook' : 'Email'}</td>
              <td>
                <span className={`role-badge role-${item.role}`}>
                  {getRoleDisplay(item.role)}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${item.status}`}>
                  {getStatusDisplay(item.status)}
                </span>
              </td>
              <td className="action-buttons">
                <button
                  className="btn-role"
                  onClick={() => openRoleModal(item)}
                  title="Thay đổi vai trò"
                >
                  <FaUserShield />
                </button>
                <button
                  className={item.status === 'active' ? 'btn-active' : 'btn-inactive'}
                  onClick={() => toggleStatus(item._id, item.status)}
                  title={item.status === 'active' ? 'Ẩn người dùng' : 'Hiện người dùng'}
                >
                  {item.status === 'active' ? 'ẩn' : 'hiện'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
          Next
        </button>
      </div>

      {/* Modal thay đổi role */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Thay đổi vai trò người dùng</h2>
            <p>Người dùng: {selectedUser.username}</p>
            <p>Email: {selectedUser.email}</p>
            <p>Vai trò hiện tại: {getRoleDisplay(selectedUser.role)}</p>
            
            <div className="role-options">
              <button 
                className={selectedUser.role === 'user' ? 'active' : ''} 
                onClick={() => updateUserRole(selectedUser._id, 'user')}
              >
                Người dùng
              </button>
              <button 
                className={selectedUser.role === 'admin' ? 'active' : ''} 
                onClick={() => updateUserRole(selectedUser._id, 'admin')}
              >
                Quản trị viên
              </button>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRoleModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLayout;