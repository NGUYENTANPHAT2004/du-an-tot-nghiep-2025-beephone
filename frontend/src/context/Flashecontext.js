import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Tạo context
const FlashSaleContext = createContext();

// Custom hook để sử dụng context
export const useFlashSale = () => {
  return useContext(FlashSaleContext);
};

// Provider component
export const FlashSaleProvider = ({ children }) => {
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [upcomingFlashSales, setUpcomingFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [hasNewFlashSale, setHasNewFlashSale] = useState(false);

  // Function để fetch Flash Sales
  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3005/flash-sales");

      if (response.data.success) {
        const { active, upcoming } = response.data.data;

        if (active.length > 0) {
          setActiveFlashSale(active[0]);
        } else {
          setActiveFlashSale(null);
        }

        setUpcomingFlashSales(upcoming);

        // Kiểm tra nếu có Flash Sale mới trong vòng 24 giờ
        const now = new Date().getTime();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Nếu có Flash Sale upcoming mà được tạo trong 24h qua, set hasNewFlashSale = true
        const hasNew = upcoming.some((sale) => {
          const createdAt = new Date(sale.createdAt).getTime();
          return createdAt > oneDayAgo;
        });

        setHasNewFlashSale(hasNew);
      }

      setLastCheck(new Date().getTime());
    } catch (error) {
      console.error("Lỗi khi tải Flash Sales:", error);
      setError("Không thể tải thông tin Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchFlashSales();

    // Tự động refresh dữ liệu mỗi 5 phút
    const intervalId = setInterval(fetchFlashSales, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Hàm để đánh dấu là đã xem thông báo Flash Sale mới
  const markNewFlashSaleSeen = () => {
    setHasNewFlashSale(false);
  };

  // Tính toán thời gian còn lại cho Flash Sale đang diễn ra
  const calculateRemainingTime = () => {
    if (!activeFlashSale) return null;

    const now = new Date().getTime();
    const endTime = new Date(activeFlashSale.endTime).getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      return null;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // Tính toán thời gian chờ đợi cho Flash Sale sắp diễn ra
  const calculateTimeUntilNextFlashSale = () => {
    if (upcomingFlashSales.length === 0) return null;

    // Lấy Flash Sale sắp diễn ra gần nhất
    const nextFlashSale = upcomingFlashSales[0];
    const now = new Date().getTime();
    const startTime = new Date(nextFlashSale.startTime).getTime();
    const timeLeft = startTime - now;

    if (timeLeft <= 0) {
      return null;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      flashSale: nextFlashSale,
    };
  };

  // Hàm để cập nhật số lượng sản phẩm đã bán
  const updateProductQuantity = async (
    flashSaleId,
    productId,
    dungluongId = null,
    mausacId = null,
    quantity = 1
  ) => {
    try {
      const response = await axios.post(
        "http://localhost:3005/flash-sale-purchase",
        {
          flashSaleId,
          productId,
          dungluongId,
          mausacId,
          quantity,
        }
      );

      if (response.data.success) {
        // Cập nhật lại dữ liệu Flash Sale sau khi mua hàng
        fetchFlashSales();
        return {
          success: true,
          remainingQuantity: response.data.data.remainingQuantity,
        };
      }

      return {
        success: false,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng sản phẩm:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi cập nhật số lượng sản phẩm",
      };
    }
  };

  // Hàm kiểm tra sản phẩm có thuộc Flash Sale đang diễn ra không
  const checkProductInFlashSale = async (
    productId,
    dungluongId = null,
    mausacId = null
  ) => {
    try {
      let url = `http://localhost:3005/flash-sale-products/${productId}`;

      // Thêm query params nếu có dungluongId và mausacId
      const params = new URLSearchParams();
      if (dungluongId) params.append("dungluongId", dungluongId);
      if (mausacId) params.append("mausacId", mausacId);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        return {
          inFlashSale: true,
          flashSaleInfo: response.data.data,
        };
      }

      return {
        inFlashSale: false,
      };
    } catch (error) {
      // Nếu trả về 404, sản phẩm không nằm trong Flash Sale
      if (error.response?.status === 404) {
        return {
          inFlashSale: false,
        };
      }

      console.error("Lỗi khi kiểm tra sản phẩm trong Flash Sale:", error);
      return {
        inFlashSale: false,
        error: error.response?.data?.message || "Lỗi khi kiểm tra sản phẩm",
      };
    }
  };

  // Các giá trị và hàm được cung cấp qua Context
  const value = {
    activeFlashSale,
    upcomingFlashSales,
    loading,
    error,
    hasNewFlashSale,
    lastCheck,
    refreshFlashSales: fetchFlashSales,
    markNewFlashSaleSeen,
    calculateRemainingTime,
    calculateTimeUntilNextFlashSale,
    updateProductQuantity,
    checkProductInFlashSale,
  };

  return (
    <FlashSaleContext.Provider value={value}>
      {children}
    </FlashSaleContext.Provider>
  );
};
