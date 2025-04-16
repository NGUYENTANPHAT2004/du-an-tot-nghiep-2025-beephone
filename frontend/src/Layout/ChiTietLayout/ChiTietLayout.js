import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductFlashSale from "../../components/flashe/ProductFlashSale";
import { useFlashSale } from "../../context/Flashecontext";

// Các import khác...

const ChiTietLayout = () => {
  const { loaisp, tieude } = useParams();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dungLuongs, setDungLuongs] = useState([]);
  const [selectedDungLuong, setSelectedDungLuong] = useState(null);
  const [mauSacs, setMauSacs] = useState([]);
  const [selectedMauSac, setSelectedMauSac] = useState(null);
  const [stockInfo, setStockInfo] = useState({
    status: "loading",
    quantity: 0,
  });

  // State cho Flash Sale
  const [isInFlashSale, setIsInFlashSale] = useState(false);
  const [flashSalePrice, setFlashSalePrice] = useState(null);
  const { checkProductInFlashSale, updateProductQuantity } = useFlashSale();

  // Fetch dữ liệu sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3005/chitietsanpham/${tieude}`
        );
        setProductData(response.data);

        // Lấy dung lượng của sản phẩm
        const dlResponse = await axios.get(
          `http://localhost:3005/dungluongmay/${loaisp}`
        );
        setDungLuongs(
          dlResponse.data.filter((dl) => dl.mausac && dl.mausac.length > 0)
        );

        // Chọn dung lượng đầu tiên theo mặc định
        if (dlResponse.data.length > 0) {
          setSelectedDungLuong(dlResponse.data[0]);
          setMauSacs(dlResponse.data[0].mausac);

          // Chọn màu sắc đầu tiên theo mặc định
          if (
            dlResponse.data[0].mausac &&
            dlResponse.data[0].mausac.length > 0
          ) {
            setSelectedMauSac(dlResponse.data[0].mausac[0]);

            // Kiểm tra tồn kho
            checkStock(
              response.data._id,
              dlResponse.data[0]._id,
              dlResponse.data[0].mausac[0]._id
            );

            // Kiểm tra Flash Sale
            checkFlashSale(
              response.data._id,
              dlResponse.data[0]._id,
              dlResponse.data[0].mausac[0]._id
            );
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loaisp, tieude]);

  // Hàm kiểm tra tồn kho
  const checkStock = async (productId, dungluongId, mausacId) => {
    try {
      setStockInfo({ status: "loading", quantity: 0 });
      const response = await axios.get(
        `http://localhost:3005/stock/${productId}/${dungluongId}/${mausacId}`
      );

      if (response.data.unlimitedStock) {
        setStockInfo({ status: "in-stock", quantity: "Không giới hạn" });
      } else if (response.data.stock > 10) {
        setStockInfo({ status: "in-stock", quantity: response.data.stock });
      } else if (response.data.stock > 0) {
        setStockInfo({ status: "low-stock", quantity: response.data.stock });
      } else {
        setStockInfo({ status: "out-of-stock", quantity: 0 });
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra tồn kho:", error);
      setStockInfo({ status: "error", quantity: 0 });
    }
  };

  // Kiểm tra Flash Sale
  const checkFlashSale = async (productId, dungluongId, mausacId) => {
    try {
      const result = await checkProductInFlashSale(
        productId,
        dungluongId,
        mausacId
      );

      if (result.inFlashSale) {
        setIsInFlashSale(true);
        setFlashSalePrice(result.flashSaleInfo.salePrice);
      } else {
        setIsInFlashSale(false);
        setFlashSalePrice(null);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra Flash Sale:", error);
      setIsInFlashSale(false);
    }
  };

  // Xử lý khi thay đổi dung lượng
  const handleDungLuongChange = (dungluong) => {
    setSelectedDungLuong(dungluong);
    setMauSacs(dungluong.mausac);

    // Reset màu sắc khi thay đổi dung lượng
    if (dungluong.mausac && dungluong.mausac.length > 0) {
      setSelectedMauSac(dungluong.mausac[0]);

      // Kiểm tra tồn kho và Flash Sale khi thay đổi dung lượng
      if (productData) {
        checkStock(productData._id, dungluong._id, dungluong.mausac[0]._id);
        checkFlashSale(productData._id, dungluong._id, dungluong.mausac[0]._id);
      }
    } else {
      setSelectedMauSac(null);
      setStockInfo({ status: "out-of-stock", quantity: 0 });
      setIsInFlashSale(false);
    }
  };

  // Xử lý khi thay đổi màu sắc
  const handleMauSacChange = (mausac) => {
    setSelectedMauSac(mausac);

    // Kiểm tra tồn kho và Flash Sale khi thay đổi màu sắc
    if (productData && selectedDungLuong) {
      checkStock(productData._id, selectedDungLuong._id, mausac._id);
      checkFlashSale(productData._id, selectedDungLuong._id, mausac._id);
    }
  };

  // Xử lý khi thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!productData || !selectedDungLuong || !selectedMauSac) {
      alert("Vui lòng chọn dung lượng và màu sắc");
      return;
    }

    if (stockInfo.status === "out-of-stock") {
      alert("Sản phẩm đã hết hàng");
      return;
    }

    try {
      // Thêm sản phẩm vào giỏ hàng
      const cartItem = {
        idsp: productData._id,
        name: productData.name,
        image: productData.image,
        price: isInFlashSale ? flashSalePrice : selectedMauSac.price,
        dungluong: selectedDungLuong._id,
        tenDungLuong: selectedDungLuong.name,
        idmausac: selectedMauSac._id,
        mausac: selectedMauSac.name,
        soluong: 1,
        isFlashSale: isInFlashSale,
      };

      // Xử lý thêm vào giỏ hàng - code hiện có

      // Nếu là sản phẩm Flash Sale, cập nhật số lượng trong Flash Sale
      if (isInFlashSale) {
        const result = await updateProductQuantity(
          // flashSaleId sẽ được lấy từ kết quả của hàm checkProductInFlashSale
          // Bạn có thể lưu flashSaleId vào state khi gọi checkFlashSale
          flashSaleId,
          productData._id,
          selectedDungLuong._id,
          selectedMauSac._id,
          1
        );

        if (!result.success) {
          alert(result.message || "Không thể cập nhật số lượng Flash Sale");
          return;
        }
      }

      // Cập nhật tồn kho
      await axios.post("http://localhost:3005/stock/update", {
        productId: productData._id,
        dungluongId: selectedDungLuong._id,
        mausacId: selectedMauSac._id,
        quantity: 1,
      });

      // Cập nhật lại thông tin tồn kho sau khi thêm vào giỏ hàng
      checkStock(productData._id, selectedDungLuong._id, selectedMauSac._id);

      alert("Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert("Lỗi khi thêm vào giỏ hàng");
    }
  };

  // Render component
  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!productData) {
    return <div>Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className="container-chitiet">
      {/* Các phần Header và Navigation */}

      <div className="main">
        <div className="product-detail">
          <div className="product-image">
            {/* Hiển thị hình ảnh sản phẩm */}
            <img
              src={productData.image}
              alt={productData.name}
              className="pdt-img"
            />
          </div>

          <div className="product-info">
            <h1 className="product-name-chitiet">{productData.name}</h1>

            {/* Hiển thị Flash Sale nếu sản phẩm đang trong Flash Sale */}
            {isInFlashSale &&
              productData &&
              selectedDungLuong &&
              selectedMauSac && (
                <ProductFlashSale
                  productId={productData._id}
                  dungluongId={selectedDungLuong._id}
                  mausacId={selectedMauSac._id}
                />
              )}

            {/* Hiển thị giá */}
            <div className="chitietprice">
              {isInFlashSale ? (
                <>
                  <span className="current-price">
                    {flashSalePrice.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="old-price">
                    {selectedMauSac
                      ? selectedMauSac.price.toLocaleString("vi-VN")
                      : productData.price.toLocaleString("vi-VN")}
                    đ
                  </span>
                </>
              ) : (
                <span className="current-price">
                  {selectedMauSac
                    ? selectedMauSac.price.toLocaleString("vi-VN")
                    : productData.price.toLocaleString("vi-VN")}
                  đ
                </span>
              )}
            </div>

            {/* Hiển thị trạng thái tồn kho */}
            <div className="stock-status">
              {stockInfo.status === "loading" && (
                <span className="loading-stock">Đang kiểm tra tồn kho</span>
              )}
              {stockInfo.status === "in-stock" && (
                <span className="in-stock">
                  Còn hàng{" "}
                  {stockInfo.quantity !== "Không giới hạn"
                    ? `(${stockInfo.quantity})`
                    : ""}
                </span>
              )}
              {stockInfo.status === "low-stock" && (
                <span className="low-stock">
                  Sắp hết hàng (Chỉ còn {stockInfo.quantity})
                </span>
              )}
              {stockInfo.status === "out-of-stock" && (
                <span className="out-of-stock">Hết hàng</span>
              )}
            </div>

            {/* Phần chọn dung lượng và màu sắc */}
            <div className="mausac_dungluong">
              {dungLuongs.length > 0 && (
                <div className="dungluong_container">
                  <div className="mausac_chitiet">
                    <p>Dung lượng:</p>
                  </div>
                  <div className="dungluong_chitiet">
                    {dungLuongs.map((dungluong) => (
                      <div
                        key={dungluong._id}
                        className={`dungluong_item ${
                          selectedDungLuong &&
                          selectedDungLuong._id === dungluong._id
                            ? "dungluong_item_active"
                            : ""
                        }`}
                        onClick={() => handleDungLuongChange(dungluong)}
                      >
                        <span>{dungluong.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mauSacs && mauSacs.length > 0 && (
                <div className="mausac_container">
                  <div className="mausac_chitiet">
                    <p>Màu sắc:</p>
                  </div>
                  <div className="mausac_chitiet">
                    {mauSacs.map((mausac) => (
                      <div
                        key={mausac._id}
                        className={`border_mausac ${
                          selectedMauSac && selectedMauSac._id === mausac._id
                            ? "border_mausac1"
                            : ""
                        } ${
                          stockInfo.status === "out-of-stock"
                            ? "out-of-stock"
                            : ""
                        }`}
                        onClick={() => handleMauSacChange(mausac)}
                        title={mausac.name}
                      >
                        <div style={{ backgroundColor: mausac.name }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nút mua hàng */}
            <div
              className={`divbtn_muagay ${
                stockInfo.status === "out-of-stock" ? "disabled" : ""
              }`}
              onClick={
                stockInfo.status !== "out-of-stock"
                  ? handleAddToCart
                  : undefined
              }
            >
              {stockInfo.status === "out-of-stock"
                ? "HẾT HÀNG"
                : isInFlashSale
                ? "MUA NGAY - GIÁ FLASH SALE"
                : "MUA NGAY"}
            </div>

            {/* Các phần khác của trang chi tiết sản phẩm */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiTietLayout;
