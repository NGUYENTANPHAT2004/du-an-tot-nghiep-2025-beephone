// routes/flasheroutes.js
const express = require('express');
const router = express.Router();
const { FlashSale } = require('../models/flashemodel');
const Sp = require('../models/chitietSpModel');
const LoaiSP = require('../models/LoaiSanPham');
const { User } = require('../models/user.model');
const moment = require('moment');
const { ProductSizeStock } = require('../models/ProductSizeStockmodel')
const uploads = require('./upload');
const db = require("../models/db");

const { startFlashSale, endFlashSale } = require('../service/flashSaleHelper');

const { scheduleNewFlashSale, unscheduleFlashSale } = require('../service/flashSaleScheduler');


const checkAdminAuth = async (req, res, next) => {
  try {
   
    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    res.status(401).json({
      success: false,
      message: 'Lỗi xác thực: ' + error.message
    });
  }
};

// Cập nhật hàm updateFlashSaleStatus để sử dụng các hàm từ helper
const updateFlashSaleStatus = async (flashSale) => {
  const now = new Date();

  // Nếu Flash Sale quá thời gian kết thúc và đang active
  if (now > flashSale.endTime && flashSale.isActive) {
    await endFlashSale(flashSale._id);
    return;
  }

  // Nếu Flash Sale đã đến thời gian bắt đầu nhưng chưa bắt đầu
  if (now >= flashSale.startTime && now <= flashSale.endTime) {
    const needToStart = flashSale.products.some(product => product.status === 'upcoming');
    if (needToStart) {
      await startFlashSale(flashSale._id);
    }
  }
};

// Các routes hiện tại...
router.get('/check-product-in-flash-sale/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();

    // Tìm Flash Sale đang diễn ra có chứa sản phẩm này
    const flashSale = await FlashSale.findOne({
      isActive: true,
      isDeleted: false,
      startTime: { $lte: now },
      endTime: { $gt: now },
      'products.productId': productId
    }).lean();

    if (!flashSale) {
      return res.json({
        inFlashSale: false
      });
    }

    // Tìm biến thể sản phẩm đang Flash Sale
    const flashSaleProduct = flashSale.products.find(p =>
      p.productId.toString() === productId &&
      p.status === 'available' &&
      p.soldQuantity < p.quantity
    );

    if (!flashSaleProduct) {
      return res.json({
        inFlashSale: false
      });
    }

    res.json({
      inFlashSale: true,
      flashSaleInfo: {
        flashSaleId: flashSale._id,
        productId: flashSaleProduct.productId,
        dungluongId: flashSaleProduct.dungluongId,
        mausacId: flashSaleProduct.mausacId,
        originalPrice: flashSaleProduct.originalPrice,
        salePrice: flashSaleProduct.salePrice,
        discountPercent: flashSaleProduct.discountPercent,
        remainingQuantity: flashSaleProduct.quantity - flashSaleProduct.soldQuantity
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra sản phẩm Flash Sale:', error);
    res.status(500).json({
      inFlashSale: false,
      error: error.message
    });
  }
});

// 1. [ADMIN] Lấy danh sách Flash Sale
router.get('/admin/flash-sales', checkAdminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Xây dựng filter
    const filter = { isDeleted: false };
    if (status === 'active') {
      filter.isActive = true;
      filter.endTime = { $gte: new Date() };
    } else if (status === 'upcoming') {
      filter.startTime = { $gt: new Date() };
    } else if (status === 'ended') {
      filter.endTime = { $lt: new Date() };
    }

    // Lấy tổng số Flash Sale phù hợp với filter
    const totalFlashSales = await FlashSale.countDocuments(filter);

    // Lấy danh sách Flash Sale với phân trang
    const flashSales = await FlashSale.find(filter)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('products.productId', 'name image')
      .lean();

    // Format dữ liệu cho frontend
    const formattedFlashSales = flashSales.map(sale => {
      // Đếm số lượng biến thể
      const totalVariants = sale.products.filter(
        product => product.dungluongId || product.mausacId
      ).length;

      return {
        _id: sale._id,
        name: sale.name,
        startTime: moment(sale.startTime).format('DD/MM/YYYY HH:mm'),
        endTime: moment(sale.endTime).format('DD/MM/YYYY HH:mm'),
        isActive: sale.isActive,
        totalProducts: sale.products.length,
        totalQuantity: sale.products.reduce((sum, product) => sum + product.quantity, 0),
        soldQuantity: sale.products.reduce((sum, product) => sum + product.soldQuantity, 0),
        totalVariants: totalVariants,
        status: moment().isAfter(sale.endTime)
          ? 'ended'
          : moment().isBefore(sale.startTime)
            ? 'upcoming'
            : 'active'
      };
    });

    res.json({
      success: true,
      data: formattedFlashSales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFlashSales / parseInt(limit)),
        totalItems: totalFlashSales
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Flash Sale'
    });
  }
});

