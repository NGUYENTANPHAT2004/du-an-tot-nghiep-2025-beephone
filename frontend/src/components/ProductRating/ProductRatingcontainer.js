import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import moment from "moment";
import "moment/locale/vi";
import "./ProductRating.scss";

// Set moment to use Vietnamese locale
moment.locale("vi");

const ProductRatingsContainer = ({ productId }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [ratingStats, setRatingStats] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  useEffect(() => {
    const fetchRatings = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        // Use the correct endpoint from our OrderRatingRoutes.js
        const response = await axios.get(
          `http://localhost:3005/product-rating/${productId}`
        );

        if (response.data && response.data.success) {
          // Get the reviews from the correct endpoint
          const reviewsResponse = await axios.get(
            `http://localhost:3005/product-reviews/${productId}`
          );

          if (reviewsResponse.data && reviewsResponse.data.success) {
            setRatings(reviewsResponse.data.reviews || []);
          }

          // Set average rating
          setAverageRating(response.data.averageRating || 0);

          // Set total ratings
          setTotalRatings(response.data.totalRatings || 0);

          // Set rating stats
          setRatingStats(
            response.data.starCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          );
        }
      } catch (error) {
        console.error("Error fetching product ratings:", error);
        // Set default values on error
        setRatings([]);
        setAverageRating(0);
        setTotalRatings(0);
        setRatingStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [productId]);

  // Helper function to render star rating display
  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <FontAwesomeIcon
          key={index}
          icon={index < rating ? solidStar : regularStar}
          className={index < rating ? "star-active" : "star-inactive"}
        />
      ));
  };

  // Render rating distribution bar
  const renderRatingDistribution = () => {
    if (totalRatings === 0) return null;

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = ratingStats[stars] || 0;
          const percentage =
            totalRatings > 0 ? (count / totalRatings) * 100 : 0;

          return (
            <div key={stars} className="rating-bar">
              <span className="rating-star-count">{stars}</span>
              <FontAwesomeIcon icon={solidStar} className="star-icon" />
              <div className="rating-bar-container">
                <div
                  className="rating-bar-fill"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="rating-count-number">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ratings-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải đánh giá...</p>
      </div>
    );
  }

  if (totalRatings === 0) {
    return (
      <div className="no-ratings">
        <div className="no-ratings-icon">
          <FontAwesomeIcon icon={regularStar} size="2x" />
        </div>
        <p>Chưa có đánh giá nào cho sản phẩm này</p>
        <p className="no-ratings-sub">
          Hãy là người đầu tiên đánh giá sản phẩm
        </p>
      </div>
    );
  }

  // Show limited ratings or all based on state
  const displayedRatings = showAllRatings ? ratings : ratings.slice(0, 3);

  return (
    <div className="product-ratings-container">
      <div className="ratings-summary">
        <div className="rating-overview">
          <div className="average-rating">
            <div className="rating-value">{averageRating.toFixed(1)}</div>
            <div className="rating-max">/ 5</div>
          </div>
          <div className="rating-stars-display">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="total-ratings">({totalRatings} đánh giá)</div>
        </div>

        {renderRatingDistribution()}
      </div>

      <h3 className="ratings-list-title">Đánh giá từ khách hàng</h3>

      <div className="product-ratings-list">
        {displayedRatings.map((rating, index) => (
          <div key={index} className="rating-item">
            <div className="rating-header">
              <div className="rating-user-info">
                <span className="rating-avatar">
                  {rating.tenkhach.charAt(0).toUpperCase()}
                </span>
                <span className="rating-user">{rating.tenkhach}</span>
              </div>
              <span className="rating-date">
                {moment(rating.date).format("DD/MM/YYYY")}
              </span>
            </div>
            <div className="rating-stars-display">
              {renderStars(rating.rating)}
            </div>
            {(rating.dungluong || rating.mausac) && (
              <div className="product-variant">
                <span className="variant-label">Phiên bản:</span>
                {rating.dungluong}
                {rating.mausac ? ` - ${rating.mausac}` : ""}
              </div>
            )}
            {rating.content && (
              <div className="rating-comment">{rating.content}</div>
            )}
            {rating.verified && (
              <div className="verified-purchase">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Đã mua hàng</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {ratings.length > 3 && (
        <button
          className="show-more-ratings"
          onClick={() => setShowAllRatings(!showAllRatings)}
        >
          {showAllRatings
            ? "Thu gọn"
            : `Xem thêm ${ratings.length - 3} đánh giá`}
        </button>
      )}
    </div>
  );
};

export default ProductRatingsContainer;
