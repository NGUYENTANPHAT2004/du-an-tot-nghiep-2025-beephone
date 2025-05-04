import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import './styles.scss';

const StarRating = ({rating,totalRating}) => {
    return (
        <div className="star-rating-container">
            <div className="star-rating">
                {[1,2,3,4,5].map((star) =>(
                    <FontAwesomeIcon
                    key={star}
                    icon={faStar}
                    className={star<=rating?'star-active':'star-inactive'}
                    />
                ))}
            </div>
            <div className="rating-count">
        Đánh giá ({totalRatings})
      </div>
        </div>
    )
}
export default StarRating;