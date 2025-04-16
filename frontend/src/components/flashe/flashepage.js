import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faBolt,
  faSpinner,
  faShoppingCart,
  faExclamationTriangle,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import moment from "moment";
import { Helmet } from "react-helmet";
import ThanhDinhHuong from "../../components/ThanhDinhHuong/ThanhDinhHuong";
import { useFlashSale } from "../../context/Flashecontext";
import { toast } from "react-toastify";
import "./flashepage.scss";

const FlashSalePage = () => {
  const { id } = useParams();
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { calculateRemainingTime, updateProductQuantity } = useFlashSale();
  const [remainingTime, setRemainingTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [purchaseLoading, setPurchaseLoading] = useState({});

  // Fetch Flash Sale details
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3005/flash-sales/${id}`
        );

        if (response.data.success) {
          setFlashSale(response.data.data);
        } else {
          setError("Không thể tải thông tin Flash Sale");
        }
      } catch (error) {
        console.error("Lỗi khi tải Flash Sale:", error);
        setError("Không thể tải thông tin Flash Sale");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, [id]);

  // Update countdown timer
  useEffect(() => {
    if (!flashSale || flashSale.status !== "active") return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashSale.endTime).getTime();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        // Flash Sale has ended
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0 });
        // Refresh Flash Sale data to update status
        window.location.reload();
        return false;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setRemainingTime({ hours, minutes, seconds });
      return true;
    };

    // Initial calculation
    const isActive = calculateTime();

    if (!isActive) return;

    // Update countdown every second
    const timerId = setInterval(() => {
      const isStillActive = calculateTime();

      if (!isStillActive) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [flashSale]);

  // Handle add to cart
  const handleAddToCart = async (product) => {
    // Set loading state for this specific product
    setPurchaseLoading((prev) => ({ ...prev, [product._id]: true }));

    try {
      // Call the context function to update product quantity
      const result = await updateProductQuantity(flashSale._id, product._id, 1);

      if (result.success) {
        // Add product to cart logic
        // This would depend on your cart implementation
        // Example: dispatch add to cart action

        toast.success("Đã thêm sản phẩm vào giỏ hàng");

        // Update product quantity in current state
        const updatedProducts = flashSale.products.map((p) => {
          if (p._id === product._id) {
            return {
              ...p,
              soldQuantity: p.soldQuantity + 1,
              remainingQuantity: result.remainingQuantity,
            };
          }
          return p;
        });

        setFlashSale((prev) => ({
          ...prev,
          products: updatedProducts,
        }));
      } else {
        toast.error(result.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      toast.error("Lỗi khi thêm sản phẩm vào giỏ hàng");
    } finally {
      setPurchaseLoading((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flashsale-page">
        <Helmet>
          <title>Flash Sale - ShopDunk</title>
        </Helmet>
        <ThanhDinhHuong
          breadcrumbs={[
            { label: "Trang Chủ", link: "/" },
            { label: "Flash Sale", link: "/flash-sale" },
          ]}
        />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải Flash Sale...</p>
        </div>
      </div>
    );
  }

  if (error || !flashSale) {
    return (
      <div className="flashsale-page">
        <Helmet>
          <title>Flash Sale - ShopDunk</title>
        </Helmet>
        <ThanhDinhHuong
          breadcrumbs={[
            { label: "Trang Chủ", link: "/" },
            { label: "Flash Sale", link: "/flash-sale" },
          ]}
        />
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error || "Không tìm thấy Flash Sale"}</p>
          <Link to="/" className="back-button">
            <FontAwesomeIcon icon={faChevronLeft} />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  const { hours, minutes, seconds } = remainingTime;

  return (
    <div className="flashsale-page">
      <Helmet>
        <title>{flashSale.name} - Flash Sale - ShopDunk</title>
      </Helmet>

      <ThanhDinhHuong
        breadcrumbs={[
          { label: "Trang Chủ", link: "/" },
          { label: "Flash Sale", link: "/flash-sale" },
          { label: flashSale.name, link: `/flash-sale/${flashSale._id}` },
        ]}
      />

      <div className="flashsale-header">
        <div className="header-content">
          <div className="title-section">
            <FontAwesomeIcon icon={faBolt} className="flash-icon" />
            <h1>{flashSale.name}</h1>
          </div>

          <div className="timer-section">
            {flashSale.status === "active" ? (
              <>
                <div className="timer-label">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Kết thúc sau:</span>
                </div>
                <div className="timer-blocks">
                  <div className="timer-block">
                    <span className="time">
                      {hours.toString().padStart(2, "0")}
                    </span>
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
              </>
            ) : flashSale.status === "upcoming" ? (
              <div className="status-message upcoming">
                <span>Sắp diễn ra:</span>
                <span>
                  {moment(flashSale.startTime).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
            ) : (
              <div className="status-message ended">
                <span>Đã kết thúc</span>
                <span>
                  {moment(flashSale.endTime).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>

        {flashSale.bannerImage && (
          <div className="banner-image">
            <img src={flashSale.bannerImage} alt={flashSale.name} />
          </div>
        )}

        {flashSale.description && (
          <div className="sale-description">
            <p>{flashSale.description}</p>
          </div>
        )}
      </div>

      <div className="products-container">
        {flashSale.products.length === 0 ? (
          <div className="no-products">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>Không có sản phẩm trong Flash Sale này</p>
          </div>
        ) : (
          <div className="products-grid">
            {flashSale.products.map((product) => (
              <div className="product-card" key={product._id}>
                <Link
                  to={`/san-pham/${product.namekhongdau}`}
                  className="product-link"
                >
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <div className="discount-badge">
                      -{product.discountPercent}%
                    </div>
                    {product.remainingQuantity < 5 && (
                      <div className="stock-warning">
                        Chỉ còn {product.remainingQuantity}
                      </div>
                    )}
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
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${product.soldPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  className={`add-to-cart-btn ${
                    product.status !== "available" ||
                    purchaseLoading[product._id]
                      ? "disabled"
                      : ""
                  }`}
                  onClick={() => handleAddToCart(product)}
                  disabled={
                    product.status !== "available" ||
                    purchaseLoading[product._id]
                  }
                >
                  {purchaseLoading[product._id] ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Đang xử lý....</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faShoppingCart} />
                      <span>
                        {product.status === "available"
                          ? "Thêm vào giỏ hàng"
                          : product.status === "soldout"
                          ? "Hết hàng"
                          : product.status === "upcoming"
                          ? "Sắp có hàng"
                          : "Đã kết thúc"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSalePage;
