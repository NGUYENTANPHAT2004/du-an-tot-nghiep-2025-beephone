import React, { useState } from "react";
import "./DanhGiaLayout.scss";

const DanhGiaLayout = () => {
  // Khởi tạo state
  const [rating, setRating] = useState(0);
  const [tenkhach, setTenkhach] = useState("");
  const [content, setcontent] = useState("");

  // Hàm chọn số sao
  const handleRating = (value) => {
    setRating(value);
  };

  return (
    <div className="review-container">
      <div className="review-rating">
        <h2 className="title_rate">Đánh giá danh mục</h2>

        <div className="review-form">
          <h3 className="form-title">Viết đánh giá của riêng bạn</h3>
          <div className="div_chatluong_star">
            <label>Chất lượng*:</label>
            <div className="rating-select">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${rating >= star ? "starselected" : ""}`}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="div_danhgia_input">
            <label>Tên của bạn</label>
            <input
              type="text"
              value={tenkhach}
              className="input-name"
              onChange={(e) => setTenkhach(e.target.value)}
            />
          </div>
          <div className="div_danhgia_input">
            <label>Đánh giá danh mục</label>
            <textarea
              className="input-review"
              value={content}
              onChange={(e) => setcontent(e.target.value)}
            ></textarea>
          </div>

          <button className="submit-btn">Gửi</button>
        </div>
      </div>
    </div>
  );
};

export default DanhGiaLayout;
