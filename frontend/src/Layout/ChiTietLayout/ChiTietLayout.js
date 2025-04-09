import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ChiTietLayout.scss";
import axios from "axios";

import ListBlog from "../../components/ListBlog/ListBlog";
import ThanhDinhHuong from "../../components/ThanhDinhHuong/ThanhDinhHuong";
import ProductRating from "../../components/ProductRating/ProductRating";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faGift } from "@fortawesome/free-solid-svg-icons";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { RelatedProducts } from "../Splienquan";
import ProductRatingsContainer from "../../components/ProductRating/ProductRatingcontainer";

const ChiTietLayout = () => {
  const { tieude, loaisp } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [dungluong, setdungluong] = useState([]);
  const [dungluong1, setdungluong1] = useState("");
  const [mausac1, setmausac1] = useState("");
  const [annhmausac, setanhmausac] = useState([]);
  const [pricemausac, setpricemausac] = useState(0);
  const [khuyenmai, setkhuyenmai] = useState(0);
  const [giagoc, setgiagoc] = useState(0);
  const [idmausac, setidmausac] = useState("");
  const [idsanpham, setidsanpham] = useState("");
  const [iddungluong, setiddungluong] = useState("");
  const [activeTab, setActiveTab] = useState("mota"); // 'mota', 'thongso', 'chitiet'
  const [techSpecs, setTechSpecs] = useState(null);
  const [productRatings, setProductRatings] = useState(null);

  const [imgsanpham, setimgsanpham] = useState("");
  const [namesanpham, setnamesanpham] = useState("");
  const [processingColorChange, setProcessingColorChange] = useState(false);
  const [processingCapacityChange, setProcessingCapacityChange] =
    useState(false);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  // Sử dụng useCallback để tối ưu hàm fetchStock
  const fetchStock = useCallback(async () => {
    // Chỉ fetch stock nếu có đủ thông tin
    if (!idsanpham || !iddungluong || !idmausac) {
      console.log("Thiếu thông tin để lấy tồn kho:", {
        idsanpham,
        iddungluong,
        idmausac,
      });
      setQuantity(null);
      return;
    }

    console.log("Bắt đầu lấy tồn kho cho:", {
      idsanpham,
      iddungluong,
      idmausac,
    });
    setIsStockLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3005/stock/${idsanpham}/${iddungluong}/${idmausac}`
      );
      console.log("Kết quả API stock:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Dữ liệu tồn kho nhận được:", data);
        if (data.unlimitedStock) {
          setQuantity("Không giới hạn");
        } else {
          setQuantity(data.stock);
        }
      } else {
        console.error(
          "Không thể lấy thông tin tồn kho, status:",
          response.status
        );
        try {
          const errorData = await response.json();
          console.error("Chi tiết lỗi:", errorData);
        } catch (e) {
          console.error("Không thể đọc chi tiết lỗi");
        }
        setQuantity(0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy tồn kho:", error);
      setQuantity(0);
    } finally {
      setIsStockLoading(false);
      console.log("Đã hoàn thành việc lấy tồn kho");
    }
  }, [idsanpham, iddungluong, idmausac]);

  // Fetch technical specifications
  const fetchTechSpecs = useCallback(async () => {
    try {
      if (!loaisp) return;

      const response = await fetch(
        `http://localhost:3005/getchitiet-theloai/${loaisp}`
      );
      if (response.ok) {
        const data = await response.json();
        setTechSpecs(data);
      } else {
        console.error("Không thể lấy thông số kỹ thuật");
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông số kỹ thuật:", error);
    }
  }, [loaisp]);

  // Xử lý thay đổi màu sắc
  const handleColorChange = useCallback(
    (mau) => {
      // Nếu đang xử lý, bỏ qua
      if (processingColorChange) return;

      setProcessingColorChange(true);
      setIsStockLoading(true);

      console.log("Chọn màu:", mau.name, "ID:", mau._id);

      // Cập nhật tất cả state liên quan đến màu sắc
      setmausac1(mau.name);
      setidmausac(mau._id);
      setpricemausac(mau.price);
      setkhuyenmai(mau.khuyenmai);
      setgiagoc(mau.giagoc);

      // Thực hiện cả hai request song song nhau
      Promise.all([
        // Kiểm tra tồn kho
        fetch(
          `http://localhost:3005/stock/${idsanpham}/${iddungluong}/${mau._id}`
        )
          .then((response) => {
            if (!response.ok) throw new Error("Không thể kiểm tra tồn kho");
            return response.json();
          })
          .then((data) => {
            console.log(`Kết quả tồn kho cho màu ${mau.name}:`, data);
            if (data.unlimitedStock) {
              setQuantity("Không giới hạn");
            } else {
              setQuantity(data.stock);
            }
            return data;
          }),

        // Lấy ảnh màu sắc
        fetch(`http://localhost:3005/getanhmausac/${mau._id}`)
          .then((response) => {
            if (!response.ok) throw new Error("Không thể lấy ảnh màu sắc");
            return response.json();
          })
          .then((data) => {
            setanhmausac(data);
            return data;
          }),
      ])
        .catch((error) => {
          console.error("Lỗi khi xử lý thay đổi màu sắc:", error);
          setQuantity(0);
        })
        .finally(() => {
          setIsStockLoading(false);
          setProcessingColorChange(false);
        });
    },
    [idsanpham, iddungluong, processingColorChange]
  );

  // Xử lý thay đổi dung lượng
  const handleChangeDungLuong = useCallback(
    (id, name) => {
      // Nếu đang xử lý, bỏ qua
      if (processingCapacityChange) return;

      setProcessingCapacityChange(true);
      setIsStockLoading(true);

      console.log("Thay đổi dung lượng thành:", name, "ID:", id);

      // Cập nhật giá trị dung lượng
      setiddungluong(id);
      setdungluong1(name);

      const dungLuongMoi = dungluong.find((dl) => dl.name === name);
      if (!dungLuongMoi) {
        console.error("Không tìm thấy dung lượng:", name);
        setIsStockLoading(false);
        setProcessingCapacityChange(false);
        return;
      }

      let newMauSacId = "";
      let newMauSacName = "";

      // Tìm màu hiện tại trong dung lượng mới
      const mauHienTai = dungLuongMoi.mausac.find(
        (mau) => mau.name === mausac1
      );

      if (mauHienTai) {
        // Nếu màu hiện tại vẫn tồn tại trong dung lượng mới
        setmausac1(mauHienTai.name);
        setidmausac(mauHienTai._id);
        setpricemausac(mauHienTai.price);
        setkhuyenmai(mauHienTai.khuyenmai);
        setgiagoc(mauHienTai.giagoc);
        newMauSacId = mauHienTai._id;
        newMauSacName = mauHienTai.name;
      } else if (dungLuongMoi.mausac.length > 0) {
        // Nếu không, dùng màu đầu tiên trong dung lượng mới
        setmausac1(dungLuongMoi.mausac[0].name);
        setidmausac(dungLuongMoi.mausac[0]._id);
        setpricemausac(dungLuongMoi.mausac[0].price);
        setkhuyenmai(dungLuongMoi.mausac[0].khuyenmai);
        setgiagoc(dungLuongMoi.mausac[0].giagoc);
        newMauSacId = dungLuongMoi.mausac[0]._id;
        newMauSacName = dungLuongMoi.mausac[0].name;
      } else {
        console.error("Dung lượng này không có màu sắc nào");
        setIsStockLoading(false);
        setProcessingCapacityChange(false);
        return;
      }

      // Chủ động fetch tồn kho với thông tin mới
      if (idsanpham && id && newMauSacId) {
        console.log(
          `Kiểm tra tồn kho với: SP=${idsanpham}, DL=${id}, MS=${newMauSacId}`
        );

        fetch(`http://localhost:3005/stock/${idsanpham}/${id}/${newMauSacId}`)
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Không thể kiểm tra tồn kho");
          })
          .then((data) => {
            console.log(
              `Kết quả tồn kho cho ${name} - ${newMauSacName}:`,
              data
            );
            if (data.unlimitedStock) {
              setQuantity("Không giới hạn");
            } else {
              setQuantity(data.stock);
            }
          })
          .catch((error) => {
            console.error("Lỗi khi kiểm tra tồn kho:", error);
            setQuantity(0);
          })
          .finally(() => {
            setIsStockLoading(false);
            setProcessingCapacityChange(false);
          });
      } else {
        setIsStockLoading(false);
        setProcessingCapacityChange(false);
      }

      // Cập nhật ảnh màu sắc cho màu mới
      if (newMauSacId) {
        fetch(`http://localhost:3005/getanhmausac/${newMauSacId}`)
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Không thể lấy ảnh màu sắc");
          })
          .then((data) => {
            setanhmausac(data);
          })
          .catch((error) => {
            console.error("Lỗi khi lấy ảnh màu sắc:", error);
          });
      }
    },
    [dungluong, idsanpham, mausac1, processingCapacityChange]
  );

  const fetchdungluong = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/dungluongmay/${loaisp}`
      );
      if (response.ok) {
        const data = await response.json();
        setdungluong(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dung lượng:", error);
    }
  }, [loaisp]);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3005/chitietsanpham/${tieude}`
      );
      const data = await response.json();
      if (response.ok) {
        setProduct(data);
        setidsanpham(data._id);
        setnamesanpham(data.name);
        setimgsanpham(data.image);
      } else {
        console.error("Không tìm thấy sản phẩm");
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tieude]);

  const fetchanhmausac = useCallback(async () => {
    try {
      if (!idmausac) return;

      const response = await fetch(
        `http://localhost:3005/getanhmausac/${idmausac}`
      );
      const data = await response.json();
      if (response.ok) {
        setanhmausac(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy ảnh màu sắc:", error);
    }
  }, [idmausac]);

  // Tối ưu hàm fetch đánh giá sản phẩm
  const fetchProductRatings = useCallback(async () => {
    if (!idsanpham) return;

    try {
      const response = await axios.get(
        `http://localhost:3005/product-rating/${idsanpham}`
      );
      if (response.data && response.data.success) {
        setProductRatings(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
    }
  }, [idsanpham]);

  // Khởi tạo dữ liệu ban đầu
  useEffect(() => {
    fetchdungluong();
    fetchProduct();
    fetchTechSpecs();
  }, [fetchdungluong, fetchProduct, fetchTechSpecs]);

  // Set initial selection when dungluong data loads
  useEffect(() => {
    if (dungluong.length > 0) {
      const initialDungluong = dungluong[0];
      setdungluong1(initialDungluong.name);
      setiddungluong(initialDungluong._id);

      if (initialDungluong.mausac.length > 0) {
        const initialMausac = initialDungluong.mausac[0];
        setmausac1(initialMausac.name);
        setidmausac(initialMausac._id);
        setpricemausac(initialMausac.price);
        setkhuyenmai(initialMausac.khuyenmai);
        setgiagoc(initialMausac.giagoc);

        // Tải tồn kho cho lựa chọn ban đầu
        setTimeout(() => {
          if (idsanpham && initialDungluong._id && initialMausac._id) {
            fetchStock();
          }
        }, 100);
      }
    }
  }, [dungluong, idsanpham, fetchStock]);

  useEffect(() => {
    fetchanhmausac();
  }, [fetchanhmausac]);

  useEffect(() => {
    if (idsanpham) {
      fetchProductRatings();
    }
  }, [idsanpham, fetchProductRatings]);

  // Xử lý thêm vào giỏ hàng và mua ngay
  const handleAddToCart = useCallback(
    async (buyNow = false) => {
      if (!dungluong1) {
        alert("Vui lòng chọn dung lượng!");
        return;
      }

      if (!mausac1) {
        alert("Vui lòng chọn màu sắc!");
        return;
      }

      const dungLuongHienTai = dungluong.find((dl) => dl.name === dungluong1);
      const validColors = dungLuongHienTai
        ? dungLuongHienTai.mausac.map((mau) => mau.name)
        : [];

      if (!validColors.includes(mausac1)) {
        alert("Màu sắc không hợp lệ với dung lượng đã chọn!");
        return;
      }

      if (!pricemausac) {
        alert("Vui lòng chọn giá phù hợp với màu sắc!");
        return;
      }

      // Kiểm tra tồn kho trước khi thêm vào giỏ hàng
      setIsStockLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3005/stock/${idsanpham}/${iddungluong}/${idmausac}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          alert(`Lỗi: ${errorData.message || "Không thể kiểm tra tồn kho"}`);
          setIsStockLoading(false);
          return;
        }

        const stockData = await response.json();

        // Kiểm tra tồn kho
        if (
          stockData.stock === 0 ||
          stockData.stock === "0" ||
          stockData.stock === "Hết hàng"
        ) {
          alert("Sản phẩm đã hết hàng!");
          setIsStockLoading(false);
          return;
        }

        const newItem = {
          idsanpham,
          namesanpham,
          imgsanpham,
          iddungluong,
          dungluong: dungluong1,
          mausac: mausac1,
          idmausac: idmausac,
          pricemausac,
          soluong: 1, // Mặc định thêm 1 sản phẩm
        };

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (buyNow) {
          // Mua ngay: kiểm tra tồn tại
          const isExist = cart.some(
            (item) =>
              item.idsanpham === idsanpham &&
              item.dungluong === dungluong1 &&
              item.mausac === mausac1
          );

          if (!isExist) {
            cart.push(newItem);
            localStorage.setItem("cart", JSON.stringify(cart));
            navigate("/cart");
          } else {
            alert("Sản phẩm này đã có trong giỏ hàng!");
            navigate("/cart");
          }
        } else {
          // Thêm vào giỏ hàng
          const existingItemIndex = cart.findIndex(
            (item) =>
              item.idsanpham === idsanpham &&
              item.dungluong === dungluong1 &&
              item.mausac === mausac1
          );

          if (existingItemIndex === -1) {
            cart.push(newItem);
            localStorage.setItem("cart", JSON.stringify(cart));
            alert("Đã thêm sản phẩm vào giỏ hàng!");
          } else {
            // Nếu sản phẩm đã tồn tại, kiểm tra có thể tăng số lượng không
            const currentQuantity = cart[existingItemIndex].soluong || 1;

            if (
              stockData.unlimitedStock ||
              stockData.stock === "Không giới hạn" ||
              stockData.stock > currentQuantity
            ) {
              cart[existingItemIndex].soluong = currentQuantity + 1;
              localStorage.setItem("cart", JSON.stringify(cart));
              alert("Đã tăng số lượng sản phẩm trong giỏ hàng!");
            } else {
              alert("Đã đạt số lượng tối đa có thể mua cho sản phẩm này!");
            }
          }
        }

        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        console.error("Lỗi khi kiểm tra tồn kho:", error);
        alert("Có lỗi xảy ra, vui lòng thử lại sau!");
      } finally {
        setIsStockLoading(false);
      }
    },
    [
      dungluong1,
      mausac1,
      pricemausac,
      dungluong,
      idsanpham,
      namesanpham,
      imgsanpham,
      iddungluong,
      idmausac,
      navigate,
    ]
  );

  // Function to display stock status with appropriate styling
  const renderStockStatus = useCallback(() => {
    if (isStockLoading) {
      return <span className="loading-stock">Đang kiểm tra tồn kho...</span>;
    } else if (quantity === null) {
      return <span className="loading-stock">Chưa có thông tin</span>;
    } else if (quantity === 0 || quantity === "0" || quantity === "Hết hàng") {
      return <span className="out-of-stock">Hết hàng</span>;
    } else if (quantity < 5 && quantity !== "Không giới hạn") {
      return <span className="low-stock">Sắp hết hàng (Còn {quantity})</span>;
    } else {
      return <span className="in-stock">Còn hàng</span>;
    }
  }, [quantity, isStockLoading]);

  if (isLoading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }

  if (!product) {
    return <div className="error-container">Không tìm thấy sản phẩm!</div>;
  }

  return (
    <div className="container-chitiet">
      <div className="stock-status">
        Tình trạng: <strong>{renderStockStatus()}</strong>
      </div>

      <Helmet>
        <title>{product.name} - Shopdunk</title>
      </Helmet>
      <ThanhDinhHuong
        breadcrumbs={[
          { label: "Trang Chủ", link: "/" },
          { label: product.name, link: `/chitietsanpham/${tieude}` },
        ]}
      />

      <div className="main">
        <div className="product-image">
          <div>
            <img src={product.image} alt={product.name} className="pdt-img" />
          </div>
          <div className="anhchay">
            <Slider {...settings}>
              {annhmausac.map((anh, index) => (
                <div className="banner_item" key={index}>
                  <img src={`${anh}`} alt="Banner 1" className="anhchay-img" />
                </div>
              ))}
            </Slider>
          </div>
        </div>

        <div className="product-detail">
          <div className="product-info">
            <div className="product-name-chitiet">{product.name}</div>
            <div className="divratedanhgia_container">
              <div className="divratedanhgia">
                <ProductRating
                  productId={idsanpham}
                  size="medium"
                  showCount={true}
                />
                <div className="danhgiarate">
                  Đánh giá
                  {productRatings && productRatings.totalRatings > 0 && (
                    <span className="rating-number">
                      {" "}
                      ({productRatings.totalRatings})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="chitietprice">
              <span className="current-price">
                {pricemausac ? pricemausac.toLocaleString() : 0}đ
              </span>
              {khuyenmai === 0 ? (
                <div></div>
              ) : (
                <span className="old-price">{giagoc.toLocaleString()}đ</span>
              )}
            </div>
            <div className="note_VAT">(Đã bao gồm VAT)</div>

            <div className="mausac_dungluong">
              <div className="note_tieude">Dung lượng:</div>

              <div className="dungluong_chitiet">
                {dungluong.map((item, index) => (
                  <div className="dungluong_container" key={index}>
                    <div
                      className={
                        dungluong1 === item.name
                          ? "dungluong_item dungluong_item_active"
                          : "dungluong_item"
                      }
                      onClick={() => handleChangeDungLuong(item._id, item.name)}
                    >
                      <span>
                        {processingCapacityChange && dungluong1 === item.name
                          ? "⟳ "
                          : ""}
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="note_tieude">Màu sắc:</div>

              <div className="mausac_chitiet">
                {dungluong.map((item, index) => (
                  <div className="dungluong_container" key={index}>
                    <div className="mausac_container">
                      {dungluong1 === item.name &&
                        item.mausac.map((mau, row) => (
                          <div
                            className={
                              mausac1 === mau.name
                                ? `border_mausac border_mausac1 ${
                                    processingColorChange ? "processing" : ""
                                  }`
                                : `border_mausac ${
                                    processingColorChange ? "disabled" : ""
                                  }`
                            }
                            key={row}
                            onClick={() => handleColorChange(mau)}
                          >
                            <div style={{ backgroundColor: `${mau.name}` }}>
                              {processingColorChange &&
                                mausac1 === mau.name && (
                                  <span className="color-loading-indicator">
                                    ⟳
                                  </span>
                                )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Tabs Navigation */}
          <div className="product-tabs">
            <div
              className={`product-tab ${activeTab === "mota" ? "active" : ""}`}
              onClick={() => setActiveTab("mota")}
            >
              Mô tả sản phẩm
            </div>
            <div
              className={`product-tab ${
                activeTab === "thongso" ? "active" : ""
              }`}
              onClick={() => setActiveTab("thongso")}
            >
              Thông số kỹ thuật
            </div>
            <div
              className={`product-tab ${
                activeTab === "chitiet" ? "active" : ""
              }`}
              onClick={() => setActiveTab("chitiet")}
            >
              Chi tiết sản phẩm
            </div>
            <div
              className={`product-tab ${
                activeTab === "danhgia" ? "active" : ""
              }`}
              onClick={() => setActiveTab("danhgia")}
            >
              Đánh giá ({productRatings?.totalRatings || 0})
            </div>
          </div>

          {/* Mô tả tab content */}
          <div
            className={`tab-content ${activeTab === "mota" ? "active" : ""}`}
          >
            <div className="short-des">
              <p className="title">
                <FontAwesomeIcon icon={faGift} />
                Ưu đãi
              </p>
              <div className="short-description">
                <div className="short-description-header">
                  <span>
                    ( Khuyến mãi dự kiến áp dụng{" "}
                    <strong>đến 23h59 | 28/2/2025</strong>&nbsp;)
                  </span>
                </div>
                <hr />
                <div style={{ display: "flex" }}>
                  <div className="short-description-content">
                    <div className="event_price">
                      Ưu đãi mùa yêu Valentine 10/2 - 17/2 giảm thêm
                    </div>
                    <div className="event_value">100,000 ₫</div>
                    <div>
                      Áp dụng màu Ultramarine (Xanh Lưu Ly). Được áp dụng cùng
                      ZaloPay. Không áp dụng cùng CTKM khác.
                    </div>
                  </div>
                </div>
                <hr />
                <p className="pchitiet">
                  <strong className="pstrong">
                    I. Ưu đãi thanh toán&nbsp;
                  </strong>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Hỗ trợ trả góp
                    <strong> 0% </strong>
                    lãi suất, 0 phụ phí
                    <span style={{ color: "#007edb" }}> (xem chi tiết)</span>
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Giảm đến
                    <strong> 400.000đ </strong>
                    khi thanh toán qua
                    <strong> QR ZaloPay </strong>
                    (SL có hạn)
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Giảm đến
                    <strong> 200.000đ </strong>
                    khi thanh toán qua
                    <strong> Kredivo </strong>
                  </span>
                </p>
                <p className="pchitiet">
                  <strong className="pstrong">II. Ưu đãi mua kèm &nbsp;</strong>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    <strong> Ốp chính hãng Apple iPhone 16 series </strong>
                    giảm
                    <strong> 100.000đ </strong>
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    <strong> Sản phẩm Apple, phụ kiên </strong>
                    giảm đên
                    <strong> 80% </strong>
                    <span style={{ color: "#007edb" }}>(xem chi tiết)</span>
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Mua combo phụ kiện
                    <strong> Non Apple </strong>
                    giảm đến
                    <strong> 200.000đ </strong>
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Giảm đến
                    <strong> 20% </strong>
                    khi mua các gói bảo hành
                    <span style={{ color: "#007edb" }}> (xem chi tiết)</span>
                  </span>
                </p>
                <p className="pchitiet">
                  <strong className="pstrong">III. Ưu đãi khác &nbsp;</strong>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Duy nhất tại ShopDunk, hỗ trợ mở thẻ tín dụng Sacombank hạn
                    mức lên tới
                    <strong> 25 triệu </strong>
                    dành cho HS-SV
                  </span>
                </p>
                <p className="pchitiet lh-2">
                  <span style={{ color: "#000000" }}>
                    <img src="/tichxanh.jpe" alt="" width={16} height={17} />
                    Trợ giá lên đời đến
                    <strong> 20% </strong>
                    <span style={{ color: "#007edb" }}>(xem chi tiết)</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Thông số kỹ thuật tab content */}
          <div
            className={`tab-content ${activeTab === "thongso" ? "active" : ""}`}
          >
            <div className="tech-specs">
              <h3 className="tech-specs-title">Thông số kỹ thuật</h3>
              <div className="tech-specs-content">
                {!techSpecs ? (
                  <p style={{ padding: "15px", textAlign: "center" }}>
                    Đang tải thông số kỹ thuật...
                  </p>
                ) : (
                  <table className="tech-specs-table">
                    <tbody>
                      {techSpecs.manhinh && (
                        <tr className="even-row">
                          <td className="spec-name">Công nghệ màn hình</td>
                          <td className="spec-value">{techSpecs.manhinh}</td>
                        </tr>
                      )}
                      {techSpecs.chip && (
                        <tr className="odd-row">
                          <td className="spec-name">Chip xử lý</td>
                          <td className="spec-value">{techSpecs.chip}</td>
                        </tr>
                      )}
                      {techSpecs.ram && (
                        <tr className="even-row">
                          <td className="spec-name">RAM</td>
                          <td className="spec-value">{techSpecs.ram}</td>
                        </tr>
                      )}
                      {techSpecs.dungluong && (
                        <tr className="odd-row">
                          <td className="spec-name">Dung lượng</td>
                          <td className="spec-value">{techSpecs.dungluong}</td>
                        </tr>
                      )}
                      {techSpecs.camera && (
                        <tr className="even-row">
                          <td className="spec-name">Camera</td>
                          <td className="spec-value">{techSpecs.camera}</td>
                        </tr>
                      )}
                      {techSpecs.pinsac && (
                        <tr className="odd-row">
                          <td className="spec-name">Pin và sạc</td>
                          <td className="spec-value">{techSpecs.pinsac}</td>
                        </tr>
                      )}
                      {techSpecs.congsac && (
                        <tr className="even-row">
                          <td className="spec-name">Cổng sạc</td>
                          <td className="spec-value">{techSpecs.congsac}</td>
                        </tr>
                      )}
                      {techSpecs.hang && (
                        <tr className="odd-row">
                          <td className="spec-name">Hãng sản xuất</td>
                          <td className="spec-value">{techSpecs.hang}</td>
                        </tr>
                      )}
                      {techSpecs.thongtin && (
                        <tr className="even-row">
                          <td className="spec-name">Thông tin khác</td>
                          <td className="spec-value">{techSpecs.thongtin}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Chi tiết sản phẩm tab content */}
          <div
            className={`tab-content ${activeTab === "chitiet" ? "active" : ""}`}
          >
            <div className="product-details">
              <div className="product-details-content">
                {product && product.content ? (
                  <div dangerouslySetInnerHTML={{ __html: product.content }} />
                ) : (
                  <p style={{ padding: "15px", textAlign: "center" }}>
                    Không có thông tin chi tiết.
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Đánh giá sản phẩm tab content */}
          <div
            className={`tab-content ${activeTab === "danhgia" ? "active" : ""}`}
          >
            <div className="product-ratings">
              <h3 className="ratings-title">Đánh giá từ khách hàng</h3>
              {productRatings?.totalRatings > 0 ? (
                <ProductRatingsContainer productId={idsanpham} />
              ) : (
                <p className="no-ratings">
                  Chưa có đánh giá nào cho sản phẩm này
                </p>
              )}
            </div>
          </div>
          <div
            className={`divbtn_muagay ${
              quantity === 0 ||
              quantity === "0" ||
              quantity === "Hết hàng" ||
              isStockLoading
                ? "disabled"
                : ""
            }`}
            onClick={handleAddToCart}
          >
            {isStockLoading
              ? "ĐANG KIỂM TRA KHO"
              : quantity === 0 || quantity === "0" || quantity === "Hết hàng"
              ? "HẾT HÀNG"
              : "MUA NGAY"}
          </div>
          <div className="short-des">
            <p className="pchitiet lh-2">
              <span style={{ color: "#000000" }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="icontichxanh"
                />
                <span>
                  {" "}
                  Bộ sản phẩm gồm: Hộp, Sách hướng dẫn, Cây lấy sim, Cáp Type C
                </span>
              </span>
            </p>
            <p className="pchitiet lh-2">
              <span style={{ color: "#000000" }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="icontichxanh"
                />
                <span>
                  {" "}
                  Miễn phí 1 đổi 1 trong 30 ngày đầu tiên (nếu có lỗi do NSX)
                </span>
              </span>
            </p>
            <p className="pchitiet lh-2">
              <span style={{ color: "#000000" }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="icontichxanh"
                />
                <span> Bảo hành chính hãng 1 năm</span>
                <span style={{ color: "#007edb" }}> (chi tiết)</span>
              </span>
            </p>
            <p className="pchitiet lh-2">
              <span style={{ color: "#000000" }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="icontichxanh"
                />
                <span> Giao hàng nhanh toàn quốc</span>
                <span style={{ color: "#007edb" }}> (chi tiết)</span>
              </span>
            </p>
            <p className="pchitiet lh-2">
              <span style={{ color: "#000000" }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="icontichxanh"
                />
                <span> Tax Refund For Foreingers</span>
                <span style={{ color: "#007edb" }}> (chi tiết)</span>
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="category-sidebar">
        <ListBlog />
      </div>
      <RelatedProducts category={loaisp} currentProductId={idsanpham} />
    </div>
  );
};

export default ChiTietLayout;
