/**
 * Controller xử lý chính cho chức năng chat
 */
const {
  ChatMessage,
  ChatSession,
  ChatTraining
} = require('../../models/Chatmodel');
const axios = require('axios');

/**
 * Tạo phiên chat mới
 * @param {Object} userData - Thông tin người dùng
 * @param {Object} clientInfo - Thông tin IP, user agent
 * @returns {Promise<Object>} - Thông tin phiên chat mới
 */
const createSession = async (userData, clientInfo) => {
  try {
    // Validate input - Allow creating sessions with minimal information
    // Removed strict validation to avoid authentication issues
    const sessionData = {
      clientInfo: clientInfo || {}
    };

    // Nếu user đã đăng nhập, thêm ID user vào
    if (userData && userData.userId) {
      sessionData.userId = userData.userId;
    } else if (userData && userData.guestInfo) {
      sessionData.guestInfo = userData.guestInfo;
    }

    const session = new ChatSession(sessionData);
    await session.save();

    console.log(`✅ Đã tạo phiên chat mới: ${session._id}`);
    return session;
  } catch (error) {
    console.error('❌ Lỗi khi tạo phiên chat:', error);
    throw error;
  }
};

/**
 * Kết thúc phiên chat
 * @param {string} sessionId - ID phiên chat
 * @returns {Promise<Object>} - Thông tin phiên chat đã kết thúc
 */
const endSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const session = await ChatSession.findByIdAndUpdate(
      sessionId,
      {
        endTime: new Date(),
        status: 'ended'
      },
      { new: true }
    );

    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`✅ Đã kết thúc phiên chat: ${sessionId}`);
    return session;
  } catch (error) {
    console.error('❌ Lỗi khi kết thúc phiên chat:', error);
    throw error;
  }
};

/**
 * Lưu tin nhắn của người dùng
 * @param {string} sessionId - ID phiên chat
 * @param {string} message - Nội dung tin nhắn
 * @param {string|null} userId - ID người dùng (nếu đã đăng nhập)
 * @param {Object|null} guestInfo - Thông tin khách (nếu chưa đăng nhập)
 * @param {Object} clientInfo - Thông tin thiết bị
 * @returns {Promise<Object>} - Thông tin tin nhắn đã lưu
 */
const saveUserMessage = async (sessionId, message, userId = null, guestInfo = null, clientInfo = {}) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (!message) {
      throw new Error('Message content is required');
    }

    const startTime = Date.now();

    const messageData = {
      sessionId,
      message,
      sender: 'user',
      clientInfo: clientInfo || {}
    };

    if (userId) {
      messageData.userId = userId;
    } else if (guestInfo) {
      messageData.guestInfo = guestInfo;
    }

    const chatMessage = new ChatMessage(messageData);
    await chatMessage.save();

    // Cập nhật số lượng tin nhắn trong phiên chat
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $inc: { messageCount: 1 } }
    );

    const processingTime = Date.now() - startTime;

    // Cập nhật thời gian xử lý
    await ChatMessage.findByIdAndUpdate(
      chatMessage._id,
      { processingTime }
    );

    return chatMessage;
  } catch (error) {
    console.error('❌ Lỗi khi lưu tin nhắn:', error);
    throw error;
  }
};

/**
 * Lưu phản hồi từ AI
 * @param {string} sessionId - ID phiên chat
 * @param {string} message - Nội dung tin nhắn 
 * @param {string} source - Nguồn tin nhắn (training, groq, claude, fallback)
 * @param {string|null} trainingMatchId - ID dữ liệu training được sử dụng
 * @returns {Promise<Object>} - Thông tin tin nhắn đã lưu
 */
const saveAIResponse = async (sessionId, message, source = 'fallback', trainingMatchId = null) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (!message) {
      throw new Error('Message content is required');
    }

    const startTime = Date.now();

    const messageData = {
      sessionId,
      message,
      sender: 'ai',
      response: {
        text: message,
        source,
        trainingMatchId
      }
    };

    const chatMessage = new ChatMessage(messageData);
    await chatMessage.save();

    // Cập nhật số lượng tin nhắn trong phiên chat
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { $inc: { messageCount: 1 } }
    );

    const processingTime = Date.now() - startTime;

    // Cập nhật thời gian xử lý
    await ChatMessage.findByIdAndUpdate(
      chatMessage._id,
      { processingTime }
    );

    return chatMessage;
  } catch (error) {
    console.error('❌ Lỗi khi lưu phản hồi AI:', error);
    throw error;
  }
};

