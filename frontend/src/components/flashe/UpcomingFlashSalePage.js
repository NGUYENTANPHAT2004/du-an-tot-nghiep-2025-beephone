import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faCalendarAlt,
  faClock,
  faBell,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { Helmet } from "react-helmet";
import ThanhDinhHuong from "../../components/ThanhDinhHuong/ThanhDinhHuong";
import { useFlashSale } from "../../context/Flashecontext";
import "./UpcomingFlashSalePage.scss";

const UpcomingFlashSalePage = () => {
  const { upcomingFlashSales, loading, error, markNewFlashSaleSeen } =
    useFlashSale();
  const [countdowns, setCountdowns] = useState([]);

  // Mark new flash sales as seen when viewing this page
  useEffect(() => {
    markNewFlashSaleSeen();
  }, [markNewFlashSaleSeen]);

  // Set up countdowns for each upcoming Flash Sale
  useEffect(() => {
    if (!upcomingFlashSales || upcomingFlashSales.length === 0) return;

    const calculateCountdowns = () => {
      const now = new Date().getTime();
      const newCountdowns = upcomingFlashSales.map((sale) => {
        const startTime = new Date(sale.startTime).getTime();
        const timeLeft = startTime - now;

        if (timeLeft <= 0) {
          return { hours: 0, minutes: 0, seconds: 0, days: 0 };
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      });

      setCountdowns(newCountdowns);
    };

    calculateCountdowns();

    const timerId = setInterval(calculateCountdowns, 1000);

    return () => clearInterval(timerId);
  }, [upcomingFlashSales]);

  // Function to render countdown
  const renderCountdown = (countdown, index) => {
    if (!countdown) return null;

    return (
      <div className="countdown-timer" key={index}>
        {countdown.days > 0 && (
          <>
            <div className="countdown-block">
              <span className="time">{countdown.days}</span>
              <span className="label">Ngày</span>
            </div>
            <span className="countdown-divider">:</span>
          </>
        )}
        <div className="countdown-block">
          <span className="time">
            {countdown.hours.toString().padStart(2, "0")}
          </span>
          <span className="label">Giờ</span>
        </div>
        <span className="countdown-divider">:</span>
        <div className="countdown-block">
          <span className="time">
            {countdown.minutes.toString().padStart(2, "0")}
          </span>
          <span className="label">Phút</span>
        </div>
        <span className="countdown-divider">:</span>
        <div className="countdown-block">
          <span className="time">
            {countdown.seconds.toString().padStart(2, "0")}
          </span>
          <span className="label">Giây</span>
        </div>
      </div>
    );
  };

  // Function to handle reminder
  const handleSetReminder = (flashSale) => {
    const startTime = new Date(flashSale.startTime);

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      alert("Trình duyệt này không hỗ trợ thông báo!");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      // Create a reminder in browser's notifications
      const notificationTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      const now = new Date();

      if (notificationTime > now) {
        const timeoutId = setTimeout(() => {
          new Notification("Flash Sale sắp bắt đầu!", {
            body: `${flashSale.name} sẽ bắt đầu sau 15 phút!`,
            icon: "/logo.png",
          });
        }, notificationTime.getTime() - now.getTime());

        // Store timeout ID if needed to cancel later
        localStorage.setItem(`reminder_${flashSale._id}`, timeoutId);

        alert("Đã đặt nhắc nhở trước 15 phút khi Flash Sale bắt đầu!");
      } else {
        alert("Flash Sale sẽ diễn ra quá sớm để đặt nhắc nhở!");
      }
    } else if (Notification.permission !== "denied") {
      // Request permission
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          handleSetReminder(flashSale);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="upcoming-flash-sale-page">
        <Helmet>
          <title>Flash Sale Sắp Diễn Ra - ShopDunk</title>
        </Helmet>
        <ThanhDinhHuong
          breadcrumbs={[
            { label: "Trang Chủ", link: "/" },
            { label: "Flash Sale Sắp Diễn Ra", link: "/flash-sale/upcoming" },
          ]}
        />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải thông tin Flash Sale...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upcoming-flash-sale-page">
        <Helmet>
          <title>Flash Sale Sắp Diễn Ra - ShopDunk</title>
        </Helmet>
        <ThanhDinhHuong
          breadcrumbs={[
            { label: "Trang Chủ", link: "/" },
            { label: "Flash Sale Sắp Diễn Ra", link: "/flash-sale/upcoming" },
          ]}
        />
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!upcomingFlashSales || upcomingFlashSales.length === 0) {
    return (
      <div className="upcoming-flash-sale-page">
        <Helmet>
          <title>Flash Sale Sắp Diễn Ra - ShopDunk</title>
        </Helmet>
        <ThanhDinhHuong
          breadcrumbs={[
            { label: "Trang Chủ", link: "/" },
            { label: "Flash Sale Sắp Diễn Ra", link: "/flash-sale/upcoming" },
          ]}
        />
        <div className="no-flash-sales">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Hiện tại không có Flash Sale nào sắp diễn ra</p>
          <p className="sub-message">Vui lòng quay lại sau!</p>
          <Link to="/" className="back-home-btn">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-flash-sale-page">
      <Helmet>
        <title>Flash Sale Sắp Diễn Ra - ShopDunk</title>
      </Helmet>
      <ThanhDinhHuong
        breadcrumbs={[
          { label: "Trang Chủ", link: "/" },
          { label: "Flash Sale Sắp Diễn Ra", link: "/flash-sale/upcoming" },
        ]}
      />

      <div className="page-header">
        <div className="title-section">
          <FontAwesomeIcon icon={faBolt} className="icon" />
          <h1>Flash Sale Sắp Diễn Ra</h1>
        </div>
        <p className="subtitle">
          Đừng bỏ lỡ cơ hội sở hữu sản phẩm với giá đặc biệt!
        </p>
      </div>

      <div className="flash-sales-container">
        {upcomingFlashSales.map((flashSale, index) => (
          <div className="flash-sale-card" key={flashSale._id}>
            <div className="flash-sale-header">
              <h2>{flashSale.name}</h2>
              <div className="flash-sale-badges">
                <span className="badge upcoming">Sắp diễn ra</span>
                <span className="badge products">
                  {flashSale.totalProducts} sản phẩm
                </span>
              </div>
            </div>

            <div className="flash-sale-time">
              <div className="time-item">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>
                  Bắt đầu:{" "}
                  {moment(flashSale.startTime).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
              <div className="time-item">
                <FontAwesomeIcon icon={faClock} />
                <span>Còn: {renderCountdown(countdowns[index], index)}</span>
              </div>
            </div>

            {flashSale.bannerImage && (
              <div className="flash-sale-banner">
                <img src={flashSale.bannerImage} alt={flashSale.name} />
              </div>
            )}

            {flashSale.description && (
              <div className="flash-sale-description">
                <p>{flashSale.description}</p>
              </div>
            )}

            <div className="flash-sale-actions">
              <button
                className="reminder-btn"
                onClick={() => handleSetReminder(flashSale)}
              >
                <FontAwesomeIcon icon={faBell} />
                <span>Nhắc tôi khi bắt đầu</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingFlashSalePage;
