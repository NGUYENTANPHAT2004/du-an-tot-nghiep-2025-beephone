import React, { useEffect, useState } from 'react';
import './PaySuccess.scss';
import { useNavigate } from 'react-router-dom';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(null); // Trạng thái thanh toán

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsSuccess(true);
      localStorage.removeItem('cart'); // Xóa giỏ hàng nếu thanh toán thành công
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      setIsSuccess(false);
    }
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="payment-success-container">
      <div className="payment-success-content">
        {isSuccess === null ? (
          <p>Đang kiểm tra trạng thái thanh toán...</p>
        ) : isSuccess ? (
          <>
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
          </>
        ) : (
          <>
            <div className="error-icon">
              {/* Biểu tượng X đỏ */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-x-circle"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2>Thanh toán thất bại!</h2>
            <p>Đã có lỗi xảy ra, vui lòng thử lại.</p>
          </>
        )}

        <button className="back-to-home-btn" onClick={handleBackToHome}>
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
