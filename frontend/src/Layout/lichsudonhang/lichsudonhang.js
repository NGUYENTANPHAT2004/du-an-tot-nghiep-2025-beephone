import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useUserContext } from "../../context/Usercontext";
import "./lichsudonhang.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faTrash,
  faReceipt,
  faExclamationTriangle,
  faTimes,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import ProductRating from "../../components/ProductRating/ProductRating";
import OrderDetails from "./OrderDeatails";

function LichSuDonHangLayout() {
  const { user } = useUserContext();
  const [donHangs, setDonHangs] = useState([]);
  const [selectedDonHang, setSelectedDonHang] = useState(null);
  const [rating, setRating] = useState(null); // Changed from 0 to null
  const [comment, setComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.post(
          "http://localhost:3005/gethoadonuser",
          {
            userId: user._id,
          }
        );
        // Filter out any orders that might be marked as isDeleted
        const filteredOrders =
          response.data.hoadons?.filter((order) => !order.isDeleted) || [];
        setDonHangs(filteredOrders);
        setError(null);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
        setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleXemChiTiet = async (idhoadon) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3005/getchitiethd/${idhoadon}`
      );

      // Kiểm tra response trước khi xử lý
      if (
        !response.data ||
        !response.data.hoadonsanpham ||
        !Array.isArray(response.data.hoadonsanpham)
      ) {
        console.error("Dữ liệu không hợp lệ từ API:", response.data);
        throw new Error("Dữ liệu đơn hàng không hợp lệ");
      }

      try {
        // Nếu đơn hàng có sản phẩm, kiểm tra trạng thái đánh giá cho từng sản phẩm trong đơn hàng này
        if (response.data.hoadonsanpham.length > 0) {
          const ratingStatusPromises = response.data.hoadonsanpham.map(
            (product) =>
              axios
                .get(`http://localhost:3005/order-rating/check`, {
                  params: {
                    userId: user._id,
                    productId: product.idsp,
                    orderId: idhoadon,
                  },
                })
                .catch((err) => {
                  console.warn(
                    `Không thể kiểm tra trạng thái đánh giá cho sản phẩm ${product.idsp}:`,
                    err
                  );
                  return { data: { hasRated: false } }; // Giá trị mặc định nếu API lỗi
                })
          );

          const ratingResults = await Promise.all(ratingStatusPromises);

          // Cập nhật trạng thái đánh giá cho từng sản phẩm trong đơn hàng hiện tại
          response.data.hoadonsanpham = response.data.hoadonsanpham.map(
            (product, index) => {
              return {
                ...product,
                idsp: response.data.sanpham?.[index]?.idsp || product.idsp,
                hasRated: ratingResults[index]?.data?.hasRated || false,
              };
            }
          );
        }
      } catch (ratingErr) {
        console.error("Lỗi khi kiểm tra trạng thái đánh giá:", ratingErr);
        // Vẫn tiếp tục hiển thị đơn hàng ngay cả khi không thể kiểm tra trạng thái đánh giá
      }

      setSelectedDonHang(response.data);
    } catch (error) {
      console.error("Lỗi khi xem chi tiết:", error);
      alert("Có lỗi xảy ra khi tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleXacNhan = async (idhoadon) => {
    try {
      await axios.post(`http://localhost:3005/settrangthai/${idhoadon}`, {
        trangthai: "Hoàn thành",
      });
      alert("Đơn hàng đã được xác nhận hoàn thành");
      setSelectedDonHang(null);
      // Reload lại danh sách
      refreshOrderList();
    } catch (error) {
      console.error("Lỗi xác nhận đơn:", error);
      alert("Có lỗi xảy ra khi xác nhận đơn hàng.");
    }
  };

  const refreshOrderList = async () => {
    try {
      const refreshed = await axios.post(
        "http://localhost:3005/gethoadonuser",
        {
          userId: user._id,
        }
      );
      // Filter out any deleted orders
      const filteredOrders =
        refreshed.data.hoadons?.filter((order) => !order.isDeleted) || [];
      setDonHangs(filteredOrders);
    } catch (error) {
      console.error("Lỗi khi làm mới danh sách đơn hàng:", error);
    }
  };

  // Xác nhận trước khi hủy đơn hàng
  const confirmCancelOrder = (idhoadon) => {
    setCancelOrderId(idhoadon);
    setShowCancelConfirm(true);
  };

  // Xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    try {
      setLoading(true);
      await axios.post(`http://localhost:3005/settrangthai/${cancelOrderId}`, {
        trangthai: "Hủy Đơn Hàng",
      });

      // Cập nhật đơn hàng trên giao diện
      setDonHangs((prevDonHangs) =>
        prevDonHangs.map((order) =>
          order._id === cancelOrderId
            ? { ...order, trangthai: "Hủy Đơn Hàng" }
            : order
        )
      );

      // Nếu đang xem chi tiết đơn hàng bị hủy, đóng chi tiết
      if (selectedDonHang && selectedDonHang._id === cancelOrderId) {
        setSelectedDonHang(null);
      }

      // Đóng cửa sổ xác nhận
      setShowCancelConfirm(false);
      setCancelOrderId(null);

      alert("Đơn hàng đã được hủy thành công");
      refreshOrderList();
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
      alert("Có lỗi xảy ra khi hủy đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteOrder = (idhoadon) => {
    setDeleteOrderId(idhoadon);
    setShowDeleteConfirm(true);
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;

    try {
      setLoading(true);
      await axios.post("http://localhost:3005/deletehoaddon", {
        ids: [deleteOrderId],
      });

      // Immediately remove the deleted order from the state
      setDonHangs((prevDonHangs) =>
        prevDonHangs.filter((order) => order._id !== deleteOrderId)
      );

      // If we're deleting the currently viewed order, close the detail view
      if (selectedDonHang && selectedDonHang._id === deleteOrderId) {
        setSelectedDonHang(null);
      }

      // Close the dialog and reset state
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);

      alert("Đơn hàng đã được xóa khỏi lịch sử của bạn");
    } catch (error) {
      console.error("Lỗi xóa đơn hàng:", error);
      alert("Có lỗi xảy ra khi xóa đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra xem sản phẩm đã được đánh giá chưa (trong đơn hàng cụ thể)
  const checkRatingStatus = async (product, orderId) => {
    try {
      const response = await axios.get(
        `http://localhost:3005/order-rating/check`,
        {
          params: {
            userId: user._id,
            productId: product._id || product.idsp,
            orderId: orderId,
          },
        }
      );

      return response.data.hasRated;
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái đánh giá:", error);
      return false;
    }
  };

  // UPDATED: improved opening of rating modal
  const openRatingModal = async (product) => {
    try {
      // Check if product data is valid
      if (!product || !product.idsp) {
        alert("Thông tin sản phẩm không hợp lệ");
        return;
      }

      // Check if the product has already been rated for this order
      const response = await axios.get(
        `http://localhost:3005/order-rating/check`,
        {
          params: {
            userId: user._id,
            productId: product.idsp,
            orderId: selectedDonHang._id,
          },
        }
      );

      if (response.data.hasRated) {
        alert("Bạn đã đánh giá sản phẩm này trong đơn hàng!");
        return;
      }

      // Set the selected product
      setSelectedProduct(product);

      // Reset rating state properly - ensure it's null, not 0
      setRating(null);
      setComment("");
      setRatingError("");
      setRatingModalOpen(true);

      // Log for debugging
      console.log("Opening rating modal for product:", product);
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái đánh giá:", error);
      alert(
        "Có lỗi xảy ra khi kiểm tra trạng thái đánh giá. Vui lòng thử lại sau."
      );
    }
  };

  const closeRatingModal = () => {
    setSelectedProduct(null);
    setRating(null); // Changed from 0 to null
    setComment("");
    setRatingError("");
    setRatingModalOpen(false);
  };

  // UPDATED: enhanced submit rating function
  const submitRating = async () => {
    // Enhanced validation
    if (!selectedProduct) {
      setRatingError("Không tìm thấy thông tin sản phẩm");
      return;
    }

    // Explicitly check that rating is a number between 1-5
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      setRatingError("Vui lòng chọn số sao đánh giá (1-5 sao)");
      return;
    }

    try {
      setIsSubmitting(true);
      setRatingError("");

      // Log what's being sent for debugging
      console.log("Submitting rating data:", {
        productId: selectedProduct.idsp,
        rating: rating,
        userId: user._id,
      });

      const response = await axios.post("http://localhost:3005/order-rating", {
        userId: user._id,
        orderId: selectedDonHang._id,
        productId: selectedProduct.idsp,
        productName: selectedProduct.namesanpham || "Sản phẩm",
        productImage: selectedProduct.image || "",
        tenkhach: user.tenkhach || user.username || "Khách hàng",
        content: comment,
        rating: rating, // This is now a valid number 1-5
        dungluong: selectedProduct.dungluong || "",
        mausac: selectedProduct.mausac || "",
        verified: true,
      });

      if (response.data.success) {
        alert("Cảm ơn bạn đã đánh giá sản phẩm!");
        closeRatingModal();

        // Refresh the order details to show updated rating status
        if (selectedDonHang) {
          handleXemChiTiet(selectedDonHang._id);
        }
      } else {
        setRatingError(
          response.data.message || "Có lỗi xảy ra khi gửi đánh giá"
        );
      }
    } catch (error) {
      console.error("Lỗi khi đánh giá:", error);
      if (error.response && error.response.data) {
        setRatingError(error.response.data.message || "Lỗi từ máy chủ");
      } else {
        setRatingError("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra xem sản phẩm có đủ điều kiện đánh giá không (đơn hàng hoàn thành và chưa đánh giá)
  const canRateProduct = (product, order) => {
    // Chỉ cho phép đánh giá nếu đơn hàng đã hoàn thành hoặc đã giao
    const eligibleStatuses = ["Hoàn thành", "Đã nhận"];
    return eligibleStatuses.includes(order.trangthai) && !product.hasRated;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Đã thanh toán":
      case "Hoàn thành":
      case "Đã nhận":
        return "status-success";
      case "Đang xử lý":
      case "Đang vận chuyển":
        return "status-pending";
      case "Hủy Đơn Hàng":
      case "Thanh toán thất bại":
      case "Thanh toán hết hạn":
        return "status-cancelled";
      default:
        return "";
    }
  };

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

  // Check if the order is eligible for deletion (not completed or paid)
  const canDeleteOrder = (order) => {
    const deletableStatuses = [
      "Hủy Đơn Hàng",
      "Thanh toán thất bại",
      "Thanh toán hết hạn",
    ];

    // Đơn hàng đã hủy, thanh toán thất bại hoặc hết hạn có thể xóa
    return deletableStatuses.includes(order.trangthai) || !order.thanhtoan;
  };

  if (loading && donHangs.length === 0) {
    return (
      <div className="lichsu-donhang-container">
        <h2>Lịch sử đơn hàng</h2>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lichsu-donhang-container">
        <h2>Lịch sử đơn hàng</h2>
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lichsu-donhang-container">
      <h2>Lịch sử đơn hàng</h2>

      {donHangs.length === 0 ? (
        <p className="empty-message">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="table-responsive">
          <table className="table-donhang">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày Mua</th>
                <th>Trạng Thái</th>
                <th>Tổng Tiền</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {donHangs.map((hd) => (
                <tr key={hd._id}>
                  <td>{hd.maHDL || (hd._id ? hd._id.slice(-6) : "N/A")}</td>
                  <td>{moment(hd.ngaymua).format("DD/MM/YYYY")}</td>
                  <td>
                    <span
                      className={`status-indicator ${getStatusClass(
                        hd.trangthai
                      )}`}
                    >
                      {hd.trangthai}
                    </span>
                  </td>
                  <td className="price-column">
                    {hd.tongtien.toLocaleString()}₫
                  </td>
                  <td className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => handleXemChiTiet(hd._id)}
                    >
                      <FontAwesomeIcon icon={faReceipt} /> Chi tiết
                    </button>

                    {hd.trangthai === "Đã thanh toán" && (
                      <button
                        className="btn-confirm"
                        onClick={() => handleXacNhan(hd._id)}
                      >
                        Xác nhận
                      </button>
                    )}

                    {canCancelOrder(hd) && (
                      <button
                        className="btn-cancel"
                        onClick={() => confirmCancelOrder(hd._id)}
                      >
                        <FontAwesomeIcon icon={faBan} /> Hủy
                      </button>
                    )}

                    {canDeleteOrder(hd) && (
                      <button
                        className="btn-delete"
                        onClick={() => confirmDeleteOrder(hd._id)}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDonHang && (
        <OrderDetails
          selectedDonHang={selectedDonHang}
          setSelectedDonHang={setSelectedDonHang}
          handleXacNhan={handleXacNhan}
          handleRating={openRatingModal}
          canRateProduct={canRateProduct}
          getStatusClass={getStatusClass}
          user={user} // Thêm prop user vào đây
        />
      )}

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
}

export default LichSuDonHangLayout;
