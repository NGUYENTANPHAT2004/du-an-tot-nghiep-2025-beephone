import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';
import moment from 'moment';
import 'moment/locale/vi';
import './ProductRating.scss';

// Set moment to use Vietnamese locale
moment.locale('vi');

const ProductRatingsContainer = ({ productId }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [ratingStats, setRatingStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRatings = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:3005/order-rating/product/${productId}`);
        
        if (response.data && response.data.success) {
          // Extract data directly from the response following the API structure
          setRatings(response.data.ratings || []);
          setAverageRating(response.data.averageRating || 0);
          setTotalRatings(response.data.totalRatings || 0);
          setRatingStats(response.data.ratingStats || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        } else {
          setError('Invalid response format');
          console.warn('Invalid rating response format:', response.data);
          // Set defaults
          setRatings([]);
          setAverageRating(0);
          setTotalRatings(0);
          setRatingStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        }
      } catch (error) {
        setError(`Error: ${error.message}`);
        console.error('Error fetching product ratings:', error);
        // Set defaults on error
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
    return Array(5).fill(0).map((_, index) => (
      <FontAwesomeIcon 
        key={index}
        icon={index < rating ? solidStar : regularStar}
        className={index < rating ? 'star-active' : 'star-inactive'}
      />
    ));
  };

  // Render rating distribution bar
  const renderRatingDistribution = () => {
    if (totalRatings === 0) return null;
    
    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = ratingStats[stars] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={stars} className="rating-bar">
              <div className="rating-label">
                {stars} <FontAwesomeIcon icon={solidStar} className="star-icon" />
              </div>
              <div className="rating-bar-container">
                <div 
                  className="rating-bar-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="rating-count">{count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="ratings-loading">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="ratings-error">Không thể tải đánh giá. Vui lòng thử lại sau.</div>;
  }

  if (totalRatings === 0) {
    return <div className="no-ratings">Chưa có đánh giá nào cho sản phẩm này</div>;
  }

  // Show limited ratings or all based on state
  const displayedRatings = showAllRatings ? ratings : ratings.slice(0, 3);

  return (
    <div className="product-ratings-container">
      <div className="ratings-summary">
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{averageRating.toFixed(1)}</span> / 5
          </div>
          <div className="rating-stars-display">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="total-ratings">
            ({totalRatings} đánh giá)
          </div>
        </div>
        
        {renderRatingDistribution()}
      </div>
      
      <div className="product-ratings-list">
        {displayedRatings.map((rating, index) => (
          <div key={index} className="rating-item">
            <div className="rating-header">
              <span className="rating-user">{rating.tenkhach}</span>
              <span className="rating-date">{moment(rating.date).format('DD/MM/YYYY')}</span>
            </div>
            <div className="rating-stars-display">
              {renderStars(rating.rating)}
            </div>
            {rating.dungluong && rating.mausac && (
              <div className="rating-variant">
                Phiên bản: {rating.dungluong} - {rating.mausac}
              </div>
            )}
            {rating.content && (
              <div className="rating-comment">{rating.content}</div>
            )}
            {rating.verified && (
              <div className="verified-purchase">✓ Đã mua hàng</div>
            )}
          </div>
        ))}
      </div>
      
      {ratings.length > 3 && (
        <button 
          className="show-more-ratings" 
          onClick={() => setShowAllRatings(!showAllRatings)}
        >
          {showAllRatings ? 'Thu gọn' : `Xem thêm ${ratings.length - 3} đánh giá`}
        </button>
      )}
    </div>
  );
};

export default ProductRatingsContainer;