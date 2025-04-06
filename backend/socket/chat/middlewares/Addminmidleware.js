/**
 * Middleware xác thực quyền quản trị (đã vô hiệu hóa)
 */

/**
 * Xác thực quyền quản trị (bỏ qua xác thực)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const authenticateAdmin = async (req, res, next) => {
    // Không xác thực nữa, cho phép truy cập tự do
    next();
  };
  
  /**
   * Middleware socket.io cho xác thực admin (bỏ qua xác thực)
   * @param {Object} socket - Socket.io socket
   * @param {Function} next - Socket.io next
   */
  const adminMiddleware = async (socket, next) => {
    // Không xác thực, cho phép kết nối tự do
    socket.isAdmin = true;
    socket.user = { role: 'admin' };  // Giả mạo vai trò admin
    next();
  };
  
  /**
   * Middleware API kiểm tra API key cho admin (bỏ qua xác thực)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  const verifyAdminAPIKey = (req, res, next) => {
    // Không xác thực API key nữa, cho phép truy cập tự do
    next();
  };
  
  module.exports = {
    authenticateAdmin,
    adminMiddleware,
    verifyAdminAPIKey
  };