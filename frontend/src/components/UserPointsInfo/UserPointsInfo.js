import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './UserPointsInfo.scss';
import { useUserContext } from '../../context/Usercontext';

const UserPointsInfo = () => {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getUserPhone, getUserPoints, refreshPoints } = useUserContext();
  
  useEffect(() => {
    // First try to get points from context
    const contextPoints = getUserPoints();
    if (contextPoints) {
      setPoints(contextPoints);
      setLoading(false);
      return;
    }
    
    const phone = getUserPhone();
    if (!phone) {
      setLoading(false);
      return;
    }
    
    const fetchUserPoints = async () => {
      try {
        setLoading(true);
        // Try to fetch by phone first
        const response = await axios.get(`http://localhost:3005/loyalty/user-points/${phone}`);
        
        if (response.data.success && response.data.hasPoints) {
          setPoints(response.data.points);
          return;
        }
        
        // If not found by phone, try by email
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData?.email) {
            const emailResponse = await axios.get(`http://localhost:3005/loyalty/user-points-by-email/${userData.email}`);
            if (emailResponse.data.success && emailResponse.data.hasPoints) {
              setPoints(emailResponse.data.points);
              return;
            }
          }
          
          // Try by userId as last resort
          const userId = userData?._id || userData?.user?._id || userData?.id || userData?.user?.id;
          if (userId) {
            const userIdResponse = await axios.get(`http://localhost:3005/loyalty/user-points/${userId}`);
            if (userIdResponse.data.success && userIdResponse.data.hasPoints) {
              setPoints(userIdResponse.data.points);
              return;
            }
          }
        }
        
        // Default to 0 points if all methods fail
        setPoints({ availablePoints: 0 });
      } catch (error) {
        console.error('Error fetching user points:', error);
        setPoints({ availablePoints: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPoints();
    
    // Auto-refresh points every 5 minutes
    const intervalId = setInterval(() => {
      refreshPoints();
      const updatedPoints = getUserPoints();
      if (updatedPoints) {
        setPoints(updatedPoints);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [getUserPhone, getUserPoints, refreshPoints]);
  
  if (loading) {
    return (
      <Link to="/diem-thuong" className="user-points-info loading">
        <FontAwesomeIcon icon={faSpinner} spin />
      </Link>
    );
  }
  
  if (!points) {
    return null;
  }
  
  return (
    <Link to="/diem-thuong" className="user-points-info">
      <div className="points-icon">
        <FontAwesomeIcon icon={faCoins} />
      </div>
      <div className="points-details">
        <div className="points-value">
          {Number(points?.availablePoints || 0).toLocaleString('vi-VN')}
        </div>
        <div className="points-label">Điểm thưởng</div>
      </div>
    </Link>
  );
};

export default UserPointsInfo;