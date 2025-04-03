const express = require('express');
const router = express.Router();
const { OrderRating } = require('../models/OrderRatingModel');
const { hoadon } = require('../models/HoaDonModel');
const { ChitietSp } = require('../models/chitietSpModel');
const { dungluong } = require('../models/dungluongModel');
const { mausac } = require('../models/MauSacModel');
const momenttimezone = require('moment-timezone');

// 1. Tạo đánh giá đơn hàng đơn giản
router.post('/simple-rating', async (req, res) => {
  try {
    const {
      userId, 
      orderId, 
      productId, 
      rating, 
      content
    } = req.body;

    // Kiểm tra tham số đầu vào
    if (!userId || !orderId || !productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết để đánh giá'
      });
    }

    // Đảm bảo rating là số từ 1-5
    const ratingValue = Number(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    // Kiểm tra đơn hàng tồn tại
    const orderInfo = await hoadon.findById(orderId);
    if (!orderInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra sản phẩm trong đơn hàng
    const productInOrder = orderInfo.sanpham.find(
      item => item.idsp.toString() === productId
    );

    if (!productInOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không có trong đơn hàng này'
      });
    }

    // Lấy thông tin sản phẩm
    const productInfo = await ChitietSp.findById(productId);
    if (!productInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin sản phẩm'
      });
    }

    // Lấy thông tin dung lượng
    let dungluongInfo = null;
    if (productInOrder.dungluong) {
      dungluongInfo = await dungluong.findById(productInOrder.dungluong);
    }

    // Kiểm tra đã đánh giá chưa
    const existingRating = await OrderRating.findOne({
      userId,
      orderId,
      productId
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này'
      });
    }

    // Tạo đánh giá mới
    const newRating = new OrderRating({
      userId,
      orderId,
      productId,
      productName: productInfo.name,
      productImage: productInfo.image,
      tenkhach: orderInfo.nguoinhan || orderInfo.name,
      content: content || '',
      rating: ratingValue,
      dungluong: dungluongInfo ? dungluongInfo.name : '',
      mausac: productInOrder.mausac || '',
      isRead: true, // Tự động duyệt
      date: momenttimezone().tz('Asia/Ho_Chi_Minh').toDate(),
      verified: true // Đã xác nhận mua hàng
    });

    await newRating.save();

    res.json({
      success: true,
      message: 'Đánh giá sản phẩm thành công',
      data: newRating
    });

  } catch (error) {
    console.error('Lỗi khi tạo đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh giá sản phẩm',
      error: error.message
    });
  }
});
router.get('/order-rating/check', async (req, res) => {
  try {
    const { userId, orderId, productId } = req.query;
    
    // Validate required parameters
    if (!userId || !orderId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: userId, orderId, hoặc productId'
      });
    }

    // Find rating in database
    const existingRating = await OrderRating.findOne({
      userId,
      orderId,
      productId
    });

    // Return result
    if (existingRating) {
      res.json({
        success: true,
        hasRated: true,
        rating: existingRating
      });
    } else {
      res.json({
        success: true,
        hasRated: false
      });
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra trạng thái đánh giá',
      error: error.message
    });
  }
});

// 2. Lấy trung bình sao đánh giá cho sản phẩm
router.get('/product-rating/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID sản phẩm'
      });
    }

    // Lấy tất cả đánh giá của sản phẩm (chỉ đánh giá đã được duyệt)
    const ratings = await OrderRating.find({
      productId,
      isRead: true
    });

    // Kiểm tra có đánh giá không
    if (ratings.length === 0) {
      return res.json({
        success: true,
        productId,
        averageRating: 0,
        totalRatings: 0,
        starCounts: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      });
    }

    // Tính tổng và trung bình sao
    let totalStars = 0;
    const starCounts = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratings.forEach(rating => {
      totalStars += rating.rating;
      starCounts[rating.rating] = (starCounts[rating.rating] || 0) + 1;
    });

    const averageRating = totalStars / ratings.length;

    // Lấy thông tin sản phẩm để hiển thị
    const product = await ChitietSp.findById(productId);

    res.json({
      success: true,
      productId,
      productName: product ? product.name : 'Không xác định',
      productImage: product ? product.image : null,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: ratings.length,
      starCounts
    });

  } catch (error) {
    console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy đánh giá sản phẩm',
      error: error.message
    });
  }
});

