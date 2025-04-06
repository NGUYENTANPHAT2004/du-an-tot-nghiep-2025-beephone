const express = require('express');
const router = express.Router();
const chatController = require('../socket/chat/ChatController');
const trainingController = require('../socket/chat/trainingController');
const { ChatSession, ChatMessage, ChatTraining, ChatAnalytics } = require('../models/Chatmodel');

/**
 * API endpoint cho chatbot (phục vụ môi trường không hỗ trợ WebSocket)
 */
router.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, userId, guestInfo = null } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu nội dung tin nhắn'
      });
    }
    
    // Thông tin client
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Nếu chưa có sessionId, tạo phiên mới
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const userData = userId ? { userId } : { guestInfo };
      const session = await chatController.createSession(userData, clientInfo);
      currentSessionId = session._id.toString();
    }
    
    // Xử lý tin nhắn
    const response = await chatController.processMessage(
      currentSessionId,
      message,
      userId,
      guestInfo,
      clientInfo
    );
    
    // Trả về kết quả
    res.json({
      success: true,
      sessionId: currentSessionId,
      response: {
        id: response.id,
        message: response.message,
        source: response.source,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Lỗi API chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý tin nhắn',
      error: error.message
    });
  }
});

/**
 * Lấy lịch sử chat của một phiên
 */
router.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Kiểm tra phiên chat
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên chat'
      });
    }
    
    // Lấy lịch sử tin nhắn
    const messages = await chatController.getSessionHistory(sessionId);
    
    res.json({
      success: true,
      sessionId,
      session,
      messages
    });
  } catch (error) {
    console.error('❌ Lỗi lấy lịch sử chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử chat',
      error: error.message
    });
  }
});

/**
 * Gửi phản hồi về chất lượng tin nhắn
 */
router.post('/api/chat/feedback', async (req, res) => {
  try {
    const { messageId, isHelpful, comment } = req.body;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID tin nhắn'
      });
    }
    
    const feedback = await chatController.saveFeedback(
      messageId,
      isHelpful,
      comment || ''
    );
    
    res.json({
      success: true,
      messageId,
      feedback
    });
  } catch (error) {
    console.error('❌ Lỗi lưu phản hồi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lưu phản hồi',
      error: error.message
    });
  }
});

/**
 * Kết thúc phiên chat
 */
router.post('/api/chat/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await chatController.endSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: 'Đã kết thúc phiên chat',
      session
    });
  } catch (error) {
    console.error('❌ Lỗi kết thúc phiên chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kết thúc phiên chat',
      error: error.message
    });
  }
});

/**
 * Tạo phiên chat mới
 */
router.post('/api/chat/session', async (req, res) => {
  try {
    const { userId, guestInfo } = req.body;
    
    // Thông tin client
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Tạo phiên chat mới
    const userData = userId ? { userId } : { guestInfo };
    const session = await chatController.createSession(userData, clientInfo);
    
    res.json({
      success: true,
      message: 'Đã tạo phiên chat mới',
      sessionId: session._id,
      session
    });
  } catch (error) {
    console.error('❌ Lỗi tạo phiên chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo phiên chat',
      error: error.message
    });
  }
});

/**
 * API ROUTES CHO ADMIN (Đã bỏ xác thực admin)
 */

/**
 * Lấy tất cả dữ liệu training
 */
router.get('/api/admin/chat/training', async (req, res) => {
  try {
    // Lấy và truyền tất cả các tham số từ query string
    const result = await trainingController.getAllTraining(req.query);
    
    res.json({
      success: true,
      count: result.count,
      data: result.data
    });
  } catch (error) {
    console.error('❌ Lỗi lấy dữ liệu training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy dữ liệu training',
      error: error.message
    });
  }
});

/**
 * Thêm dữ liệu huấn luyện mẫu (để kiểm tra)
 */
router.post('/api/admin/chat/training/samples', async (req, res) => {
  try {
    const result = await trainingController.addSampleTrainingData();
    
    res.json({
      success: true,
      message: 'Đã thêm dữ liệu mẫu thành công',
      result
    });
  } catch (error) {
    console.error('❌ Lỗi thêm dữ liệu mẫu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm dữ liệu mẫu',
      error: error.message
    });
  }
});

/**
 * Lấy chi tiết dữ liệu training
 */
router.get('/api/admin/chat/training/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await trainingController.getTrainingDetail(id);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết training',
      error: error.message
    });
  }
});

/**
 * Tạo dữ liệu training mới
 */
router.post('/api/admin/chat/training', async (req, res) => {
  try {
    // Bỏ qua UserId vì không cần xác thực người dùng
    const userId = null;
    
    const result = await trainingController.createTraining(req.body, userId);
    
    res.json({
      success: true,
      message: 'Đã tạo dữ liệu training mới',
      data: result
    });
  } catch (error) {
    console.error('❌ Lỗi tạo dữ liệu training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo dữ liệu training',
      error: error.message
    });
  }
});

/**
 * Cập nhật dữ liệu training
 */
router.put('/api/admin/chat/training/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = null; // Bỏ qua UserId
    
    const result = await trainingController.updateTraining(id, req.body, userId);
    
    res.json({
      success: true,
      message: 'Đã cập nhật dữ liệu training',
      data: result
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật dữ liệu training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật dữ liệu training',
      error: error.message
    });
  }
});

/**
 * Xóa dữ liệu training
 */
router.delete('/api/admin/chat/training/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await trainingController.deleteTraining(id);
    
    res.json({
      success: true,
      message: 'Đã xóa dữ liệu training',
      id
    });
  } catch (error) {
    console.error('❌ Lỗi xóa dữ liệu training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa dữ liệu training',
      error: error.message
    });
  }
});

/**
 * Import dữ liệu training từ file
 */
router.post('/api/admin/chat/training/import', async (req, res) => {
  try {
    const { items } = req.body;
    const userId = null; // Bỏ qua UserId
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }
    
    const result = await trainingController.importTrainingData(items, userId);
    
    res.json({
      success: true,
      message: `Đã import ${result.success}/${result.total} dữ liệu training`,
      result
    });
  } catch (error) {
    console.error('❌ Lỗi import dữ liệu training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi import dữ liệu training',
      error: error.message
    });
  }
});

/**
 * Cập nhật trạng thái kích hoạt của dữ liệu training
 */
router.patch('/api/admin/chat/training/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số isActive'
      });
    }
    
    const result = await trainingController.toggleActiveStatus(id, isActive);
    
    res.json({
      success: true,
      message: `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} dữ liệu training`,
      data: result
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật trạng thái training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái training',
      error: error.message
    });
  }
});

/**
 * Lấy tất cả danh mục trong dữ liệu training
 */
router.get('/api/admin/chat/categories', async (req, res) => {
  try {
    const categories = await trainingController.getAllCategories();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh mục training:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh mục training',
      error: error.message
    });
  }
});

module.exports = router;