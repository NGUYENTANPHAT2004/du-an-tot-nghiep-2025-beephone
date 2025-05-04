// RedemptionDetailModal.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import './RedemptionDetailModal.scss'; // Tạo file CSS riêng

const RedemptionDetailModal = ({ 
  isOpen, 
  onClose, 
  selectedOption, 
  voucherDetails, 
  userPoints, 
  onConfirm, 
  loadingRedeem 
}) => {
  if (!isOpen || !selectedOption || !voucherDetails) return null;

  return (
    <div className="redemption-modal-backdrop">
      <div className="redemption-modal">
        <div className="redemption-modal-header">
          <h3>Chi tiết quà đổi điểm</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="redemption-modal-content">
          <div className="redemption-details">
            <h4>{selectedOption.name}</h4>
            
            {selectedOption.description && (
              <p className="description">{selectedOption.description}</p>
            )}
            
            <div className="detail-item">
              <span className="label">Mã voucher gốc:</span>
              <span className="value masked-code">XXXXXXXX</span>
            </div>
            
            <div className="detail-item">
              <span className="label">Loại giảm giá:</span>
              <span className="value">
                Giảm {voucherDetails.sophantram}%
              </span>
            </div>
            
            <div className="detail-item">
              <span className="label">Giá trị đơn hàng tối thiểu:</span>
              <span className="value">
                {voucherDetails.minOrderValue > 0 
                  ? `${voucherDetails.minOrderValue.toLocaleString('vi-VN')}đ` 
                  : 'Không giới hạn'}
              </span>
            </div>
            
            {voucherDetails.goldenHourStart && voucherDetails.goldenHourEnd && (
              <div className="detail-item">
                <span className="label">Khung giờ áp dụng:</span>
                <span className="value golden-hour">
                  {voucherDetails.goldenHourStart} - {voucherDetails.goldenHourEnd}
                </span>
              </div>
            )}
            
            {voucherDetails.daysOfWeek && voucherDetails.daysOfWeek.length > 0 && (
              <div className="detail-item">
                <span className="label">Ngày áp dụng:</span>
                <span className="value">
                  {voucherDetails.daysOfWeek.map(day => 
                    ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day]
                  ).join(', ')}
                </span>
              </div>
            )}
            
            <div className="detail-item">
              <span className="label">Hết hạn:</span>
              <span className="value">
                {moment(voucherDetails.ngayketthuc).format('DD/MM/YYYY')}
              </span>
            </div>
            
            <div className="detail-item highlight-item">
              <span className="label">Điểm cần để đổi:</span>
              <span className="value highlight">
                {selectedOption.pointsCost.toLocaleString('vi-VN')}
              </span>
            </div>
            
            <div className="detail-item highlight-item">
              <span className="label">Điểm hiện có:</span>
              <span className={`value ${userPoints.availablePoints < selectedOption.pointsCost ? 'insufficient' : 'sufficient'}`}>
                {userPoints.availablePoints.toLocaleString('vi-VN')}
              </span>
            </div>
            
            <div className="note">
              <FontAwesomeIcon icon={faInfoCircle} />
              <p>Sau khi đổi điểm, bạn sẽ nhận được mã voucher riêng có thể sử dụng khi thanh toán. 
              Mã này chỉ dành riêng cho tài khoản của bạn và không thể dùng chung.</p>
            </div>
          </div>
        </div>
        
        <div className="redemption-modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            className={`confirm-button ${userPoints.availablePoints < selectedOption.pointsCost ? 'disabled' : ''}`} 
            onClick={onConfirm}
            disabled={userPoints.availablePoints < selectedOption.pointsCost || loadingRedeem}
          >
            {loadingRedeem ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác nhận đổi điểm</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedemptionDetailModal;