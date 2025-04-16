import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faClock } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import "./ProductFlashSale.scss";
import { useFlashSale } from "../../context/Flashecontext";

const ProductFlashSale = ({ productId, dungluongId, mausacId }) => {
  const { checkProductInFlashSale } = useFlashSale();
  const [flashSaleInfo, setFlashSaleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Kiểm tra sản phẩm có thuộc Flash Sale nào không
  useEffect(() => {
    const checkFlashSale = async () => {
      try {
        setLoading(true);
        const result = await checkProductInFlashSale(
          productId,
          dungluongId,
          mausacId
        );

        if (result.inFlashSale) {
          setFlashSaleInfo(result.flashSaleInfo);
        } else {
          setFlashSaleInfo(null);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra Flash Sale:", error);
        setFlashSaleInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      checkFlashSale();
    }
  }, [productId, dungluongId, mausacId, checkProductInFlashSale]);

  // Cập nhật đồng hồ đếm ngược nếu sản phẩm có trong Flash Sale
  useEffect(() => {
    if (!flashSaleInfo) return;

    const calculateRemainingTime = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashSaleInfo.endTime).getTime();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        // Flash Sale đã kết thúc
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0 });
        setFlashSaleInfo(null); // Gỡ bỏ thông tin Flash Sale
        return false;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setRemainingTime({ hours, minutes, seconds });
      return true;
    };

    // Tính toán ban đầu
    const isActive = calculateRemainingTime();

    if (!isActive) return;

    // Cập nhật mỗi giây
    const timerId = setInterval(() => {
      const isStillActive = calculateRemainingTime();

      if (!isStillActive) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [flashSaleInfo]);

  if (loading || !productId) return null;

  if (!flashSaleInfo) return null;

  const { hours, minutes, seconds } = remainingTime;

  return (
    <div className="product-flash-sale">
      <div className="flash-sale-banner">
        <div className="flash-sale-title">
          <FontAwesomeIcon icon={faBolt} className="flash-icon" />
          <span>Flash Sale</span>
        </div>
        <div className="flash-sale-timer">
          <FontAwesomeIcon icon={faClock} />
          <div className="timer-digits">
            <span>{hours.toString().padStart(2, "0")}</span>
            <span>:</span>
            <span>{minutes.toString().padStart(2, "0")}</span>
            <span>:</span>
            <span>{seconds.toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      <div className="flash-sale-details">
        <div className="flash-sale-price">
          <div className="sale-price">
            {flashSaleInfo.salePrice.toLocaleString("vi-VN")}đ
          </div>
          <div className="original-price">
            {flashSaleInfo.originalPrice.toLocaleString("vi-VN")}đ
          </div>
          <div className="discount-badge">
            -{flashSaleInfo.discountPercent}%
          </div>
        </div>

        <div className="flash-sale-progress">
          <div className="progress-text">
            <span>Đã bán {flashSaleInfo.soldQuantity}</span>
            <span>Còn lại {flashSaleInfo.remainingQuantity}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  (flashSaleInfo.soldQuantity / flashSaleInfo.quantity) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <Link
        to={`/flash-sale/${flashSaleInfo.flashSaleId}`}
        className="view-all-flash-sales"
      >
        Xem tất cả sản phẩm Flash Sale
      </Link>
    </div>
  );
};

export default ProductFlashSale;
