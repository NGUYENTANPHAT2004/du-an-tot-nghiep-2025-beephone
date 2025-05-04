// FlashSaleAdmin.js - Component quản lý Flash Sale cho Admin
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faChartBar, 
  faToggleOn, 
  faToggleOff, 
  faClock,
  faCalendarAlt,
  faInfoCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FlashSaleAdmin.scss';
import FlashSaleForm from './FlashSaleForm';
import FlashSaleStats from './FlashSaleStats';

const FlashSaleAdmin = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Flash Sales
  useEffect(() => {
    fetchFlashSales();
  }, [filter, page, refreshTrigger]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/admin/flash-sales?status=${filter}&page=${page}&limit=10`);
      
      if (response.data.success) {
        setFlashSales(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        toast.error('Không thể tải danh sách Flash Sale');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách Flash Sale:', error);
      toast.error('Lỗi khi tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlashSale = () => {
    setSelectedFlashSale(null);
    setEditMode(false);
    setShowForm(true);
    setShowStats(false);
  };

  const handleEditFlashSale = (flashSale) => {
    setSelectedFlashSale(flashSale);
    setEditMode(true);
    setShowForm(true);
    setShowStats(false);
  };

  const handleViewStats = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/admin/flash-sales/${id}`);
      
      if (response.data.success) {
        setSelectedFlashSale(response.data.data);
        setShowStats(true);
        setShowForm(false);
      } else {
        toast.error('Không thể tải thông tin Flash Sale');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin Flash Sale:', error);
      toast.error('Lỗi khi tải thông tin Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlashSale = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Flash Sale này?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:3005/admin/flash-sales/${id}`);
      
      if (response.data.success) {
        toast.success('Xóa Flash Sale thành công');
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error('Không thể xóa Flash Sale');
      }
    } catch (error) {
      console.error('Lỗi khi xóa Flash Sale:', error);
      toast.error('Lỗi khi xóa Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(`http://localhost:3005/admin/flash-sales/${id}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error('Không thể thay đổi trạng thái Flash Sale');
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái Flash Sale:', error);
      toast.error('Lỗi khi thay đổi trạng thái Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Format thời gian còn lại
  const formatRemainingTime = (startTime, endTime) => {
    const now = new Date();
    if (now < new Date(startTime)) {
      // Sắp diễn ra
      const diff = moment(startTime).diff(moment());
      const duration = moment.duration(diff);
      return `Còn ${duration.days()}d ${duration.hours()}h để bắt đầu`;
    } else if (now < new Date(endTime)) {
      // Đang diễn ra
      const diff = moment(endTime).diff(moment());
      const duration = moment.duration(diff);
      return `Còn ${duration.hours()}h ${duration.minutes()}m để kết thúc`;
    } else {
      // Đã kết thúc
      return 'Đã kết thúc';
    }
  };

  // Render badge trạng thái
  const renderStatusBadge = (startTime, endTime, isActive) => {
    const now = new Date();
    
    if (!isActive) {
      return <span className="status-badge inactive">Không hoạt động</span>;
    }
    
    if (now < new Date(startTime)) {
      return <span className="status-badge upcoming">Sắp diễn ra</span>;
    } else if (now < new Date(endTime)) {
      return <span className="status-badge active">Đang diễn ra</span>;
    } else {
      return <span className="status-badge ended">Đã kết thúc</span>;
    }
  };

  // Tính tiến độ bán hàng
  const calculateProgress = (flashSale) => {
    const soldQuantity = flashSale.soldQuantity || 0;
    const totalQuantity = flashSale.totalQuantity || 1;
    return Math.min(Math.round((soldQuantity / totalQuantity) * 100), 100);
  };

  return (
    <div className="flash-sale-admin">
      <ToastContainer position="top-right" />
      
      <div className="header">
        <h2>Quản lý Flash Sale</h2>
        <button className="create-button" onClick={handleCreateFlashSale}>
          <FontAwesomeIcon icon={faPlus} />
          <span>Tạo Flash Sale mới</span>
        </button>
      </div>
      
      <div className="filter-section">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          Tất cả
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterChange('active')}
        >
          Đang diễn ra
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleFilterChange('upcoming')}
        >
          Sắp diễn ra
        </button>
        <button 
          className={`filter-btn ${filter === 'ended' ? 'active' : ''}`}
          onClick={() => handleFilterChange('ended')}
        >
          Đã kết thúc
        </button>
      </div>
      
      {loading && flashSales.length === 0 ? (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : flashSales.length === 0 ? (
        <div className="no-flash-sales">
          <FontAwesomeIcon icon={faInfoCircle} />
          <p>Không có Flash Sale nào {filter !== 'all' ? `(${filter})` : ''}</p>
          <button className="create-button" onClick={handleCreateFlashSale}>
            Tạo Flash Sale mới
          </button>
        </div>
      ) : (
        <div className="flash-sales-table">
          <table>
            <thead>
              <tr>
                <th>Tên Flash Sale</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Sản phẩm</th>
                <th>Tiến độ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {flashSales.map(flashSale => (
                <tr key={flashSale._id}>
                  <td className="name-cell">{flashSale.name}</td>
                  <td className="time-cell">
                    <div className="time-info">
                      <div className="time-range">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>{moment(flashSale.startTime).format('DD/MM/YYYY HH:mm')}</span>
                        <span> - </span>
                        <span>{moment(flashSale.endTime).format('DD/MM/YYYY HH:mm')}</span>
                      </div>
                      <div className="remaining-time">
                        <FontAwesomeIcon icon={faClock} />
                        <span>{formatRemainingTime(flashSale.startTime, flashSale.endTime)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="status-cell">
                    {renderStatusBadge(flashSale.startTime, flashSale.endTime, flashSale.isActive)}
                  </td>
                  <td className="products-cell">
                    <div className="products-info">
                      <div className="total-products">{flashSale.totalProducts} sản phẩm</div>
                      <div className="products-qty">
                        Đã bán: {flashSale.soldQuantity}/{flashSale.totalQuantity}
                      </div>
                    </div>
                  </td>
                  <td className="progress-cell">
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${calculateProgress(flashSale)}%` }}
                      ></div>
                      <span className="progress-text">{calculateProgress(flashSale)}%</span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn stats"
                      onClick={() => handleViewStats(flashSale._id)}
                      title="Xem thống kê"
                    >
                      <FontAwesomeIcon icon={faChartBar} />
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditFlashSale(flashSale)}
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="action-btn toggle"
                      onClick={() => handleToggleStatus(flashSale._id, flashSale.isActive)}
                      title={flashSale.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      <FontAwesomeIcon icon={flashSale.isActive ? faToggleOn : faToggleOff} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteFlashSale(flashSale._id)}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={page === idx + 1 ? 'active' : ''}
              onClick={() => setPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      )}
      
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FlashSaleForm 
              isEdit={editMode}
              flashSale={selectedFlashSale}
              onClose={() => setShowForm(false)}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      )}
      
      {showStats && selectedFlashSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FlashSaleStats
              flashSale={selectedFlashSale}
              onClose={() => setShowStats(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSaleAdmin;