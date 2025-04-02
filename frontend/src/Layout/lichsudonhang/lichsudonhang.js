import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useUserContext } from '../../context/Usercontext';
import './lichsudonhang.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTrash, faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ProductRating from '../../components/ProductRating/ProductRating';
import OrderDetails from './OrderDeatails';

function LichSuDonHangLayout() {
  const { user } = useUserContext();
  const [donHangs, setDonHangs] = useState([]);
  const [selectedDonHang, setSelectedDonHang] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.post('http://localhost:3005/gethoadonuser', {
          userId: user._id,
        });
        // Filter out any orders that might be marked as isDeleted
        const filteredOrders = response.data.hoadons?.filter(order => !order.isDeleted) || [];
        setDonHangs(filteredOrders);
        setError(null);
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
        setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleXemChiTiet = async (idhoadon) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/getchitiethd/${idhoadon}`);
      
      // Kiểm tra response trước khi xử lý
      if (!response.data || !response.data.hoadonsanpham || !Array.isArray(response.data.hoadonsanpham)) {
        console.error('Dữ liệu không hợp lệ từ API:', response.data);
        throw new Error('Dữ liệu đơn hàng không hợp lệ');
      }
      
      try {
        // Nếu đơn hàng có sản phẩm, kiểm tra trạng thái đánh giá cho từng sản phẩm trong đơn hàng này
        if (response.data.hoadonsanpham.length > 0) {
          const ratingStatusPromises = response.data.hoadonsanpham.map(product => 
            axios.get(`http://localhost:3005/order-rating/check`, {
              params: {
                userId: user._id,
                productId: product.idsp,
                orderId: idhoadon
              }
            }).catch(err => {
              console.warn(`Không thể kiểm tra trạng thái đánh giá cho sản phẩm ${product.idsp}:`, err);
              return { data: { hasRated: false } }; // Giá trị mặc định nếu API lỗi
            })
          );
          
          const ratingResults = await Promise.all(ratingStatusPromises);
          
          // Cập nhật trạng thái đánh giá cho từng sản phẩm trong đơn hàng hiện tại
          response.data.hoadonsanpham = response.data.hoadonsanpham.map((product, index) => {
            return {
              ...product,
              idsp: response.data.sanpham?.[index]?.idsp || product.idsp,
              hasRated: ratingResults[index]?.data?.hasRated || false
            };
          });
        }
      } catch (ratingErr) {
        console.error('Lỗi khi kiểm tra trạng thái đánh giá:', ratingErr);
        // Vẫn tiếp tục hiển thị đơn hàng ngay cả khi không thể kiểm tra trạng thái đánh giá
      }
      
      setSelectedDonHang(response.data);
    } catch (error) {
      console.error('Lỗi khi xem chi tiết:', error);
      alert('Có lỗi xảy ra khi tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleXacNhan = async (idhoadon) => {
    try {
      await axios.post(`http://localhost:3005/settrangthai/${idhoadon}`, {
        trangthai: 'Hoàn thành',
      });
      alert('Đơn hàng đã được xác nhận hoàn thành');
      setSelectedDonHang(null);
      // Reload lại danh sách
      refreshOrderList();
    } catch (error) {
      console.error('Lỗi xác nhận đơn:', error);
      alert('Có lỗi xảy ra khi xác nhận đơn hàng.');
    }
  };

  const refreshOrderList = async () => {
    try {
      const refreshed = await axios.post('http://localhost:3005/gethoadonuser', {
        userId: user._id,
      });
      // Filter out any deleted orders
      const filteredOrders = refreshed.data.hoadons?.filter(order => !order.isDeleted) || [];
      setDonHangs(filteredOrders);
    } catch (error) {
      console.error('Lỗi khi làm mới danh sách đơn hàng:', error);
    }
  };

  const confirmDeleteOrder = (idhoadon) => {
    setDeleteOrderId(idhoadon);
    setShowDeleteConfirm(true);
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    
    try {
      setLoading(true);
      await axios.post('http://localhost:3005/deletehoaddon', {
        ids: [deleteOrderId]
      });
      
      // Immediately remove the deleted order from the state
      setDonHangs(prevDonHangs => prevDonHangs.filter(order => order._id !== deleteOrderId));
      
      // If we're deleting the currently viewed order, close the detail view
      if (selectedDonHang && selectedDonHang._id === deleteOrderId) {
        setSelectedDonHang(null);
      }
      
      // Close the dialog and reset state
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
      
    } catch (error) {
      console.error('Lỗi xóa đơn hàng:', error);
      alert('Có lỗi xảy ra khi xóa đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra xem sản phẩm đã được đánh giá chưa (trong đơn hàng cụ thể)
  const checkRatingStatus = async (product, orderId) => {
    try {
      const response = await axios.get(`http://localhost:3005/order-rating/check`, {
        params: {
          userId: user._id,
          productId: product._id || product.idsp,
          orderId: orderId
        }
      });
      
      return response.data.hasRated;
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái đánh giá:', error);
      return false;
    }
  };

  const openRatingModal = async (product) => {
    // Kiểm tra xem sản phẩm đã được đánh giá chưa trong đơn hàng này
    const hasRated = await checkRatingStatus(product, selectedDonHang._id);
    
    if (hasRated) {
      alert('Bạn đã đánh giá sản phẩm này trong đơn hàng!');
      return;
    }
    
    setSelectedProduct(product);
    setRating(0);
    setComment('');
    setRatingError('');
    setRatingModalOpen(true);
  };
  
  const closeRatingModal = () => {
    setSelectedProduct(null);
    setRating(0);
    setComment('');
    setRatingError('');
    setRatingModalOpen(false);
  };

  const submitRating = async () => {
    if (!selectedProduct || !rating) {
      setRatingError('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);
      setRatingError('');

      // Đảm bảo gửi đúng productId và orderId để rating được liên kết đúng
      const response = await axios.post('http://localhost:3005/order-rating', {
        userId: user._id,
        orderId: selectedDonHang._id, // Đơn hàng cụ thể
        productId: selectedProduct.idsp, // ID sản phẩm
        productName: selectedProduct.namesanpham,
        productImage: selectedProduct.image,
        tenkhach: user.tenkhach,
        content: comment,
        rating: rating,
        dungluong: selectedProduct.dungluong,
        mausac: selectedProduct.mausac,
        verified: true
      });

      if (response.data.success) {
        alert('Cảm ơn bạn đã đánh giá sản phẩm!');
        closeRatingModal();
        
        // Cập nhật lại đơn hàng đang xem để hiển thị trạng thái đã đánh giá
        if (selectedDonHang) {
          handleXemChiTiet(selectedDonHang._id);
        }
      } else {
        setRatingError(response.data.message || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Lỗi khi đánh giá:', error);
      setRatingError('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra xem sản phẩm có đủ điều kiện đánh giá không (đơn hàng hoàn thành và chưa đánh giá)
  const canRateProduct = (product, order) => {
    // Chỉ cho phép đánh giá nếu đơn hàng đã hoàn thành hoặc đã giao
    const eligibleStatuses = ['Đã giao hàng', 'Hoàn thành', 'Đã nhận'];
    return eligibleStatuses.includes(order.trangthai) && !product.hasRated;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã thanh toán':
      case 'Hoàn thành':
        return 'status-success';
      case 'Đang xử lý':
      case 'Đang vận chuyển':
        return 'status-pending';
      case 'Hủy Đơn Hàng':
      case 'Thanh toán thất bại':
      case 'Thanh toán hết hạn':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  // Check if the order is eligible for deletion (not completed or paid)
  const canDeleteOrder = (order) => {
    const nonDeletableStatuses = [
      'Hoàn thành',
      'Đã nhận',
      'Đã thanh toán'
    ];
    
    return !nonDeletableStatuses.includes(order.trangthai) || !order.thanhtoan;
  };

  if (loading && donHangs.length === 0) {
    return (
      <div className="lichsu-donhang-container">
        <h2>Lịch sử đơn hàng</h2>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lichsu-donhang-container">
        <h2>Lịch sử đơn hàng</h2>
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lichsu-donhang-container">
      <h2>Lịch sử đơn hàng</h2>

      {donHangs.length === 0 ? (
        <p className="empty-message">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="table-responsive">
          <table className="table-donhang">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày Mua</th>
                <th>Trạng Thái</th>
                <th>Tổng Tiền</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {donHangs.map((hd) => (
                <tr key={hd._id}>
                  <td>{hd.maHDL || (hd._id ? hd._id.slice(-6) : 'N/A')}</td>
                  <td>{moment(hd.ngaymua).format('DD/MM/YYYY')}</td>
                  <td>
                    <span className={`status-indicator ${getStatusClass(hd.trangthai)}`}>
                      {hd.trangthai}
                    </span>
                  </td>
                  <td className="price-column">{hd.tongtien.toLocaleString()}₫</td>
                  <td className="action-buttons">
                    <button className="btn-view" onClick={() => handleXemChiTiet(hd._id)}>
                      <FontAwesomeIcon icon={faReceipt} /> Chi tiết
                    </button>
                    {hd.trangthai === 'Đã thanh toán' && (
                      <button className="btn-confirm" onClick={() => handleXacNhan(hd._id)}>
                        Xác nhận
                      </button>
                    )}
                    {canDeleteOrder(hd) && (
                      <button className="btn-delete" onClick={() => confirmDeleteOrder(hd._id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDonHang && (
        <OrderDetails
          selectedDonHang={selectedDonHang}
          setSelectedDonHang={setSelectedDonHang}
          handleXacNhan={handleXacNhan}
          handleRating={openRatingModal}
          canRateProduct={canRateProduct}
          getStatusClass={getStatusClass}
        />
      )}

      {ratingModalOpen && (
        <div className="rating-modal">
          <div className="rating-content">
            <h3>Đánh giá sản phẩm</h3>
            <div className="product-rating-info">
              <img 
                src={selectedProduct.image || selectedProduct.hinhanh} 
                alt={selectedProduct.namesanpham || selectedProduct.tenSP} 
                className="product-image"
              />
              <div>
                <h4>{selectedProduct.namesanpham || selectedProduct.tenSP}</h4>
                <p>Dung lượng: {selectedProduct.dungluong}</p>
                <p>Màu sắc: {selectedProduct.mausac}</p>
              </div>
            </div>
            <div className="rating-stars">
              <label>Đánh giá của bạn:</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesomeIcon
                    key={star}
                    icon={faStar}
                    className={star <= rating ? 'active' : ''}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <textarea
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {ratingError && <p className="error-message">{ratingError}</p>}
            <div className="rating-actions">
              <button onClick={closeRatingModal} disabled={isSubmitting}>Hủy</button>
              <button 
                onClick={submitRating}
                disabled={!rating || isSubmitting}
                className={!rating || isSubmitting ? 'disabled' : ''}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa đơn hàng này?</p>
            <p className="warning-text">Lưu ý: Hành động này không thể hoàn tác.</p>
            <div className="confirm-buttons">
              <button className="btn-confirm-delete" onClick={handleDeleteOrder}>Xóa đơn hàng</button>
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LichSuDonHangLayout;