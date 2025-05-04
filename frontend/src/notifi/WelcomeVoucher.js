import React, { useState, useEffect } from "react";
import { FaGift, FaCopy, FaCheckCircle, FaTimes } from "react-icons/fa";
import "./WelcomeVoucher.scss";

const WelcomeVoucher = ({ voucher, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Debug
    console.log("WelcomeVoucher mounted with voucher:", voucher);

    // Add a short delay to ensure smooth animation
    if (voucher) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [voucher]);

  if (!voucher) {
    console.log("No voucher provided to WelcomeVoucher component");
    return null;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setVisible(false);
    // Add delay to let fade-out animation complete
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  return (
    <div className={`welcome-voucher-overlay ${visible ? "visible" : ""}`}>
      <div className="welcome-voucher-modal">
        <button className="close-button" onClick={handleClose}>
          <FaTimes />
        </button>

        <div className="welcome-voucher-content">
          <div className="welcome-header">
            <FaGift className="gift-icon" />
            <h2>Chào mừng bạn!</h2>
          </div>

          <p className="welcome-message">
            {voucher.message || "Chúc mừng bạn nhận được mã giảm giá!"}
          </p>

          <div className="voucher-details">
            <div className="discount-badge">Giảm {voucher.discount}%</div>

            <div className="voucher-code-container">
              <p className="code-label">Mã giảm giá của bạn:</p>
              <div className="voucher-code">
                <span>{voucher.code}</span>
                <button className="copy-button" onClick={handleCopyCode}>
                  {copied ? (
                    <FaCheckCircle className="copied-icon" />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>
            </div>

            <div className="voucher-info">
              <p>
                Đơn hàng tối thiểu:{" "}
                {voucher.minOrderValue.toLocaleString("vi-VN")}đ
              </p>
              <p>Hết hạn: {voucher.expiresAt}</p>
            </div>
          </div>

          <div className="welcome-actions">
            <button className="use-now-button" onClick={handleClose}>
              Mua sắm ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeVoucher;
