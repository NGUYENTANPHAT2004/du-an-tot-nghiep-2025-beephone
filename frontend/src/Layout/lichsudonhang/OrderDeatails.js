import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faReceipt,
  faTimes,
  faCheck,
  faCircleInfo,
  faBan,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import ProductRating from "../../components/ProductRating/ProductRating";
import SimpleRating from "./Simplerating"; // Import component SimpleRating mới

// Sử dụng order details với SimpleRating
const OrderDetails = ({
  selectedDonHang,
  setSelectedDonHang,
  handleXacNhan,
  handleRating,
  canRateProduct,
  getStatusClass,
  user, // Thêm user props
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!selectedDonHang) return null;

  // Kiểm tra đơn hàng có thể hủy không (đang xử lý, chưa thanh toán hoặc mới thanh toán)
  const canCancelOrder = (order) => {
    const cancellableStatuses = ["Đang xử lý", "Đã thanh toán"];

    // Không cho phép hủy đơn hàng đã hoàn thành hoặc đã hủy
    const nonCancellableStatuses = [
      "Hoàn thành",
      "Đã nhận",
      "Hủy Đơn Hàng",
      "Thanh toán thất bại",
      "Thanh toán hết hạn",
    ];

    return (
      cancellableStatuses.includes(order.trangthai) &&
      !nonCancellableStatuses.includes(order.trangthai)
    );
  };

  // Kiểm tra đơn hàng có thể xóa không
  const canDeleteOrder = (order) => {
    const deletableStatuses = [
      "Hủy Đơn Hàng",
      "Thanh toán thất bại",
      "Thanh toán hết hạn",
    ];

    // Đơn hàng đã hủy, thanh toán thất bại hoặc hết hạn có thể xóa
    return deletableStatuses.includes(order.trangthai) || !order.thanhtoan;
  };

  // Xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    try {
      await axios.post(
        `http://localhost:3005/settrangthai/${selectedDonHang._id}`,
        {
          trangthai: "Hủy Đơn Hàng",
        }
      );
      alert("Đơn hàng đã được hủy thành công");
      setShowCancelConfirm(false);
      setSelectedDonHang(null);
      // Reload lại trang để cập nhật danh sách
      window.location.reload();
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
      alert("Có lỗi xảy ra khi hủy đơn hàng.");
    }
  };

  // Xử lý xóa đơn hàng
  const handleDeleteOrder = async () => {
    try {
      await axios.post("http://localhost:3005/deletehoaddon", {
        ids: [selectedDonHang._id],
      });
      alert("Đơn hàng đã được xóa khỏi lịch sử của bạn");
      setShowDeleteConfirm(false);
      setSelectedDonHang(null);
      // Reload lại trang để cập nhật danh sách
      window.location.reload();
    } catch (error) {
      console.error("Lỗi xóa đơn hàng:", error);
      alert("Có lỗi xảy ra khi xóa đơn hàng.");
    }
  };

  return (
    <div className="chitiet-donhang">
      <div className="chitiet-header">
        <h3>
          Chi tiết đơn hàng
          <span className="order-id">
            {selectedDonHang.maHDL ||
              (selectedDonHang._id ? selectedDonHang._id.slice(-6) : "N/A")}
          </span>
        </h3>
        <span
          className={`status-badge ${getStatusClass(
            selectedDonHang.trangthai
          )}`}
        >
          {selectedDonHang.trangthai}
        </span>
      </div>

      <div className="order-info">
        <div className="info-group">
          <p>
            <strong>Người nhận</strong> <span>{selectedDonHang.nguoinhan}</span>
          </p>
          <p>
            <strong>Số điện thoại</strong> <span>{selectedDonHang.phone}</span>
          </p>
          <p>
            <strong>Địa chỉ</strong>{" "}
            <span>{selectedDonHang.address || "N/A"}</span>
          </p>
        </div>
        <div className="info-group">
          <p>
            <strong>Ngày đặt</strong>
            <span>{moment(selectedDonHang.ngaymua).format("DD/MM/YYYY")}</span>
          </p>
          <p>
            <strong>Thanh toán</strong>
            <span>
              {selectedDonHang.thanhtoan ? (
                <span className="payment-status paid">
                  <FontAwesomeIcon icon={faCheck} /> Đã thanh toán
                </span>
              ) : (
                <span className="payment-status unpaid">
                  <FontAwesomeIcon icon={faTimes} /> Chưa thanh toán
                </span>
              )}
            </span>
          </p>
          <p>
            <strong>Ghi chú</strong>{" "}
            <span>{selectedDonHang.ghichu || "Không có"}</span>
          </p>
        </div>
      </div>

      <div className="product-list-header">
        <h4>Sản phẩm trong đơn hàng</h4>
      </div>

      <ul className="product-list">
        {selectedDonHang.hoadonsanpham.map((sp, index) => (
          <li key={index} className="product-item">
            <div className="product-content">
              {/* Thêm hình ảnh sản phẩm nếu có */}
              {sp.image && (
                <img
                  src={sp.image}
                  alt={sp.namesanpham}
                  className="product-image"
                />
              )}
              <div className="product-details">
                <span className="product-name">{sp.namesanpham}</span>
                <span className="product-variant">
                  {sp.dungluong} - {sp.mausac}
                </span>
                <div className="product-price-row">
                  <span className="product-quantity">SL: {sp.soluong}</span>
                  <span className="product-price">
                    {sp.price.toLocaleString()}₫
                  </span>
                </div>

                {/* Thay thế phần đánh giá bằng SimpleRating khi đủ điều kiện */}
                {canRateProduct(sp, selectedDonHang) && (
                  <div className="product-rating-section">
                    <SimpleRating
                      userId={user?._id}
                      orderId={selectedDonHang._id}
                      productId={sp.idsp}
                    />
                  </div>
                )}

                {/* Show "rated" badge if product has been rated */}
                {sp.hasRated && (
                  <div className="product-rating-section completed">
                    <span className="rating-completed">
                      <FontAwesomeIcon icon={faCheck} /> Đã đánh giá
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="order-total">
        <div className="order-summary">
          {selectedDonHang.magiamgia && (
            <div className="summary-item discount">
              <span>Giảm giá:</span>
              <span>
                -
                {(
                  (selectedDonHang.giagoc || 0) - selectedDonHang.tongtien
                ).toLocaleString()}
                ₫
              </span>
            </div>
          )}
        </div>
        <p>
          <strong>Tổng cộng:</strong>{" "}
          <span className="total-price">
            {selectedDonHang.tongtien.toLocaleString()}₫
          </span>
        </p>
      </div>

      <div className="action-row">
        <button className="btn-close" onClick={() => setSelectedDonHang(null)}>
          <FontAwesomeIcon icon={faTimes} /> Đóng
        </button>

        {selectedDonHang.trangthai === "Đã thanh toán" && (
          <button
            className="btn-confirm"
            onClick={() => handleXacNhan(selectedDonHang._id)}
          >
            <FontAwesomeIcon icon={faCheck} /> Xác nhận đã nhận
          </button>
        )}

        {canCancelOrder(selectedDonHang) && (
          <button
            className="btn-cancel"
            onClick={() => setShowCancelConfirm(true)}
          >
            <FontAwesomeIcon icon={faBan} /> Hủy đơn hàng
          </button>
        )}

        {canDeleteOrder(selectedDonHang) && (
          <button
            className="btn-delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <FontAwesomeIcon icon={faTrash} /> Xóa đơn hàng
          </button>
        )}
      </div>

      {/* Modal xác nhận hủy đơn hàng */}
      {showCancelConfirm && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Xác nhận hủy đơn hàng</h3>
            <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
            <p className="warning-text">
              Lưu ý: Sau khi hủy, bạn sẽ không thể khôi phục đơn hàng này.
            </p>
            <div className="confirm-buttons">
              <button
                className="btn-confirm-cancel"
                onClick={handleCancelOrder}
              >
                Hủy đơn hàng
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa đơn hàng */}
      {showDeleteConfirm && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa đơn hàng này khỏi lịch sử?</p>
            <p className="warning-text">
              Lưu ý: Hành động này không thể hoàn tác.
            </p>
            <div className="confirm-buttons">
              <button
                className="btn-confirm-delete"
                onClick={handleDeleteOrder}
              >
                Xóa đơn hàng
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
