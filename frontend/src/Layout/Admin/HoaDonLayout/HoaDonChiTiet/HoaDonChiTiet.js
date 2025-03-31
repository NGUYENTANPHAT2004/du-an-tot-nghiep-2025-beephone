/* eslint-disable react-hooks/exhaustive-deps */
import { ModalBig } from '../../../../components/ModalBig'
import { useState, useEffect } from 'react'
import './HoaDonChiTiet.scss'
import axios from 'axios';

function HoaDonChiTiet ({ isOpen, onClose, idhoadon }) {
  const [hoadon, setHoadon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHoaDon = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/getchitiethd/${idhoadon}`);
        setHoadon(response.data);
      } catch (error) {
        console.error('Error fetching hóa đơn:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && idhoadon) {
      fetchHoaDon();
    }
  }, [idhoadon, isOpen]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã thanh toán':
      case 'Hoàn thành':
        return 'success';
      case 'Đang xử lý':
        return 'pending';
      case 'Thanh toán thất bại':
      case 'Thanh toán hết hạn':
        return 'failed';
      case 'Hủy Đơn Hàng':
        return 'cancelled';
      default:
        return '';
    }
  };

  return (
    <ModalBig isOpen={isOpen} onClose={onClose} title="Chi tiết đơn hàng">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : !hoadon ? (
        <div className="error">Không tìm thấy hóa đơn</div>
      ) : (
        <div className="chi-tiet-hoa-don">
          <div className="header">
            <h1>Đơn hàng #{idhoadon}</h1>
            <div className={`status ${getStatusClass(hoadon.trangthai)}`}>
              {hoadon.trangthai}
            </div>
          </div>

          <div className="order-info">
            <div className="info-section">
              <h3>Thông tin người nhận</h3>
              <div className="info-item">
                <span>Họ tên:</span>
                <span>{hoadon.nguoinhan}</span>
              </div>
              <div className="info-item">
                <span>Số điện thoại:</span>
                <span>{hoadon.phone}</span>
              </div>
              <div className="info-item">
                <span>Địa chỉ:</span>
                <span>{hoadon.address || 'N/A'}</span>
              </div>
            </div>

            <div className="info-section">
              <h3>Thông tin đơn hàng</h3>
              <div className="info-item">
                <span>Ngày đặt:</span>
                <span>{hoadon.ngaymua}</span>
              </div>
              <div className="info-item">
                <span>Mã đơn hàng:</span>
                <span>#{idhoadon}</span>
              </div>
              <div className="info-item">
                <span>Phương thức thanh toán:</span>
                <span>{hoadon.thanhtoan ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Dung lượng</th>
                  <th>Màu sắc</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {hoadon.hoadonsanpham.map((sanpham, index) => (
                  <tr key={index}>
                    <td>
                      <div className="product-info">
                        <div className="product-details">
                          <h4>{sanpham.namesanpham}</h4>
                        </div>
                      </div>
                    </td>
                    <td>{sanpham.dungluong}</td>
                    <td>{sanpham.mausac}</td>
                    <td className="quantity">{sanpham.soluong}</td>
                    <td className="price">{sanpham.price.toLocaleString()}đ</td>
                    <td className="price">
                      {(sanpham.price * sanpham.soluong).toLocaleString()}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="order-summary">
            <div className="summary-item">
              <span>Tạm tính:</span>
              <span>{hoadon.tongtien.toLocaleString()}đ</span>
            </div>
            {hoadon.magiamgia && (
              <div className="summary-item">
                <span>Mã giảm giá:</span>
                <span>{hoadon.magiamgia}</span>
              </div>
            )}
            <div className="summary-item total">
              <span>Tổng cộng:</span>
              <span>{hoadon.tongtien.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="actions">
            <button className="primary">In hóa đơn</button>
            <button className="secondary" onClick={onClose}>Đóng</button>
          </div>
        </div>
      )}
    </ModalBig>
  );
}

export default HoaDonChiTiet; 
