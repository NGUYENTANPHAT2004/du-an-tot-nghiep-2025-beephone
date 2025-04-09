import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.scss";

const ProductCard = ({ sanpham, nametheloai, page, setPage, totalPages }) => {
  const navigate = useNavigate();

  return (
    <div
      className="product-card"
      onClick={() =>
        navigate(`/chitietsanpham/${nametheloai}/${sanpham.namekhongdau}`)
      }
    >
      {sanpham.khuyenmai === 0 ? (
        <div></div>
      ) : (
        <div class="price-ratio-container">Giảm {sanpham.khuyenmai}%</div>
      )}
      <div className="product_tag">
        <img className="discount-logo2" src="/tra-gop-0.png" alt="Giảm giá" />
      </div>
      <img className="product-image" src={sanpham.image} alt={sanpham.name} />
      <div className="name-sp">{sanpham.name}</div>
      <div className="original-price">
        <div className="price">{sanpham.price.toLocaleString()}đ</div>
        {sanpham.khuyenmai === 0 ? (
          <div></div>
        ) : (
          <span className="old-price">{sanpham.giagoc.toLocaleString()}đ</span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
