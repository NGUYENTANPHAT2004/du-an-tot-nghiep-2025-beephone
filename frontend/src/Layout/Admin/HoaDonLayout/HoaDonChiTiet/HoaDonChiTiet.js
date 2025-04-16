/* eslint-disable react-hooks/exhaustive-deps */
import { ModalBig } from "../../../../components/ModalBig";
import { useState, useEffect } from "react";
import "./HoaDonChiTiet.scss";
import axios from "axios";
import {
  FaUser,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaIdCard,
  FaCreditCard,
  FaPrint,
  FaTimes,
  FaTag,
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaTh,
  FaBan,
  FaExclamationTriangle,
  FaSpinner,
  FaClipboardList,
  FaShoppingCart,
  FaArrowLeft,
} from "react-icons/fa";

function HoaDonChiTiet({ isOpen, onClose, idhoadon }) {
  const [hoadon, setHoadon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHoaDon = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3005/getchitiethd/${idhoadon}`
        );
        setHoadon(response.data);
      } catch (error) {
        console.error("Error fetching hóa đơn:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && idhoadon) {
      fetchHoaDon();
    } else {
      // Reset state when modal is closed
      setHoadon(null);
      setLoading(true);
    }
  }, [idhoadon, isOpen]);

  const getStatusInfo = (status) => {
    const statusMap = {
      "Đang xử lý": {
        icon: <FaSpinner className="status-icon spinning" />,
        class: "pending",
        stepCompleted: 1,
        description: "Đơn hàng đang được xử lý",
      },
      "Đã thanh toán": {
        icon: <FaCreditCard className="status-icon" />,
        class: "paid",
        stepCompleted: 2,
        description: "Thanh toán thành công",
      },
      "Đang vận chuyển": {
        icon: <FaTruck className="status-icon" />,
        class: "shipping",
        stepCompleted: 3,
        description: "Đơn hàng đang được vận chuyển",
      },
      "Đã nhận": {
        icon: <FaBoxOpen className="status-icon" />,
        class: "delivered",
        stepCompleted: 4,
        description: "Đơn hàng đã được giao",
      },
      "Hoàn thành": {
        icon: <FaCheckCircle className="status-icon" />,
        class: "success",
        stepCompleted: 5,
        description: "Đơn hàng đã hoàn thành",
      },
      "Thanh toán thất bại": {
        icon: <FaExclamationTriangle className="status-icon" />,
        class: "failed",
        stepCompleted: 0,
        description: "Thanh toán không thành công",
      },
      "Thanh toán hết hạn": {
        icon: <FaExclamationTriangle className="status-icon" />,
        class: "expired",
        stepCompleted: 0,
        description: "Thanh toán đã hết hạn",
      },
      "Hủy Đơn Hàng": {
        icon: <FaBan className="status-icon" />,
        class: "cancelled",
        stepCompleted: 0,
        description: "Đơn hàng đã bị hủy",
      },
    };

    return (
      statusMap[status] || {
        icon: <FaTh className="status-icon" />,
        class: "",
        stepCompleted: 0,
        description: status,
      }
    );
  };

  // Tính tổng tiền sản phẩm
  const calculateSubtotal = () => {
    if (!hoadon || !hoadon.hoadonsanpham) return 0;
    return hoadon.hoadonsanpham.reduce(
      (total, item) => total + item.price * item.soluong,
      0
    );
  };

  // Tính chiết khấu nếu có (giả sử chiết khấu là phần chênh lệch giữa subtotal và tổng tiền)
  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal > hoadon.tongtien ? subtotal - hoadon.tongtien : 0;
  };

  if (loading) {
    return (
      <ModalBig isOpen={isOpen} onClose={onClose} title="Chi tiết đơn hàng">
        <div className="loading">
          <FaSpinner className="spinning" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </ModalBig>
    );
  }

  if (!hoadon) {
    return (
      <ModalBig isOpen={isOpen} onClose={onClose} title="Chi tiết đơn hàng">
        <div className="error">
          <FaExclamationTriangle />
          <p>Không tìm thấy thông tin đơn hàng</p>
          <button className="btn-primary" onClick={onClose}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </ModalBig>
    );
  }

  const statusInfo = getStatusInfo(hoadon.trangthai);
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();

  return (
    <ModalBig isOpen={isOpen} onClose={onClose} title="Chi tiết đơn hàng">
      <div className="chi-tiet-hoa-don">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span>
            <FaClipboardList /> Quản lý đơn hàng
          </span>
          <span className="separator">/</span>
          <span className="current">
            Chi tiết đơn hàng #{hoadon.maHDL || ""}
          </span>
        </div>

        {/* Header */}
        <div className="header">
          <div className="order-title">
            <h1>Đơn hàng #{hoadon.maHDL || ""}</h1>
            <span className="order-date">
              <FaCalendarAlt /> Ngày đặt: {hoadon.ngaymua}
            </span>
          </div>
          <div className={`status-badge ${statusInfo.class}`}>
            {statusInfo.icon}
            <span>{hoadon.trangthai}</span>
          </div>
        </div>

        {/* Order Progress - Chỉ hiển thị nếu đơn hàng không bị hủy/lỗi */}
        {["Hủy Đơn Hàng", "Thanh toán thất bại", "Thanh toán hết hạn"].indexOf(
          hoadon.trangthai
        ) === -1 && (
          <div className="order-progress">
            <div
              className={`progress-step ${
                statusInfo.stepCompleted >= 1 ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                <FaShoppingCart />
              </div>
              <div className="step-label">Đặt hàng</div>
            </div>
            <div className="progress-line"></div>
            <div
              className={`progress-step ${
                statusInfo.stepCompleted >= 2 ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                <FaCreditCard />
              </div>
              <div className="step-label">Thanh toán</div>
            </div>
            <div className="progress-line"></div>
            <div
              className={`progress-step ${
                statusInfo.stepCompleted >= 3 ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                <FaTruck />
              </div>
              <div className="step-label">Vận chuyển</div>
            </div>
            <div className="progress-line"></div>
            <div
              className={`progress-step ${
                statusInfo.stepCompleted >= 4 ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                <FaBoxOpen />
              </div>
              <div className="step-label">Giao hàng</div>
            </div>
            <div className="progress-line"></div>
            <div
              className={`progress-step ${
                statusInfo.stepCompleted >= 5 ? "completed" : ""
              }`}
            >
              <div className="step-icon">
                <FaCheckCircle />
              </div>
              <div className="step-label">Hoàn thành</div>
            </div>
          </div>
        )}

        {/* Status description */}
        <div className="status-description">
          {statusInfo.icon}
          <p>{statusInfo.description}</p>
        </div>

        {/* Order info */}
        <div className="order-info">
          <div className="info-card">
            <div className="info-header">
              <FaUser className="info-icon" />
              <h3>Thông tin người nhận</h3>
            </div>
            <div className="info-content">
              <div className="info-item">
                <FaUser className="item-icon" />
                <div className="item-content">
                  <label>Người đặt:</label>
                  <span>{hoadon.name || "N/A"}</span>
                </div>
              </div>
              <div className="info-item">
                <FaUser className="item-icon" />
                <div className="item-content">
                  <label>Người nhận:</label>
                  <span>{hoadon.nguoinhan || "N/A"}</span>
                </div>
              </div>
              <div className="info-item">
                <FaPhoneAlt className="item-icon" />
                <div className="item-content">
                  <label>Số điện thoại:</label>
                  <span>{hoadon.phone || "N/A"}</span>
                </div>
              </div>
              <div className="info-item">
                <FaMapMarkerAlt className="item-icon" />
                <div className="item-content">
                  <label>Địa chỉ:</label>
                  <span>{hoadon.address || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-header">
              <FaClipboardList className="info-icon" />
              <h3>Thông tin đơn hàng</h3>
            </div>
            <div className="info-content">
              <div className="info-item">
                <FaIdCard className="item-icon" />
                <div className="item-content">
                  <label>Mã đơn hàng:</label>
                  <span>#{hoadon.maHDL || ""}</span>
                </div>
              </div>
              <div className="info-item">
                <FaCalendarAlt className="item-icon" />
                <div className="item-content">
                  <label>Ngày đặt:</label>
                  <span>{hoadon.ngaymua}</span>
                </div>
              </div>
              <div className="info-item">
                <FaCreditCard className="item-icon" />
                <div className="item-content">
                  <label>Thanh toán:</label>
                  <span
                    className={
                      hoadon.thanhtoan ? "paid-status" : "unpaid-status"
                    }
                  >
                    {hoadon.thanhtoan ? "✓ Đã thanh toán" : "✗ Chưa thanh toán"}
                  </span>
                </div>
              </div>
              {hoadon.ghichu && (
                <div className="info-item">
                  <FaTag className="item-icon" />
                  <div className="item-content">
                    <label>Ghi chú:</label>
                    <span className="note-text">{hoadon.ghichu}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="products-section">
          <div className="section-header">
            <FaBoxOpen className="section-icon" />
            <h3>Sản phẩm trong đơn hàng</h3>
          </div>
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Dung lượng</th>
                  <th>Màu sắc</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {hoadon.hoadonsanpham.map((sanpham, index) => (
                  <tr key={index}>
                    <td>
                      <div className="product-info-hd">
                        {sanpham.image && (
                          <div className="product-image-hd">
                            <img
                              src={sanpham.image}
                              alt={sanpham.namesanpham}
                            />
                          </div>
                        )}
                        <div className="product-details-hd">
                          <h4>{sanpham.namesanpham}</h4>
                          <span className="product-sku-hd">
                            SKU: {sanpham.idsp ? sanpham.idsp.slice(-6) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="product-spec-hd">
                      {sanpham.dungluong || "N/A"}
                    </td>
                    <td className="product-spec-hd">
                      {sanpham.mausac && (
                        <div className="color-indicator-hd">
                          <div
                            className="color-dot-hd"
                            style={{
                              backgroundColor:
                                // Chỉ một số màu cơ bản, có thể mở rộng thêm hoặc sử dụng hex codes trực tiếp
                                sanpham.mausac.toLowerCase() === "đen"
                                  ? "#000"
                                  : sanpham.mausac.toLowerCase() === "trắng"
                                  ? "#fff"
                                  : sanpham.mausac.toLowerCase() === "đỏ"
                                  ? "#e74c3c"
                                  : sanpham.mausac.toLowerCase() === "xanh"
                                  ? "#3498db"
                                  : sanpham.mausac.toLowerCase() === "vàng"
                                  ? "#f1c40f"
                                  : "#ddd",
                            }}
                          ></div>
                          {sanpham.mausac}
                        </div>
                      )}
                    </td>
                    <td className="price-hd">
                      {sanpham.price.toLocaleString()}₫
                    </td>
                    <td className="quantity-hd">
                      <div className="quantity-box-hd">{sanpham.soluong}</div>
                    </td>
                    <td className="price-hd total-price-hd">
                      {(sanpham.price * sanpham.soluong).toLocaleString()}₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="summary-section">
          <div className="section-header">
            <FaClipboardList className="section-icon" />
            <h3>Tổng kết đơn hàng</h3>
          </div>
          <div className="order-summary">
            <div className="summary-item">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString()}₫</span>
            </div>

            {discount > 0 && (
              <div className="summary-item discount">
                <span>Giảm giá:</span>
                <span>-{discount.toLocaleString()}₫</span>
              </div>
            )}

            {hoadon.magiamgia && (
              <div className="summary-item coupon">
                <span>Mã giảm giá:</span>
                <span className="coupon-code">{hoadon.magiamgia}</span>
              </div>
            )}

            {/* Phí vận chuyển - giả sử đã bao gồm trong tổng tiền */}
            <div className="summary-item">
              <span>Phí vận chuyển:</span>
              <span>
                {hoadon.phivanchuyen ? hoadon.phivanchuyen.toLocaleString() : 0}
                ₫
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item total">
              <span>Tổng cộng:</span>
              <span>{hoadon.tongtien.toLocaleString()}₫</span>
            </div>

            <div className="payment-method">
              <span>Phương thức thanh toán:</span>
              <span
                className={hoadon.thanhtoan ? "paid-status" : "unpaid-status"}
              >
                {hoadon.thanhtoan ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions">
          <button className="btn-primary" onClick={() => window.print()}>
            <FaPrint /> In hóa đơn
          </button>
          <button className="btn-secondary" onClick={onClose}>
            <FaTimes /> Đóng
          </button>
        </div>
      </div>
    </ModalBig>
  );
}

export default HoaDonChiTiet;
