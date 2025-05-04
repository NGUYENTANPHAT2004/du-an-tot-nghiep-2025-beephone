import React, { useState, useEffect } from "react";
import { FaTicketAlt, FaTimes, FaGift, FaClock } from "react-icons/fa";
import "./VoucherNotification.scss";
import { useUserContext } from "../context/Usercontext";

const VoucherNotification = ({ onVoucherClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  // Lấy thông tin người dùng từ context
  const { user } = useUserContext();

  // Lấy userId từ thông tin người dùng
  const getUserId = () => {
    // Kiểm tra user có tồn tại không
    if (!user) return null;

    // Trả về userId, có thể nằm trực tiếp trong user hoặc trong user.user
    return user._id || (user.user && user.user._id);
  };

  // Check for new vouchers
  useEffect(() => {
    const userId = getUserId();
    // Chỉ tiếp tục nếu có userId
    if (!userId) {
      console.log("Không có userId - VoucherNotification");
      return;
    }

    console.log("VoucherNotification initialized with userId:", userId);

    const checkNewVouchers = async () => {
      // Kiểm tra xem đã đủ thời gian giữa các lần check chưa
      const now = Date.now();
      if (now - lastCheckTime < 10 * 60 * 1000) {
        // Chỉ check mỗi 10 phút
        return;
      }

      setLastCheckTime(now);

      try {
        console.log(
          "Checking for new vouchers at:",
          new Date().toLocaleTimeString()
        );
        // Sử dụng userId để kiểm tra voucher mới
        const response = await fetch(
          `http://localhost:3005/checknewvouchers/${userId}`
        );

        if (!response.ok) {
          console.error("Failed to fetch voucher data: ", response.status);
          return;
        }

        const data = await response.json();

        if (data.hasNewVouchers) {
          console.log("New vouchers found:", data.vouchers);

          // Add voucher notification
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "new-voucher",
              title: "Mã giảm giá mới",
              message: `Bạn có ${data.vouchers.length} mã giảm giá mới!`,
              vouchers: data.vouchers,
              timestamp: new Date(),
              read: false,
            },
          ]);
          setVisible(true);
        }
      } catch (error) {
        console.error("Error checking new vouchers:", error);
      }
    };

    // Check for golden hour vouchers
    const checkGoldenHourVouchers = async () => {
      // Kiểm tra xem đã đủ thời gian giữa các lần check chưa
      const now = Date.now();
      if (now - lastCheckTime < 10 * 60 * 1000) {
        // Chỉ check mỗi 10 phút
        return;
      }

      try {
        // Sử dụng userId thay vì phone
        const response = await fetch(
          `http://localhost:3005/activegoldenhour/${userId}`
        );

        if (!response.ok) {
          console.error("Failed to fetch golden hour data: ", response.status);
          return;
        }

        const data = await response.json();

        if (data.hasActiveVouchers) {
          console.log("Golden hour vouchers found:", data.vouchers);

          // Add golden hour notification
          setNotifications((prev) => {
            // Kiểm tra xem đã có thông báo khung giờ vàng trong 30 phút gần đây chưa
            const recentGoldenHourNotif = prev.find(
              (n) =>
                n.type === "golden-hour" &&
                Date.now() - n.timestamp < 30 * 60 * 1000
            );

            // Nếu đã có thì không thêm thông báo mới
            if (recentGoldenHourNotif) {
              return prev;
            }

            // Thêm thông báo mới
            return [
              ...prev,
              {
                id: Date.now(),
                type: "golden-hour",
                title: "Khung giờ vàng!",
                message: `${data.vouchers.length} mã giảm giá đặc biệt đang có sẵn trong khung giờ vàng!`,
                vouchers: data.vouchers,
                timestamp: new Date(),
                read: false,
              },
            ];
          });
          setVisible(true);
        }
      } catch (error) {
        console.error("Error checking golden hour vouchers:", error);
      }
    };

    // Initial check
    checkNewVouchers();
    checkGoldenHourVouchers();

    // Set up polling intervals - 10 minutes
    const newVouchersInterval = setInterval(checkNewVouchers, 10 * 60 * 1000); // 10 minutes
    const goldenHourInterval = setInterval(
      checkGoldenHourVouchers,
      10 * 60 * 1000
    ); // 10 minutes

    return () => {
      clearInterval(newVouchersInterval);
      clearInterval(goldenHourInterval);
    };
  }, [lastCheckTime, user]);

  const handleClose = () => {
    setVisible(false);
    // Mark all as read
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const handleNotificationClick = (notification) => {
    // Mark this notification as read
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notification.id ? { ...notif, read: true } : notif
      )
    );

    // Call the parent handler to open voucher modal
    if (onVoucherClick) {
      onVoucherClick();
    }
  };

  if (!visible || notifications.length === 0) return null;

  return (
    <div className="voucher-notification-container">
      <div className="notification-header">
        <FaTicketAlt className="notification-icon" />
        <h3>Thông báo</h3>
        <button className="close-button-noti" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>

      <div className="notification-list">
        {notifications
          .filter((notif) => !notif.read)
          .map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.type}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {notification.type === "new-voucher" ? (
                <FaGift className="notif-type-icon" />
              ) : (
                <FaClock className="notif-type-icon" />
              )}

              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="timestamp">
                  {new Date(notification.timestamp).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            </div>
          ))}
      </div>

      <div className="notification-footer">
        <button className="view-all-button" onClick={onVoucherClick}>
          Xem tất cả mã giảm giá
        </button>
      </div>
    </div>
  );
};

export default VoucherNotification;
