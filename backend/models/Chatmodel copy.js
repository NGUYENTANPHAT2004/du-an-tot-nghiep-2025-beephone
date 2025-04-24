const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema cho lưu trữ tin nhắn chat
 */
const chatMessageSchema = new Schema({
  // ID người dùng (nếu đã đăng nhập)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  
  // Thông tin người dùng chưa đăng nhập
  guestInfo: {
    name: String,
    phone: String
  },
  
  // Nội dung tin nhắn
  message: {
    type: String,
    required: true
  },
  
  // Loại người gửi (user hoặc ai)
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  
  // Phản hồi từ AI
  response: {
    text: String,
    source: {
      type: String,
      enum: ['training', 'groq', 'claude', 'fallback'],
      default: 'fallback'
    },
    trainingMatchId: String // ID của dữ liệu huấn luyện nếu sử dụng
  },
  
  // Đánh dấu nếu tin nhắn không thể trả lời được
  isUnanswered: {
    type: Boolean,
    default: false
  },
  
  // Đánh giá của người dùng về câu trả lời
  feedback: {
    isHelpful: Boolean,
    comment: String
  },
  
  // Thông tin phiên chat
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Timestamp tự động
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // IP và thông tin thiết bị
  clientInfo: {
    ip: String,
    userAgent: String
  },
  
  // Thời gian xử lý (milliseconds)
  processingTime: Number
});

/**
 * Schema cho phiên chat
 */
const chatSessionSchema = new Schema({
  // ID người dùng (nếu đã đăng nhập)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  
  // Thông tin khách
  guestInfo: {
    name: String,
    phone: String,
    email: String
  },
  
  // Thời gian bắt đầu và kết thúc phiên
  startTime: {
    type: Date,
    default: Date.now
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  // Tổng số tin nhắn trong phiên
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Trạng thái phiên chat
  status: {
    type: String,
    enum: ['active', 'ended', 'transferred'],
    default: 'active'
  },
  
  // IP và thông tin thiết bị
  clientInfo: {
    ip: String,
    userAgent: String
  },
  
  // Tóm tắt nội dung cuộc trò chuyện (có thể được tạo bởi AI)
  summary: String
});

/**
 * Schema cho dữ liệu huấn luyện chat
 * Đây là phiên bản MongoDB của dữ liệu huấn luyện
 */
const chatTrainingSchema = new Schema({
  // Câu hỏi
  question: {
    type: String,
    required: true
    // Đã loại bỏ text: true từ đây để tránh xung đột với index tổng hợp
  },
  
  // Câu trả lời
  answer: {
    type: String,
    required: true
  },
  
  // Từ khóa để dễ tìm kiếm
  keywords: [String],
  
  // Danh mục (ví dụ: sản phẩm, thanh toán, vận chuyển, v.v.)
  category: {
    type: String,
    default: 'general'
  },
  
  // Người tạo
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  
  // Người cập nhật gần nhất
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  
  // Số lần sử dụng
  useCount: {
    type: Number,
    default: 0
  },
  
  // Độ chính xác (tính theo % phản hồi tích cực)
  accuracy: {
    type: Number,
    default: 100
  },
  
  // Timestamp tự động
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Trạng thái kích hoạt
  isActive: {
    type: Boolean,
    default: true
  }
});

// Tạo text index cho tìm kiếm nhanh - chỉ định nghĩa một lần
chatTrainingSchema.index({ question: 'text', keywords: 'text' });

// Plugin tự động tăng updatedAt khi cập nhật
chatTrainingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Schema cho báo cáo thống kê chat
 */
const chatAnalyticsSchema = new Schema({
  // Ngày báo cáo
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Số lượng phiên trò chuyện
  sessionCount: {
    type: Number,
    default: 0
  },
  
  // Tổng số tin nhắn
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Số lượng người dùng đã đăng nhập
  authenticatedUsers: {
    type: Number,
    default: 0
  },
  
  // Số lượng khách
  guestUsers: {
    type: Number,
    default: 0
  },
  
  // Tỷ lệ phản hồi tích cực
  positiveResponseRate: {
    type: Number,
    default: 0
  },
  
  // Nguồn phản hồi
  responseSources: {
    training: { type: Number, default: 0 },
    groq: { type: Number, default: 0 },
    claude: { type: Number, default: 0 },
    fallback: { type: Number, default: 0 }
  },
  
  // Danh sách câu hỏi không thể trả lời
  unansweredQuestions: [{
    question: String,
    count: Number
  }],
  
  // Các từ khóa phổ biến
  popularKeywords: [{
    keyword: String,
    count: Number
  }]
});

// Tạo các model từ schema
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
const ChatTraining = mongoose.model('ChatTraining', chatTrainingSchema);
const ChatAnalytics = mongoose.model('ChatAnalytics', chatAnalyticsSchema);

module.exports = {
  ChatMessage,
  ChatSession,
  ChatTraining,
  ChatAnalytics
};