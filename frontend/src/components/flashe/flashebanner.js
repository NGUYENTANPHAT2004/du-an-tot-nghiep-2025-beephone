import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useFlashSale } from "../../context/Flashecontext";
import "./flashebanner.scss";

const FlashSaleBanner = () => {
  const { activeFlashSale, loading, calculateRemainingTime } = useFlashSale();
  const [remainingTime, setRemainingTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Update countdown timer
  useEffect(() => {
    if (!activeFlashSale) return;

    const updateCountdown = () => {
      const timeLeft = calculateRemainingTime();

      if (!timeLeft) {
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0 });
        return false;
      }

      setRemainingTime(timeLeft);
      return true;
    };

    // Initial calculation
    const isActive = updateCountdown();

    if (!isActive) return;

    // Update countdown every second
    const timerId = setInterval(() => {
      const isStillActive = updateCountdown();

      if (!isStillActive) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeFlashSale, calculateRemainingTime]);

  if (loading) {
    return (
      <div className="flashsale-banner loading">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  }

  if (!activeFlashSale || activeFlashSale.products.length === 0) {
    return null;
  }

  const { hours, minutes, seconds } = remainingTime;

  // Render Flash Sale banner with custom image or default layout
  if (activeFlashSale.bannerImage) {
    return (
      <Link
        to={`/flash-sale/${activeFlashSale._id}`}
        className="flashsale-banner custom-banner"
      >
        <img src={activeFlashSale.bannerImage} alt={activeFlashSale.name} />
        <div className="banner-timer">
          <FontAwesomeIcon icon={faClock} />
          <div className="timer-digits">
            <span>{hours.toString().padStart(2, "0")}</span>
            <span>:</span>
            <span>{minutes.toString().padStart(2, "0")}</span>
            <span>:</span>
            <span>{seconds.toString().padStart(2, "0")}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default layout if no custom banner
  return (
    <Link
      to={`/flash-sale/${activeFlashSale._id}`}
      className="flashsale-banner"
    >
      <div className="banner-header">
        <div className="flashsale-title">
          <FontAwesomeIcon icon={faBolt} />
          <h2>{activeFlashSale.name}</h2>
        </div>
        <div className="flashsale-timer">
          <FontAwesomeIcon icon={faClock} />
          <div className="timer-container">
            <div className="timer-block">
              <span className="time">{hours.toString().padStart(2, "0")}</span>
              <span className="label">Giờ</span>
            </div>
            <span className="timer-divider">:</span>
            <div className="timer-block">
              <span className="time">
                {minutes.toString().padStart(2, "0")}
              </span>
              <span className="label">Phút</span>
            </div>
            <span className="timer-divider">:</span>
            <div className="timer-block">
              <span className="time">
                {seconds.toString().padStart(2, "0")}
              </span>
              <span className="label">Giây</span>
            </div>
          </div>
        </div>
      </div>

      <div className="products-preview">
        {activeFlashSale.products.slice(0, 5).map((product) => (
          <div className="product-item" key={product._id}>
            <div className="product-image">
              <img src={product.image} alt={product.name} />
              <div className="discount-badge">-{product.discountPercent}%</div>
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <div className="product-price">
                <span className="sale-price">
                  {product.salePrice.toLocaleString("vi-VN")}đ
                </span>
                <span className="original-price">
                  {product.originalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="product-progress">
                <div className="progress-text">
                  <span>Đã bán {product.soldQuantity}</span>
                  <span>
                    {product.remainingQuantity < 5
                      ? `Chỉ còn ${product.remainingQuantity}`
                      : ""}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${product.soldPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {activeFlashSale.products.length > 5 && (
          <div className="view-more">
            <span>Xem thêm {activeFlashSale.products.length - 5} sản phẩm</span>
            <span className="arrow">→</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default FlashSaleBanner;
