// VoucherResultModal.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import './VoucherResultModal.scss';

const VoucherResultModal = ({ isOpen, onClose, voucher, onSave }) => {
  if (!isOpen || !voucher) return null;

  return (
    <div className="voucher-modal-backdrop">
      <div className="voucher-modal">
        <div className="voucher-modal-header">
          <h3>Đổi điểm thành công!</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="voucher-modal-content">
          <div className="voucher-card">
            <div className="voucher-code">
              <h4>Mã voucher của bạn:</h4>
              <div className="code">{voucher.code}</div>
            </div>
            
            <div className="voucher-details">
              <div className="detail-item">
                <span className="label">Giá trị:</span>
                <span className="value">{voucher.type === 'percentage' 
                  ? `${voucher.value}%` 
                  : `${Number(voucher.value).toLocaleString('vi-VN')}đ`}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Giá trị đơn hàng tối thiểu:</span>
                <span className="value">{Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Hạn sử dụng:</span>
                <span className="value">{moment(voucher.expiryDate).format('DD/MM/YYYY')}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Điểm đã dùng:</span>
                <span className="value">{voucher.pointsUsed}</span>
              </div>
            </div>
            
            <div className="voucher-instructions">
              <p>Vui lòng lưu lại mã voucher này để sử dụng khi thanh toán. 
              Bạn cũng có thể xem lại mã này trong lịch sử đổi điểm.</p>
            </div>
          </div>
        </div>
        
        <div className="voucher-modal-footer">
          <button className="save-button" onClick={onSave}>
            <FontAwesomeIcon icon={faCopy} />
            <span>Sao chép mã và đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherResultModal;