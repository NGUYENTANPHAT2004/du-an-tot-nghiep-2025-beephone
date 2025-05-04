import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faClock,
  faTimes,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { useFlashSale } from "../context/Flashecontext";
import moment from "moment";
import "./flashenotification.scss";

const FlashSaleNotification = () => {
  const {
    upcomingFlashSales,
    hasNewFlashSale,
    markNewFlashSaleSeen,
    calculateTimeUntilNextFlashSale,
  } = useFlashSale();

  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Tự động mở thông báo nếu có Flash Sale mới và người dùng chưa tương tác
  useEffect(() => {
    if (hasNewFlashSale && !hasInteracted && upcomingFlashSales.length > 0) {
      const timeoutId = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // Mở sau 3 giây

      return () => clearTimeout(timeoutId);
    }
  }, [hasNewFlashSale, upcomingFlashSales, hasInteracted]);

  // Cập nhật countdown mỗi giây
  useEffect(() => {
    if (!isOpen) return;

    const calculateCountdown = () => {
      const nextFlashSaleInfo = calculateTimeUntilNextFlashSale();
      if (!nextFlashSaleInfo) {
        setCountdown(null);
        return false;
      }

      setCountdown(nextFlashSaleInfo);
      return true;
    };

    // Tính toán ban đầu
    const isValid = calculateCountdown();
    if (!isValid) return;

    // Cập nhật mỗi phút
    const intervalId = setInterval(() => {
      const isStillValid = calculateCountdown();
      if (!isStillValid) {
        clearInterval(intervalId);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isOpen, calculateTimeUntilNextFlashSale]);

  // Nếu không có Flash Sale sắp diễn ra, không hiển thị gì
  if (upcomingFlashSales.length === 0) {
    return null;
  }

  // Xử lý đóng thông báo
  const handleClose = () => {
    setIsOpen(false);
    setHasInteracted(true);
    markNewFlashSaleSeen();
  };

  // Xử lý khi click vào thông báo
  const handleClick = () => {
    setHasInteracted(true);
    markNewFlashSaleSeen();
  };

  if (!isOpen) {
    // Nếu thông báo đang đóng, hiển thị nút nhỏ để mở
    return (
      <div
        className={`notification-toggle ${hasNewFlashSale ? "has-new" : ""}`}
        onClick={() => setIsOpen(true)}
      >
        <FontAwesomeIcon icon={hasNewFlashSale ? faBell : faBolt} />
        {hasNewFlashSale && <span className="notification-dot"></span>}
      </div>
    );
  }

  // Hiển thị thông báo Flash Sale sắp diễn ra
  return (
    <div className="flash-sale-notification">
      <button className="close-button" onClick={handleClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>

      <div className="notification-content">
        <div className="notification-icon">
          <FontAwesomeIcon icon={faBolt} />
        </div>

        <div className="notification-info">
          <h3>Flash Sale sắp diễn ra!</h3>

          {countdown && (
            <div className="notification-time">
              <FontAwesomeIcon icon={faClock} />
              <span>
                {countdown.days > 0 ? `${countdown.days} ngày ` : ""}
                {countdown.hours > 0 ? `${countdown.hours} giờ ` : ""}
                {countdown.minutes > 0 ? `${countdown.minutes} phút ` : ""}
              </span>
            </div>
          )}

          <div className="notification-details">
            <p className="notification-name">{upcomingFlashSales[0].name}</p>
            <p className="notification-date">
              Bắt đầu:{" "}
              {moment(upcomingFlashSales[0].startTime).format(
                "DD/MM/YYYY HH:mm"
              )}
            </p>
            <p className="notification-products">
              {upcomingFlashSales[0].totalProducts} sản phẩm với giá cực sốc!
            </p>
          </div>

          <div className="notification-actions">
            <button className="remind-me-button">Nhắc tôi</button>
            <Link
              to="/flash-sale/upcoming"
              className="view-details-button"
              onClick={handleClick}
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleNotification;
