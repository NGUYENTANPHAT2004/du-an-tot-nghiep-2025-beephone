import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faReceipt, faTimes, faCheck, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import ProductRating from '../../components/ProductRating/ProductRating';

// This is just the order details section - to be included in the lichsudonhang.js file
const OrderDetails = ({ 
  selectedDonHang, 
  setSelectedDonHang, 
  handleXacNhan, 
  handleRating, 
  canRateProduct,
  getStatusClass 
}) => {
  if (!selectedDonHang) return null;
  
  return (
    <div className="chitiet-donhang">
      <div className="chitiet-header">
        <h3>
          Chi tiết đơn hàng 
          <span className="order-id">{selectedDonHang.maHDL || (selectedDonHang._id ? selectedDonHang._id.slice(-6) : 'N/A')}</span>
        </h3>
        <span className={`status-badge ${getStatusClass(selectedDonHang.trangthai)}`}>
          {selectedDonHang.trangthai}
        </span>
      </div>
      
      <div className="order-info">
        <div className="info-group">
          <p><strong>Người nhận</strong> <span>{selectedDonHang.nguoinhan}</span></p>
          <p><strong>Số điện thoại</strong> <span>{selectedDonHang.phone}</span></p>
          <p><strong>Địa chỉ</strong> <span>{selectedDonHang.address || 'N/A'}</span></p>
        </div>
        <div className="info-group">
          <p>
            <strong>Ngày đặt</strong> 
            <span>{moment(selectedDonHang.ngaymua).format('DD/MM/YYYY')}</span>
          </p>
          <p>
            <strong>Thanh toán</strong> 
            <span>
              {selectedDonHang.thanhtoan ? (
                <span className="payment-status paid">
                  <FontAwesomeIcon icon={faCheck} /> Đã thanh toán
                </span>
              ) : (
                <span className="payment-status unpaid">
                  <FontAwesomeIcon icon={faTimes} /> Chưa thanh toán
                </span>
              )}
            </span>
          </p>
          <p><strong>Ghi chú</strong> <span>{selectedDonHang.ghichu || 'Không có'}</span></p>
        </div>
      </div>
      
      <div className="product-list-header">
        <h4>Sản phẩm trong đơn hàng</h4>
      </div>
      
      <ul className="product-list">
        {selectedDonHang.hoadonsanpham.map((sp, index) => (
          <li key={index} className="product-item">
            <div className="product-content">
              {/* Thêm hình ảnh sản phẩm nếu có */}
              {sp.image && (
                <img 
                  src={sp.image} 
                  alt={sp.namesanpham} 
                  className="product-image" 
                />
              )}
              <div className="product-details">
                <span className="product-name">{sp.namesanpham}</span>
                <span className="product-variant">{sp.dungluong} - {sp.mausac}</span>
                <div className="product-price-row">
                  <span className="product-quantity">SL: {sp.soluong}</span>
                  <span className="product-price">{sp.price.toLocaleString()}₫</span>
                </div>
                
                {/* Show rating button only if the order status allows it and product is not already rated */}
                {canRateProduct(sp, selectedDonHang) && (
                  <div className="product-rating-section">
                    <ProductRating productId={sp.idsp} size="small" showCount={false} />
                    <button 
                      className="btn-rating" 
                      onClick={() => handleRating(sp)}
                    >
                      <FontAwesomeIcon icon={faStar} /> 
                      Đánh giá
                    </button>
                  </div>
                )}
                
                {/* Show "rated" badge if product has been rated */}
                {sp.hasRated && (
                  <div className="product-rating-section completed">
                    <span className="rating-completed">
                      <FontAwesomeIcon icon={faCheck} /> Đã đánh giá
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="order-total">
        <div className="order-summary">
          {selectedDonHang.magiamgia && (
            <div className="summary-item discount">
              <span>Giảm giá:</span>
              <span>-{((selectedDonHang.giagoc || 0) - selectedDonHang.tongtien).toLocaleString()}₫</span>
            </div>
          )}
        </div>
        <p><strong>Tổng cộng:</strong> <span className="total-price">{selectedDonHang.tongtien.toLocaleString()}₫</span></p>
      </div>
      
      <div className="action-row">
        <button className="btn-close" onClick={() => setSelectedDonHang(null)}>
          <FontAwesomeIcon icon={faTimes} /> Đóng
        </button>
        {selectedDonHang.trangthai === 'Đã thanh toán' && (
          <button className="btn-confirm" onClick={() => handleXacNhan(selectedDonHang._id)}>
            <FontAwesomeIcon icon={faCheck} /> Xác nhận đã nhận
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;