// 2. [ADMIN] Tạo Flash Sale mới
router.post('/admin/flash-sales',
  checkAdminAuth,
  uploads.fields([{ name: 'bannerImage', maxCount: 1 }]),
  async (req, res) => {
    // Bắt đầu giao dịch cơ sở dữ liệu
    const session = await db.mongoose.startSession();
    session.startTransaction();

    try {
      const {
        name, description, startTime, endTime,
        products = '[]', // Truyền dưới dạng JSON string
        isActive = true,
        priority = 0
      } = req.body;

      // Validate dữ liệu
      if (!name || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết'
        });
      }

      // Kiểm tra thời gian có hợp lệ không
      const parsedStartTime = new Date(startTime);
      const parsedEndTime = new Date(endTime);

      if (parsedStartTime >= parsedEndTime) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }

      // Xử lý ảnh banner nếu có
      const domain = 'http://localhost:3005';
      const bannerImage = req.files['bannerImage']
        ? `${domain}/${req.files['bannerImage'][0].filename}`
        : null;

      // Parse và xử lý danh sách sản phẩm
      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(products);

        // Validate từng sản phẩm
        for (const product of parsedProducts) {
          if (!product.productId || !product.originalPrice || !product.salePrice || !product.quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: 'Thông tin sản phẩm không đầy đủ'
            });
          }

          // Kiểm tra sản phẩm có tồn tại không
          const existProduct = await Sp.ChitietSp.findById(product.productId).session(session);
          if (!existProduct) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Sản phẩm với ID ${product.productId} không tồn tại`
            });
          }

          // Tìm bản ghi tồn kho tương ứng
          const stockFilter = {
            productId: product.productId
          };

          // Thêm dungluongId và mausacId nếu có
          if (product.dungluongId) stockFilter.dungluongId = product.dungluongId;
          if (product.mausacId) stockFilter.mausacId = product.mausacId;

          const stockRecord = await ProductSizeStock.findOne(stockFilter).session(session);

          if (!stockRecord) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Không tìm thấy thông tin tồn kho cho sản phẩm ${existProduct.name} ${product.dungluongId ? '(dungluong)' : ''} ${product.mausacId ? '(mausac)' : ''}`
            });
          }
          product.originalStock = stockRecord.unlimitedStock ? null : stockRecord.quantity;
          // Kiểm tra số lượng tồn kho
          if (!stockRecord.unlimitedStock && stockRecord.quantity < product.quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Sản phẩm ${existProduct.name} không đủ số lượng trong kho. Hiện chỉ còn ${stockRecord.quantity} sản phẩm.`
            });
          }

          // Thêm stockId vào sản phẩm
          product.stockId = stockRecord._id;

          // Tính phần trăm giảm giá
          if (!product.discountPercent) {
            product.discountPercent = Math.round((1 - product.salePrice / product.originalPrice) * 100);
          }

          // Trạng thái sản phẩm
          const now = new Date();
          if (now >= parsedStartTime && now <= parsedEndTime) {
            product.status = 'available';
          } else {
            product.status = 'upcoming';
          }
        }
      } catch (error) {
        console.error('Lỗi khi xử lý danh sách sản phẩm:', error);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Danh sách sản phẩm không hợp lệ'
        });
      }

      // Tạo Flash Sale mới
      const flashSale = new FlashSale({
        name,
        description,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        isActive,
        bannerImage,
        priority: parseInt(priority),
        products: parsedProducts
      });

      await flashSale.save({ session });

      // Commit giao dịch
      await session.commitTransaction();
      session.endSession();

      // Thêm flash sale vào scheduler
      scheduleNewFlashSale(flashSale);

      res.json({
        success: true,
        message: 'Tạo Flash Sale thành công',
        data: flashSale
      });
    } catch (error) {
      // Rollback nếu xảy ra lỗi
      await session.abortTransaction();
      session.endSession();

      console.error('Lỗi khi tạo Flash Sale:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo Flash Sale: ' + error.message
      });
    }
  });





module.exports = router;