/**
 * Service xử lý thống kê và phân tích dữ liệu chat
 */
const { 
    ChatMessage, 
    ChatSession, 
    ChatAnalytics 
  } = require('../../../models/Chatmodel');
  
  /**
   * Cập nhật thống kê hàng ngày
   * @param {Date} date - Ngày cần cập nhật (mặc định là hôm nay)
   * @returns {Promise<Object>} - Dữ liệu thống kê
   */
  const updateDailyAnalytics = async (date = new Date()) => {
    try {
      // Chuẩn hóa ngày (chỉ lấy ngày, không lấy giờ)
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      // Ngày hôm sau
      const nextDay = new Date(normalizedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      console.log(`📊 Cập nhật thống kê chat ngày ${normalizedDate.toLocaleDateString()}`);
      
      // Đếm số lượng phiên chat trong ngày
      const sessionCount = await ChatSession.countDocuments({
        startTime: { $gte: normalizedDate, $lt: nextDay }
      });
      
      // Đếm số lượng tin nhắn trong ngày
      const messageCount = await ChatMessage.countDocuments({
        createdAt: { $gte: normalizedDate, $lt: nextDay }
      });
      
      // Đếm số lượng người dùng đã đăng nhập
      const authenticatedUsers = await ChatSession.countDocuments({
        startTime: { $gte: normalizedDate, $lt: nextDay },
        userId: { $ne: null }
      });
      
      // Đếm số lượng khách
      const guestUsers = await ChatSession.countDocuments({
        startTime: { $gte: normalizedDate, $lt: nextDay },
        userId: null
      });
      
      // Tính tỷ lệ phản hồi tích cực
      const feedbackMessages = await ChatMessage.find({
        createdAt: { $gte: normalizedDate, $lt: nextDay },
        'feedback.isHelpful': { $exists: true }
      });
      
      let positiveResponseRate = 0;
      if (feedbackMessages.length > 0) {
        const positiveCount = feedbackMessages.filter(msg => msg.feedback.isHelpful).length;
        positiveResponseRate = (positiveCount / feedbackMessages.length) * 100;
      }
      
      // Đếm nguồn phản hồi
      const responseSources = {
        training: await ChatMessage.countDocuments({
          createdAt: { $gte: normalizedDate, $lt: nextDay },
          'response.source': 'training'
        }),
        deepseek: await ChatMessage.countDocuments({
          createdAt: { $gte: normalizedDate, $lt: nextDay },
          'response.source': 'deepseek'
        }),
        claude: await ChatMessage.countDocuments({
          createdAt: { $gte: normalizedDate, $lt: nextDay },
          'response.source': 'claude'
        }),
        fallback: await ChatMessage.countDocuments({
          createdAt: { $gte: normalizedDate, $lt: nextDay },
          'response.source': 'fallback'
        })
      };
      
      // Danh sách câu hỏi không trả lời được
      const unansweredMessages = await ChatMessage.find({
        createdAt: { $gte: normalizedDate, $lt: nextDay },
        isUnanswered: true,
        sender: 'user'
      }, 'message');
      
      // Đếm và nhóm các câu hỏi không trả lời được
      const unansweredQuestions = [];
      const unansweredCount = {};
      
      unansweredMessages.forEach(msg => {
        const question = msg.message.trim();
        if (unansweredCount[question]) {
          unansweredCount[question]++;
        } else {
          unansweredCount[question] = 1;
        }
      });
      
      // Chuyển đếm thành mảng và sắp xếp theo số lượng
      for (const question in unansweredCount) {
        unansweredQuestions.push({
          question,
          count: unansweredCount[question]
        });
      }
      
      unansweredQuestions.sort((a, b) => b.count - a.count);
      
      // Tìm các từ khóa phổ biến
      const userMessages = await ChatMessage.find({
        createdAt: { $gte: normalizedDate, $lt: nextDay },
        sender: 'user'
      }, 'message');
      
      const keywords = {};
      const stopwords = ['và', 'hoặc', 'nếu', 'thì', 'là', 'của', 'có', 'không', 'cho', 'tôi', 'bạn', 'các'];
      
      userMessages.forEach(msg => {
        const words = msg.message.toLowerCase()
          .replace(/[.,;:?!()]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopwords.includes(word));
        
        words.forEach(word => {
          if (keywords[word]) {
            keywords[word]++;
          } else {
            keywords[word] = 1;
          }
        });
      });
      
      // Chuyển từ khóa thành mảng và sắp xếp
      const popularKeywords = [];
      
      for (const keyword in keywords) {
        if (keywords[keyword] > 1) { // Chỉ lấy các từ khóa xuất hiện nhiều hơn 1 lần
          popularKeywords.push({
            keyword,
            count: keywords[keyword]
          });
        }
      }
      
      popularKeywords.sort((a, b) => b.count - a.count);
      
      // Lấy tối đa 20 từ khóa phổ biến nhất
      const top20Keywords = popularKeywords.slice(0, 20);
      
      // Cập nhật hoặc tạo báo cáo
      const analytics = await ChatAnalytics.findOneAndUpdate(
        { date: normalizedDate },
        {
          sessionCount,
          messageCount,
          authenticatedUsers,
          guestUsers,
          positiveResponseRate,
          responseSources,
          unansweredQuestions: unansweredQuestions.slice(0, 20), // Top 20 câu hỏi không trả lời được
          popularKeywords: top20Keywords
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Đã cập nhật thống kê chat ngày ${normalizedDate.toLocaleDateString()}`);
      
      return analytics;
    } catch (error) {
      console.error('❌ Lỗi cập nhật thống kê chat:', error);
      throw error;
    }
  };
  
  /**
   * Lấy thống kê trong khoảng thời gian
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Promise<Array>} - Dữ liệu thống kê
   */
  const getAnalytics = async (startDate, endDate) => {
    try {
      // Chuẩn hóa ngày
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Lấy thống kê
      const analytics = await ChatAnalytics.find({
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });
      
      return analytics;
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê chat:', error);
      throw error;
    }
  };
  
  /**
   * Cập nhật thống kê cho 30 ngày gần nhất
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  const updateRecentAnalytics = async () => {
    try {
      const today = new Date();
      const results = {
        success: 0,
        errors: []
      };
      
      // Cập nhật 30 ngày gần nhất
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        try {
          await updateDailyAnalytics(date);
          results.success++;
        } catch (error) {
          results.errors.push({
            date: date.toISOString(),
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Lỗi cập nhật thống kê gần đây:', error);
      throw error;
    }
  };
  
  /**
   * Lấy danh sách từ khóa phổ biến nhất
   * @param {number} limit - Giới hạn số lượng từ khóa
   * @returns {Promise<Array>} - Danh sách từ khóa
   */
  const getTopKeywords = async (limit = 10) => {
    try {
      // Lấy thống kê 30 ngày gần nhất
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const analytics = await ChatAnalytics.find({
        date: { $gte: thirtyDaysAgo }
      });
      
      // Tổng hợp từ khóa
      const keywordCounts = {};
      
      analytics.forEach(day => {
        day.popularKeywords.forEach(item => {
          if (keywordCounts[item.keyword]) {
            keywordCounts[item.keyword] += item.count;
          } else {
            keywordCounts[item.keyword] = item.count;
          }
        });
      });
      
      // Chuyển đếm thành mảng và sắp xếp
      const topKeywords = [];
      
      for (const keyword in keywordCounts) {
        topKeywords.push({
          keyword,
          count: keywordCounts[keyword]
        });
      }
      
      topKeywords.sort((a, b) => b.count - a.count);
      
      return topKeywords.slice(0, limit);
    } catch (error) {
      console.error('❌ Lỗi lấy từ khóa phổ biến:', error);
      throw error;
    }
  };
  
  module.exports = {
    updateDailyAnalytics,
    getAnalytics,
    updateRecentAnalytics,
    getTopKeywords
  };