// 3. Lấy đánh giá chi tiết cho sản phẩm có phân trang
router.get('/product-reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID sản phẩm'
      });
    }

    // Đếm tổng số đánh giá
    const totalReviews = await OrderRating.countDocuments({
      productId,
      isRead: true
    });

    // Lấy đánh giá theo phân trang
    const reviews = await OrderRating.find({
      productId,
      isRead: true
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

    res.json({
      success: true,
      productId,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      reviews
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
});

// 4. Danh sách đơn hàng có thể đánh giá cho người dùng
router.get('/ratable-orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID người dùng'
      });
    }

    // Lấy đơn hàng đã hoàn thành của người dùng
    const completedOrders = await HoaDon.hoadon.find({
      userId,
      trangthai: { $in: ['Hoàn thành', 'Đã nhận', 'Đã thanh toán'] },
      isDeleted: false
    }).sort({ ngaymua: -1 });

    if (completedOrders.length === 0) {
      return res.json({
        success: true,
        message: 'Chưa có đơn hàng nào để đánh giá',
        orders: []
      });
    }

    // Với mỗi đơn hàng, lấy danh sách sản phẩm và kiểm tra đã đánh giá chưa
    const processedOrders = await Promise.all(completedOrders.map(async (order) => {
      const orderProducts = await Promise.all(order.sanpham.map(async (product) => {
        // Kiểm tra đã đánh giá chưa
        const hasRated = await OrderRating.findOne({
          userId,
          orderId: order._id.toString(),
          productId: product.idsp.toString()
        });

        // Lấy thông tin sản phẩm
        const productInfo = await ChitietSp.chitietsp.findById(product.idsp);
        
        // Lấy thông tin dung lượng
        let dungluongInfo = null;
        if (product.dungluong) {
          dungluongInfo = await DungLuong.dungluong.findById(product.dungluong);
        }

        return {
          productId: product.idsp.toString(),
          productName: productInfo ? productInfo.name : 'Sản phẩm không xác định',
          productImage: productInfo ? productInfo.image : null,
          quantity: product.soluong,
          price: product.price,
          dungluong: dungluongInfo ? dungluongInfo.name : '',
          mausac: product.mausac || '',
          hasRated: !!hasRated
        };
      }));

      return {
        orderId: order._id.toString(),
        orderCode: order.maHDL || order._id.toString().slice(-6),
        orderDate: order.ngaymua,
        totalAmount: order.tongtien,
        status: order.trangthai,
        products: orderProducts
      };
    }));

    res.json({
      success: true,
      orders: processedOrders
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng để đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
});

// 5. Thống kê đánh giá theo loại sản phẩm
router.get('/category-ratings/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID loại sản phẩm'
      });
    }

    // Lấy danh sách sản phẩm thuộc loại
    const products = await ChitietSp.chitietsp.find({
      idloaisp: categoryId,
      isDeleted: false
    });

    if (products.length === 0) {
      return res.json({
        success: true,
        categoryId,
        averageRating: 0,
        totalRatings: 0,
        productRatings: []
      });
    }

    const productIds = products.map(p => p._id.toString());

    // Lấy tất cả đánh giá của các sản phẩm này
    const allRatings = await OrderRating.find({
      productId: { $in: productIds },
      isRead: true
    });

    // Tính trung bình sao cho cả loại sản phẩm
    let totalStars = 0;
    let totalRatings = allRatings.length;

    allRatings.forEach(rating => {
      totalStars += rating.rating;
    });

    const categoryAverage = totalRatings > 0 ? totalStars / totalRatings : 0;

    // Tính trung bình sao cho từng sản phẩm
    const productRatings = await Promise.all(products.map(async (product) => {
      const ratings = allRatings.filter(r => r.productId === product._id.toString());
      let productAverage = 0;
      
      if (ratings.length > 0) {
        const productTotalStars = ratings.reduce((sum, r) => sum + r.rating, 0);
        productAverage = productTotalStars / ratings.length;
      }

      return {
        productId: product._id.toString(),
        productName: product.name,
        productImage: product.image,
        averageRating: parseFloat(productAverage.toFixed(1)),
        totalRatings: ratings.length
      };
    }));

    res.json({
      success: true,
      categoryId,
      averageRating: parseFloat(categoryAverage.toFixed(1)),
      totalRatings,
      productRatings
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê đánh giá theo loại sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê đánh giá',
      error: error.message
    });
  }
});

// 6. Admin - Danh sách đánh giá cần duyệt
router.get('/pending-reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Đếm tổng số đánh giá chưa duyệt
    const totalPending = await OrderRating.countDocuments({ isRead: false });

    // Lấy danh sách đánh giá chưa duyệt
    const pendingReviews = await OrderRating.find({ isRead: false })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Bổ sung thông tin sản phẩm
    const reviewsWithDetails = await Promise.all(pendingReviews.map(async (review) => {
      const product = await ChitietSp.findById(review.productId);
      
      return {
        ...review.toObject(),
        productDetails: product ? {
          name: product.name,
          image: product.image
        } : null
      };
    }));

    res.json({
      success: true,
      totalPending,
      currentPage: page,
      totalPages: Math.ceil(totalPending / limit),
      pendingReviews: reviewsWithDetails
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá chờ duyệt:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đánh giá chờ duyệt',
      error: error.message
    });
  }
});

// 7. Admin - Duyệt đánh giá
router.put('/approve-review/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID đánh giá'
      });
    }

    const review = await OrderRating.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    review.isRead = true;
    await review.save();

    res.json({
      success: true,
      message: 'Đã duyệt đánh giá thành công',
      review
    });

  } catch (error) {
    console.error('Lỗi khi duyệt đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi duyệt đánh giá',
      error: error.message
    });
  }
});

// 8. Admin - Xóa đánh giá
router.delete('/delete-review/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID đánh giá'
      });
    }

    const review = await OrderRating.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    await OrderRating.deleteOne({ _id: reviewId });

    res.json({
      success: true,
      message: 'Đã xóa đánh giá thành công'
    });

  } catch (error) {
    console.error('Lỗi khi xóa đánh giá:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa đánh giá',
      error: error.message
    });
  }
});

module.exports = router;