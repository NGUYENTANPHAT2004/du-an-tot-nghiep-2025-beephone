import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './UserPointsInfo.scss';
import { useUserPoints } from '../../hooks/useUserPoints';

const UserPointsInfo = () => {
  const { userPoints, loading } = useUserPoints();
  
  if (loading) {
    return (
      <Link to="/diem-thuong" className="user-points-info loading">
        <FontAwesomeIcon icon={faSpinner} spin />
      </Link>
    );
  }
  
  if (!userPoints) {
    return null;
  }
  
  return (
    <Link to="/diem-thuong" className="user-points-info">
      <div className="points-icon">
        <FontAwesomeIcon icon={faCoins} />
      </div>
      <div className="points-details">
        <div className="points-value">
          {Number(userPoints?.availablePoints || 0).toLocaleString('vi-VN')}
        </div>
        <div className="points-label">Điểm thưởng</div>
      </div>
    </Link>
  );
};

export default UserPointsInfo;