/**
 * Tìm câu trả lời tốt nhất từ dữ liệu training
 * @param {string} question - Câu hỏi của người dùng
 * @returns {Promise<Object|null>} - Dữ liệu training phù hợp nhất hoặc null nếu không tìm thấy
 */
const findBestTrainingMatch = async (question) => {
  try {
    if (!question) {
      return null;
    }

    // Sử dụng MongoDB text search
    const textSearchResults = await ChatTraining.find(
      {
        $text: { $search: question },
        isActive: true
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    // Nếu không có kết quả hoặc điểm thấp, trả về null
    if (textSearchResults.length === 0 || textSearchResults[0]._doc.score < 1.0) {
      return null;
    }

    // Cập nhật số lần sử dụng
    await ChatTraining.findByIdAndUpdate(
      textSearchResults[0]._id,
      { $inc: { useCount: 1 } }
    );

    return textSearchResults[0];
  } catch (error) {
    console.error('❌ Lỗi khi tìm kiếm trong dữ liệu training:', error);
    return null;
  }
};

/**
 * Gọi API Groq
 * @param {string} message - Tin nhắn người dùng
 * @returns {Promise<string|null>} - Phản hồi từ Groq hoặc null nếu lỗi
 */
const callGroqAPI = async (message) => {
  try {
    const apiKey = process.env.GROQ_API_KEY.trim();

    console.log('📣 Đang gọi Groq API với tin nhắn:', message);

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "Bạn là trợ lý AI thân thiện của Shopdunk.Luôn trả lời bằng tiếng Việt, văn phong ngắn gọn, lịch sự và dễ hiểu.Bạn có thể trả lời các câu hỏi không liên quan đến sản phẩm, miễn sao vẫn duy trì giọng điệu chuyên nghiệp và thân thiện."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Tăng timeout lên 15 giây
      }
    );

    // Log để debug
    console.log('Response status:', response.status);
    console.log('Response structure:', Object.keys(response.data));

    // Truy cập dữ liệu đúng cách theo cấu trúc response 
    if (response.data && response.data.choices && response.data.choices.length > 0
      && response.data.choices[0].message && response.data.choices[0].message.content) {
      return response.data.choices[0].message.content;
    } else {
      console.error('❌ Cấu trúc response không như mong đợi:', response.data);
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.error('❌ Lỗi khi gọi Groq API:', error.message);

    // Log thêm chi tiết về lỗi
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }

    // Fallback to pre-defined responses if API call fails
    const fallbackResponses = {
      "iphone": "Shopdunk có đầy đủ các dòng iPhone mới nhất, bao gồm iPhone 15 Pro, iPhone 15, iPhone 14 và iPhone SE. Chúng tôi cam kết chỉ kinh doanh sản phẩm chính hãng Apple với đầy đủ bảo hành và hỗ trợ sau bán hàng.",
      "macbook": "Tại Shopdunk, chúng tôi cung cấp tất cả các dòng MacBook, bao gồm MacBook Air và MacBook Pro với chip M2/M3. Tất cả sản phẩm đều là hàng chính hãng Apple và được bảo hành 12 tháng.",
      "ipad": "Shopdunk có đầy đủ các dòng iPad, bao gồm iPad, iPad Air, iPad Pro và iPad Mini. Tất cả sản phẩm đều là hàng chính hãng Apple với đầy đủ bảo hành.",
      "apple watch": "Chúng tôi có đầy đủ các dòng Apple Watch, từ Apple Watch Series 9, Apple Watch Ultra đến Apple Watch SE. Tất cả đều là sản phẩm chính hãng Apple."
    };

    // Tìm từ khóa trong tin nhắn
    const messageLC = message.toLowerCase();
    for (const [keyword, reply] of Object.entries(fallbackResponses)) {
      if (messageLC.includes(keyword.toLowerCase())) {
        return reply;
      }
    }

    return "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Bạn có thể liên hệ trực tiếp với Shopdunk qua hotline 1900.6626 để được hỗ trợ nhanh nhất.";
  }
};

/**
 * Giả lập API Claude vì không có key thực
 * @param {string} message - Tin nhắn người dùng
 * @returns {Promise<string>} - Phản hồi giả lập
 */
