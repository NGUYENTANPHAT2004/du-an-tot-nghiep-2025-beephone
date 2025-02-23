import React from 'react';
import './PaySuccess.scss';
import { useNavigate } from 'react-router-dom';

function PaymentSuccess() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    // Xóa toàn bộ dữ liệu trong localStorage
    localStorage.clear();
    // Điều hướng về trang chủ
    navigate('/');
  };

  return (
    <div className="payment-success-container">
      <div className="payment-success-content">
        <div className="checkmark-icon">
          {/* Biểu tượng tích xanh */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-check-circle"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h2>Thanh toán thành công!</h2>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
        <button className="back-to-home-btn" onClick={handleBackToHome}>
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
