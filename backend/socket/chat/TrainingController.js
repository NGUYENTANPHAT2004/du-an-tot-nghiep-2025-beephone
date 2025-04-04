/**
 * Controller quản lý dữ liệu huấn luyện AI
 */
const { ChatTraining } = require('../../models/Chatmodel');

/**
 * Tạo dữ liệu huấn luyện mới
 * @param {Object} data - Dữ liệu huấn luyện
 * @param {string|null} userId - ID người tạo (có thể null nếu không xác thực)
 * @returns {Promise<Object>} - Dữ liệu huấn luyện đã tạo
 */
const createTraining = async (data, userId = null) => {
  try {
    // Tự động tạo keywords nếu chưa có
    if (!data.keywords || data.keywords.length === 0) {
      const keywords = generateKeywords(data.question);
      data.keywords = keywords;
    }
    
    const trainingData = new ChatTraining({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    
    await trainingData.save();
    console.log(`✅ Đã tạo dữ liệu huấn luyện mới: ${trainingData._id}`);
    return trainingData;
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Cập nhật dữ liệu huấn luyện
 * @param {string} id - ID dữ liệu huấn luyện
 * @param {Object} data - Dữ liệu cập nhật
 * @param {string|null} userId - ID người cập nhật (có thể null nếu không xác thực)
 * @returns {Promise<Object>} - Dữ liệu huấn luyện đã cập nhật
 */
const updateTraining = async (id, data, userId = null) => {
  try {
    // Cập nhật keywords nếu câu hỏi thay đổi
    if (data.question) {
      data.keywords = generateKeywords(data.question);
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Chỉ thêm userId vào updatedBy nếu được cung cấp
    if (userId) {
      updateData.updatedBy = userId;
    }
    
    const trainingData = await ChatTraining.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!trainingData) {
      throw new Error('Không tìm thấy dữ liệu huấn luyện');
    }
    
    console.log(`✅ Đã cập nhật dữ liệu huấn luyện: ${id}`);
    return trainingData;
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Xóa dữ liệu huấn luyện
 * @param {string} id - ID dữ liệu huấn luyện
 * @returns {Promise<boolean>} - Kết quả xóa
 */
const deleteTraining = async (id) => {
  try {
    const result = await ChatTraining.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Không tìm thấy dữ liệu huấn luyện');
    }
    
    console.log(`✅ Đã xóa dữ liệu huấn luyện: ${id}`);
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Lấy tất cả dữ liệu huấn luyện theo bộ lọc
 * @param {Object} filters - Bộ lọc (category, isActive, etc.)
 * @returns {Promise<{data: Array, count: number}>} - Danh sách dữ liệu huấn luyện và tổng số bản ghi
 */
const getAllTraining = async (filters = {}) => {
  try {
    // Xử lý tham số phân trang
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xử lý tham số sắp xếp
    const sort = {};
    if (filters.sort) {
      const order = filters.order === 'asc' ? 1 : -1;
      sort[filters.sort] = order;
    } else {
      sort.updatedAt = -1; // Mặc định sắp xếp theo thời gian cập nhật giảm dần
    }
    
    // Xây dựng query
    const query = {};
    
    // Lọc theo danh mục
    if (filters.category && filters.category !== '') {
      query.category = filters.category;
    }
    
    // Lọc theo trạng thái kích hoạt
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }
    
    // Tìm kiếm theo từ khóa
    if (filters.search && filters.search.trim() !== '') {
      // Sử dụng text search của MongoDB
      query.$text = { $search: filters.search };
    }
    
    console.log('Query:', query, 'Sort:', sort, 'Skip:', skip, 'Limit:', limit);
    
    // Đếm tổng số bản ghi phù hợp
    const count = await ChatTraining.countDocuments(query);
    
    // Lấy dữ liệu phân trang
    const data = await ChatTraining.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .lean();
    
    console.log(`Đã tìm thấy ${data.length}/${count} bản ghi`);
    
    return {
      data, 
      count
    };
  } catch (error) {
    console.error('❌ Lỗi khi lấy dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một dữ liệu huấn luyện
 * @param {string} id - ID dữ liệu huấn luyện
 * @returns {Promise<Object>} - Chi tiết dữ liệu huấn luyện
 */
const getTrainingDetail = async (id) => {
  try {
    const trainingData = await ChatTraining.findById(id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .lean();
    
    if (!trainingData) {
      throw new Error('Không tìm thấy dữ liệu huấn luyện');
    }
    
    return trainingData;
  } catch (error) {
    console.error('❌ Lỗi khi lấy chi tiết dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Lấy tất cả danh mục (categories) hiện có
 * @returns {Promise<Array>} - Danh sách các danh mục
 */
const getAllCategories = async () => {
  try {
    const categories = await ChatTraining.distinct('category');
    return categories;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh mục:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái kích hoạt của dữ liệu huấn luyện
 * @param {string} id - ID dữ liệu huấn luyện
 * @param {boolean} isActive - Trạng thái kích hoạt
 * @returns {Promise<Object>} - Dữ liệu huấn luyện đã cập nhật
 */
const toggleActiveStatus = async (id, isActive) => {
  try {
    const trainingData = await ChatTraining.findByIdAndUpdate(
      id,
      {
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!trainingData) {
      throw new Error('Không tìm thấy dữ liệu huấn luyện');
    }
    
    console.log(`✅ Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} dữ liệu huấn luyện: ${id}`);
    return trainingData;
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật trạng thái:', error);
    throw error;
  }
};

/**
 * Import nhiều dữ liệu huấn luyện từ file
 * @param {Array} data - Mảng dữ liệu huấn luyện
 * @param {string|null} userId - ID người nhập (có thể null nếu không xác thực)
 * @returns {Promise<Object>} - Kết quả nhập
 */
const importTrainingData = async (data, userId = null) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Dữ liệu không hợp lệ');
    }
    
    const results = {
      total: data.length,
      success: 0,
      errors: []
    };
    
    for (const item of data) {
      try {
        // Kiểm tra dữ liệu cần thiết
        if (!item.question || !item.answer) {
          results.errors.push({
            item,
            error: 'Thiếu câu hỏi hoặc câu trả lời'
          });
          continue;
        }
        
        // Tạo keywords
        const keywords = generateKeywords(item.question);
        
        // Tạo dữ liệu huấn luyện mới
        const trainingData = new ChatTraining({
          question: item.question,
          answer: item.answer,
          keywords,
          category: item.category || 'general',
          createdBy: userId,
          updatedBy: userId,
          isActive: item.isActive !== false
        });
        
        await trainingData.save();
        results.success++;
      } catch (error) {
        results.errors.push({
          item,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Đã nhập ${results.success}/${results.total} dữ liệu huấn luyện`);
    return results;
  } catch (error) {
    console.error('❌ Lỗi khi nhập dữ liệu huấn luyện:', error);
    throw error;
  }
};

/**
 * Tạo keywords từ câu hỏi
 * @param {string} question - Câu hỏi
 * @returns {Array} - Mảng keywords
 */
const generateKeywords = (question) => {
  if (!question) return [];
  
  // Các từ ngắn cần bỏ qua
  const stopwords = ['và', 'hoặc', 'nếu', 'thì', 'là', 'của', 'có', 'không', 'cho', 'tôi', 'bạn', 'các'];
  
  // Phân tách câu hỏi thành các từ, loại bỏ dấu câu và chữ thường
  const words = question.toLowerCase()
    .replace(/[.,;:?!()]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.includes(word))
    .slice(0, 10); // Chỉ lấy tối đa 10 từ khóa
  
  return [...new Set(words)]; // Loại bỏ từ khóa trùng lặp
};

/**
 * Thêm dữ liệu huấn luyện mẫu (để kiểm tra)
 * @returns {Promise<Object>} - Kết quả thêm dữ liệu mẫu
 */
const addSampleTrainingData = async () => {
  try {
    // Dữ liệu mẫu về Shopdunk và Apple
    const sampleData = [
      {
        question: "iPhone 15 Pro Max giá bao nhiêu?",
        answer: "Tại Shopdunk, iPhone 15 Pro Max hiện có giá từ 32.990.000đ đến 47.990.000đ tùy theo phiên bản bộ nhớ từ 128GB đến 1TB. Chúng tôi thường xuyên có các chương trình khuyến mãi, bạn có thể ghé thăm website hoặc cửa hàng để cập nhật thông tin giá mới nhất.",
        category: "product"
      },
      {
        question: "Chính sách bảo hành của Shopdunk như thế nào?",
        answer: "Shopdunk áp dụng chính sách bảo hành chính hãng Apple 12 tháng cho tất cả sản phẩm. Ngoài ra, chúng tôi còn có chính sách đổi trả 1-1 trong 30 ngày đầu tiên nếu sản phẩm gặp lỗi từ nhà sản xuất. Khách hàng cũng có thể mua thêm gói bảo hành mở rộng AppleCare+ để được bảo vệ toàn diện hơn.",
        category: "warranty"
      },
      {
        question: "Mua iPhone trả góp tại Shopdunk?",
        answer: "Shopdunk hỗ trợ mua trả góp iPhone và các sản phẩm Apple khác với lãi suất 0% qua thẻ tín dụng của nhiều ngân hàng hoặc qua các công ty tài chính như Home Credit, FE Credit. Thủ tục đơn giản, chỉ cần CMND/CCCD và phê duyệt nhanh trong 15-30 phút.",
        category: "payment"
      },
      {
        question: "Các cửa hàng Shopdunk ở đâu?",
        answer: "Shopdunk có hệ thống cửa hàng trải dài trên toàn quốc, tập trung nhiều tại Hà Nội, TP.HCM, Đà Nẵng và các thành phố lớn. Bạn có thể truy cập website shopdunk.com/he-thong-cua-hang để tìm cửa hàng gần nhất.",
        category: "general"
      },
      {
        question: "Shopdunk có bán MacBook M3 không?",
        answer: "Vâng, Shopdunk có bán đầy đủ các dòng MacBook mới nhất với chip M3, bao gồm MacBook Air M3 và MacBook Pro M3. Tất cả sản phẩm đều là hàng chính hãng Apple với đầy đủ bảo hành và hỗ trợ kỹ thuật.",
        category: "product"
      }
    ];
    
    const results = {
      total: sampleData.length,
      success: 0,
      errors: []
    };
    
    // Kiểm tra xem đã có dữ liệu nào chưa
    const existingCount = await ChatTraining.countDocuments();
    if (existingCount > 0) {
      return { message: "Đã có dữ liệu huấn luyện, bỏ qua việc thêm dữ liệu mẫu", existingCount };
    }
    
    // Thêm từng mẫu
    for (const item of sampleData) {
      try {
        await createTraining(item);
        results.success++;
      } catch (error) {
        results.errors.push({
          item,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Đã thêm ${results.success}/${results.total} dữ liệu huấn luyện mẫu`);
    return results;
  } catch (error) {
    console.error('❌ Lỗi khi thêm dữ liệu huấn luyện mẫu:', error);
    throw error;
  }
};

module.exports = {
  createTraining,
  updateTraining,
  deleteTraining,
  getAllTraining,
  getTrainingDetail,
  getAllCategories,
  toggleActiveStatus,
  importTrainingData,
  addSampleTrainingData
};