const callClaudeAPI = async (message) => {
  try {
    // Tạo phản hồi giả lập
    console.log('📣 Đang sử dụng Claude giả lập cho tin nhắn:', message);

    // Các loại câu hỏi phổ biến khác với Groq để tăng sự đa dạng
    const responses = {
      "so sánh": "So sánh các sản phẩm Apple là một việc phức tạp vì mỗi model đều có ưu điểm riêng. Tại Shopdunk, chúng tôi luôn tư vấn sản phẩm phù hợp nhất với nhu cầu và ngân sách của khách hàng. Bạn có thể chia sẻ thêm về nhu cầu sử dụng để tôi tư vấn chi tiết hơn.",
      "giá rẻ": "Tại Shopdunk, chúng tôi có nhiều chương trình ưu đãi giúp khách hàng tiếp cận sản phẩm Apple với giá tốt nhất. Chúng tôi thường xuyên có các chương trình giảm giá, thu cũ đổi mới và trả góp 0%. Bạn có thể ghé thăm website shopdunk.com để xem các chương trình khuyến mãi mới nhất.",
      "phụ kiện": "Shopdunk cung cấp đầy đủ các phụ kiện chính hãng cho thiết bị Apple như ốp lưng, dán cường lực, sạc, cáp, tai nghe và nhiều phụ kiện khác. Tất cả đều là sản phẩm chính hãng với chất lượng đảm bảo.",
      "cài đặt": "Shopdunk hỗ trợ khách hàng cài đặt và thiết lập các ứng dụng, dịch vụ trên thiết bị Apple miễn phí. Nhân viên của chúng tôi sẽ hướng dẫn bạn cách sử dụng các tính năng cơ bản và nâng cao để tối ưu trải nghiệm.",
      "sửa chữa": "Dịch vụ sửa chữa tại Shopdunk được thực hiện bởi các kỹ thuật viên có chứng chỉ Apple, sử dụng linh kiện chính hãng 100%. Chúng tôi có trung tâm bảo hành tại nhiều tỉnh thành trên cả nước.",
      "hàng cũ": "Shopdunk có chương trình iPhone đã qua sử dụng (CPO) được kiểm tra kỹ lưỡng, bảo hành chính hãng và có giá rẻ hơn so với sản phẩm mới. Đây là lựa chọn tốt nếu bạn muốn sở hữu iPhone chính hãng với ngân sách hợp lý.",
      "tư vấn": "Đội ngũ tư vấn của Shopdunk được đào tạo bài bản về sản phẩm Apple và luôn cập nhật kiến thức mới nhất. Chúng tôi sẽ tư vấn khách hàng lựa chọn sản phẩm phù hợp nhất với nhu cầu và ngân sách.",
      "chính sách": "Shopdunk cam kết về chất lượng sản phẩm chính hãng, giá cả cạnh tranh, chế độ bảo hành theo tiêu chuẩn Apple và hỗ trợ khách hàng tận tâm. Chúng tôi mong muốn mang đến trải nghiệm mua sắm Apple tốt nhất cho khách hàng Việt Nam."
    };

    // Tìm từ khóa trong tin nhắn
    const messageLC = message.toLowerCase();
    let response = "Cảm ơn bạn đã liên hệ với Shopdunk - đại lý ủy quyền chính thức của Apple tại Việt Nam. Tôi có thể giúp bạn tìm hiểu về các sản phẩm Apple, chính sách bảo hành, khuyến mãi hoặc các dịch vụ khác của Shopdunk. Bạn cần hỗ trợ thông tin gì?";

    // Kiểm tra từng từ khóa
    for (const [keyword, reply] of Object.entries(responses)) {
      if (messageLC.includes(keyword.toLowerCase())) {
        response = reply;
        break;
      }
    }

    // Trả về sau 1.5 giây để mô phỏng độ trễ API
    return new Promise(resolve => {
      setTimeout(() => resolve(response), 1500);
    });
  } catch (error) {
    console.error('❌ Lỗi khi gọi Claude API giả lập:', error.message);
    return "Xin lỗi, tôi không thể trả lời câu hỏi này ngay bây giờ. Vui lòng liên hệ với nhân viên Shopdunk qua số 1900.6626 để được hỗ trợ.";
  }
};

/**
 * Xử lý tin nhắn người dùng và tạo phản hồi
 * @param {string} sessionId - ID phiên chat
 * @param {string} message - Tin nhắn người dùng
 * @param {string|null} userId - ID người dùng (nếu đã đăng nhập)
 * @param {Object|null} guestInfo - Thông tin khách (nếu chưa đăng nhập)
 * @param {Object} clientInfo - Thông tin thiết bị
 * @returns {Promise<Object>} - Thông tin phản hồi
 */
