/**
 * Middleware xác thực người dùng
 */
const jwt = require('jsonwebtoken');
const { User } = require('../../../models/user.model');
// Secret key cho JWT - load from environment variable
const jwtSecret = process.env.JWT_SECRET || "NzNkMjY0NjMtMmU4NS00OWRlLTk3OWItOTM5OTRjZjFlN2Iw";

/**
 * Xác thực token JWT
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header hoặc cookie
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.token || 
                  req.query?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Tìm người dùng
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    // Kiểm tra trạng thái người dùng
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }
    
    // Lưu thông tin người dùng vào request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ Lỗi xác thực token:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin người dùng từ token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
 */
const getUserByToken = async (token) => {
  try {
    if (!token) return null;
    
    // Xác thực token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Tìm người dùng
    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') return null;
    
    return user;
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin từ token:', error);
    return null;
  }
};

/**
 * Middleware socket.io cho xác thực người dùng
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Socket.io next
 */
const authMiddleware = async (socket, next) => {
  try {
    // Lấy token từ handshake
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      // Cho phép kết nối mà không có xác thực (khách)
      socket.user = null;
      socket.isAuthenticated = false;
      return next();
    }
    
    try {
      // Xác thực token
      const decoded = jwt.verify(token, jwtSecret);
      
      // Tìm người dùng
      const user = await User.findById(decoded.id);
      
      if (!user || user.status !== 'active') {
        socket.user = null;
        socket.isAuthenticated = false;
      } else {
        socket.user = user;
        socket.isAuthenticated = true;
        socket.userId = user._id.toString();
      }
    } catch (error) {
      console.error('Lỗi xác thực socket:', error);
      socket.user = null;
      socket.isAuthenticated = false;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Lỗi xác thực socket:', error);
    next(new Error('Lỗi xác thực: ' + error.message));
  }
};

/**
 * Hàm kiểm tra quyền truy cập cho các API cần xác thực
 * @param {Array<string>} allowedRoles - Danh sách vai trò được phép truy cập
 * @returns {Function} - Middleware kiểm tra quyền
 */
const checkRole = (allowedRoles = ['admin', 'manager']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không đủ quyền thực hiện hành động này'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  getUserByToken,
  authMiddleware,
  checkRole
};