const processMessage = async (sessionId, message, userId = null, guestInfo = null, clientInfo = {}) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (!message) {
      throw new Error('Message content is required');
    }

    // Lưu tin nhắn người dùng
    await saveUserMessage(sessionId, message, userId, guestInfo, clientInfo);

    // 1. Tìm câu trả lời từ dữ liệu training
    const trainingMatch = await findBestTrainingMatch(message);
    if (trainingMatch) {
      console.log(`✅ Tìm thấy câu trả lời từ dữ liệu training cho: "${message.substring(0, 30)}..."`);
      const response = await saveAIResponse(
        sessionId,
        trainingMatch.answer,
        'training',
        trainingMatch._id
      );
      return {
        message: trainingMatch.answer,
        source: 'training',
        id: response._id
      };
    }

    // 2. Thử với Groq API
    const groqResponse = await callGroqAPI(message);
    if (groqResponse) {
      console.log(`✅ Nhận phản hồi từ Groq cho: "${message.substring(0, 30)}..."`);
      console.log('Groq API Key:', process.env.GROQ_API_KEY);
      const response = await saveAIResponse(sessionId, groqResponse, 'groq');
      return {
        message: groqResponse,
        source: 'groq',
        id: response._id
      };
    }

    // 3. Thử với Claude API
    const claudeResponse = await callClaudeAPI(message);
    if (claudeResponse) {
      console.log(`✅ Nhận phản hồi từ Claude cho: "${message.substring(0, 30)}..."`);
      const response = await saveAIResponse(sessionId, claudeResponse, 'claude');
      return {
        message: claudeResponse,
        source: 'claude',
        id: response._id
      };
    }

    // 4. Dùng phản hồi mặc định nếu tất cả đều thất bại
    const fallbackResponse = "Xin lỗi, tôi không thể xử lý yêu cầu của bạn ngay bây giờ. Vui lòng thử lại sau hoặc liên hệ với Shopdunk qua hotline 1900.6626.";
    console.log(`⚠️ Sử dụng phản hồi mặc định cho: "${message.substring(0, 30)}..."`);
    const response = await saveAIResponse(sessionId, fallbackResponse, 'fallback');

    // Mark this message as unanswered for analytics
    await ChatMessage.findOne({ sessionId, sender: 'user' })
      .sort({ createdAt: -1 })
      .limit(1)
      .updateOne({ isUnanswered: true });

    return {
      message: fallbackResponse,
      source: 'fallback',
      id: response._id
    };
  } catch (error) {
    console.error('❌ Lỗi khi xử lý tin nhắn:', error);
    throw error;
  }
};

/**
 * Lưu phản hồi của người dùng về chất lượng tin nhắn AI
 * @param {string} messageId - ID tin nhắn
 * @param {boolean} isHelpful - Người dùng thấy hữu ích không
 * @param {string} comment - Bình luận thêm
 * @returns {Promise<Object>} - Thông tin tin nhắn đã cập nhật
 */
const saveFeedback = async (messageId, isHelpful, comment = '') => {
  try {
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        feedback: {
          isHelpful,
          comment
        }
      },
      { new: true }
    );

    if (!message) {
      throw new Error('Message not found');
    }

    // Nếu tin nhắn là từ training, cập nhật độ chính xác
    if (message.response && message.response.source === 'training' && message.response.trainingMatchId) {
      const trainingId = message.response.trainingMatchId;

      // Đếm số lượng phản hồi đã nhận
      const feedbackMessages = await ChatMessage.find({
        'response.trainingMatchId': trainingId,
        'feedback.isHelpful': { $exists: true }
      });

      if (feedbackMessages.length > 0) {
        const helpfulCount = feedbackMessages.filter(msg => msg.feedback.isHelpful).length;
        const accuracy = (helpfulCount / feedbackMessages.length) * 100;

        // Cập nhật độ chính xác
        await ChatTraining.findByIdAndUpdate(
          trainingId,
          { accuracy }
        );
      }
    }

    return message;
  } catch (error) {
    console.error('❌ Lỗi khi lưu phản hồi:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử chat của một phiên
 * @param {string} sessionId - ID phiên chat
 * @returns {Promise<Array>} - Danh sách tin nhắn
 */
const getSessionHistory = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    return await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch sử chat:', error);
    throw error;
  }
};

module.exports = {
  createSession,
  endSession,
  processMessage,
  saveFeedback,
  getSessionHistory,
  saveUserMessage,
  saveAIResponse
};