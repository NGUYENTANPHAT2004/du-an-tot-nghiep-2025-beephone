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
// Import hàm từ flashSaleHelper thay vì định nghĩa lại
const { startFlashSale, endFlashSale } = require('../service/flashSaleHelper');
// Import scheduler để đăng ký flash sale mới
const { scheduleNewFlashSale, unscheduleFlashSale } = require('../service/flashSaleScheduler');

// Middleware để kiểm tra quyền admin
const checkAdminAuth = async (req, res, next) => {
  try {
    // Trong một ứng dụng thực tế, cần kiểm tra token JWT và quyền admin
    // Đây là một ví dụ đơn giản, bạn có thể thay thế bằng mã xác thực thực tế
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

// 3. [ADMIN] Lấy chi tiết Flash Sale
router.get('/admin/flash-sales/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findOne({
      _id: id,
      isDeleted: false
    }).populate('products.productId', 'name image namekhongdau price');

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Flash Sale'
      });
    }

    // Cập nhật trạng thái Flash Sale và sản phẩm
    await updateFlashSaleStatus(flashSale);

    res.json({
      success: true,
      data: flashSale
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết Flash Sale'
    });
  }
});

// 4. [ADMIN] Cập nhật Flash Sale
router.put('/admin/flash-sales/:id',
  checkAdminAuth,
  uploads.fields([{ name: 'bannerImage', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name, description, startTime, endTime,
        products = '[]', // Truyền dưới dạng JSON string
        isActive,
        priority
      } = req.body;

      // Tìm Flash Sale
      const flashSale = await FlashSale.findOne({ _id: id, isDeleted: false });
      if (!flashSale) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy Flash Sale'
        });
      }

      // Xử lý ảnh banner nếu có
      const domain = 'http://localhost:3005';
      const bannerImage = req.files['bannerImage']
        ? `${domain}/${req.files['bannerImage'][0].filename}`
        : flashSale.bannerImage;

      // Cập nhật thông tin cơ bản
      if (name) flashSale.name = name;
      if (description !== undefined) flashSale.description = description;
      if (startTime) flashSale.startTime = new Date(startTime);
      if (endTime) flashSale.endTime = new Date(endTime);
      if (isActive !== undefined) flashSale.isActive = isActive === 'true' || isActive === true;
      if (priority !== undefined) flashSale.priority = parseInt(priority);
      if (bannerImage) flashSale.bannerImage = bannerImage;

      // Kiểm tra thời gian có hợp lệ không
      if (flashSale.startTime >= flashSale.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }

      // Parse và xử lý danh sách sản phẩm nếu có
      if (products && products !== '[]') {
        try {
          const parsedProducts = JSON.parse(products);

          // Validate từng sản phẩm
          for (const product of parsedProducts) {
            if (!product.productId || !product.originalPrice || !product.salePrice || !product.quantity) {
              return res.status(400).json({
                success: false,
                message: 'Thông tin sản phẩm không đầy đủ'
              });
            }

            // Kiểm tra sản phẩm có tồn tại không
            const existProduct = await Sp.ChitietSp.findById(product.productId);
            if (!existProduct) {
              return res.status(400).json({
                success: false,
                message: `Sản phẩm với ID ${product.productId} không tồn tại`
              });
            }

            // Tính phần trăm giảm giá
            if (!product.discountPercent) {
              product.discountPercent = Math.round((1 - product.salePrice / product.originalPrice) * 100);
            }

            // Trạng thái sản phẩm
            const now = new Date();
            if (now >= flashSale.startTime && now <= flashSale.endTime) {
              product.status = 'available';
            } else {
              product.status = 'upcoming';
            }
          }

          // Cập nhật danh sách sản phẩm
          flashSale.products = parsedProducts;
        } catch (error) {
          console.error('Lỗi khi xử lý danh sách sản phẩm:', error);
          return res.status(400).json({
            success: false,
            message: 'Danh sách sản phẩm không hợp lệ'
          });
        }
      }

      // Cập nhật trạng thái Flash Sale và sản phẩm
      await updateFlashSaleStatus(flashSale);

      // Lưu thay đổi
      await flashSale.save();

      // Cập nhật lại lịch flash sale
      // Hủy lịch cũ
      unscheduleFlashSale(flashSale._id);
      // Tạo lịch mới
      scheduleNewFlashSale(flashSale);

      res.json({
        success: true,
        message: 'Cập nhật Flash Sale thành công',
        data: flashSale
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật Flash Sale:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật Flash Sale: ' + error.message
      });
    }
  });

// 5. [ADMIN] Xóa Flash Sale (soft delete)
router.delete('/admin/flash-sales/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findById(id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Flash Sale'
      });
    }

    // Thực hiện soft delete
    flashSale.isDeleted = true;
    await flashSale.save();

    // Hủy lịch flash sale
    unscheduleFlashSale(flashSale._id);

    res.json({
      success: true,
      message: 'Xóa Flash Sale thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa Flash Sale'
    });
  }
});

// 6. [ADMIN] Cập nhật trạng thái Flash Sale
router.patch('/admin/flash-sales/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, forceActivation = false } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái'
      });
    }

    const flashSale = await FlashSale.findOne({ _id: id, isDeleted: false });
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Flash Sale'
      });
    }

    // Chỉ kiểm tra thời gian kết thúc nếu KHÔNG có forceActivation
    const now = new Date();
    if (new Date(flashSale.endTime) < now && !forceActivation) {
      return res.status(400).json({
        success: false,
        message: 'Flash Sale đã kết thúc, không thể thay đổi trạng thái'
      });
    }

    // Cập nhật trạng thái
    flashSale.isActive = isActive === 'true' || isActive === true;
    await flashSale.save();

    // Nếu đã kích hoạt, thêm vào scheduler
    if (flashSale.isActive) {
      scheduleNewFlashSale(flashSale);
    } else {
      // Nếu bị vô hiệu hóa, hủy lịch
      unscheduleFlashSale(flashSale._id);
    }

    res.json({
      success: true,
      message: `Flash Sale đã được ${flashSale.isActive ? 'kích hoạt' : 'tạm ngừng'}`
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái Flash Sale: ' + error.message
    });
  }
});

// 7. [PUBLIC] Lấy Flash Sale đang diễn ra
router.get('/flash-sales/active', async (req, res) => {
  try {
    const now = new Date();

    // Tìm tất cả Flash Sale đang diễn ra
    const flashSales = await FlashSale.find({
      isActive: true,
      isDeleted: false,
      startTime: { $lte: now },
      endTime: { $gt: now }
    })
      .sort({ priority: -1, startTime: 1 })
      .populate('products.productId', 'name image namekhongdau price')
      .populate('products.dungluongId', 'name')
      .populate('products.mausacId', 'name')
      .lean();

    // Format dữ liệu cho frontend
    const formattedFlashSales = flashSales.map(sale => {
      // Lọc sản phẩm có sẵn
      const availableProducts = sale.products.filter(product =>
        product.status === 'available' && product.soldQuantity < product.quantity
      );

      return {
        _id: sale._id,
        name: sale.name,
        description: sale.description,
        bannerImage: sale.bannerImage,
        startTime: sale.startTime,
        endTime: sale.endTime,
        remainingTime: sale.endTime - now,
        products: availableProducts.map(product => ({
          _id: product.productId._id,
          name: product.productId.name,
          image: product.productId.image,
          namekhongdau: product.productId.namekhongdau,
          dungluongId: product.dungluongId ? product.dungluongId._id : null,
          dungluongName: product.dungluongId ? product.dungluongId.name : null,
          mausacId: product.mausacId ? product.mausacId._id : null,
          mausacName: product.mausacId ? product.mausacId.name : null,
          originalPrice: product.originalPrice,
          salePrice: product.salePrice,
          discountPercent: product.discountPercent,
          quantity: product.quantity,
          soldQuantity: product.soldQuantity,
          remainingQuantity: product.quantity - product.soldQuantity,
          soldPercent: Math.round((product.soldQuantity / product.quantity) * 100)
        }))
      };
    });

    res.json({
      success: true,
      data: formattedFlashSales
    });
  } catch (error) {
    console.error('Lỗi khi lấy Flash Sale đang diễn ra:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy Flash Sale đang diễn ra'
    });
  }
});

// 8. [PUBLIC] Lấy tất cả Flash Sale (đang diễn ra và sắp diễn ra)
router.get('/flash-sales', async (req, res) => {
  try {
    const now = new Date();

    // Tìm tất cả Flash Sale đang diễn ra và sắp diễn ra
    const flashSales = await FlashSale.find({
      isActive: true,
      isDeleted: false,
      endTime: { $gt: now }
    })
      .sort({ startTime: 1 })
      .populate('products.productId', 'name image namekhongdau price')
      .lean();

    // Phân loại Flash Sale
    const activeFlashSales = [];
    const upcomingFlashSales = [];

    flashSales.forEach(sale => {
      if (sale.startTime <= now) {
        // Flash Sale đang diễn ra
        const availableProducts = sale.products.filter(product =>
          product.status === 'available' && product.soldQuantity < product.quantity
        );

        activeFlashSales.push({
          _id: sale._id,
          name: sale.name,
          description: sale.description,
          bannerImage: sale.bannerImage,
          startTime: sale.startTime,
          endTime: sale.endTime,
          remainingTime: sale.endTime - now,
          products: availableProducts.map(product => ({
            _id: product.productId._id,
            name: product.productId.name,
            image: product.productId.image,
            namekhongdau: product.productId.namekhongdau,
            originalPrice: product.originalPrice,
            salePrice: product.salePrice,
            discountPercent: product.discountPercent,
            quantity: product.quantity,
            soldQuantity: product.soldQuantity,
            remainingQuantity: product.quantity - product.soldQuantity,
            soldPercent: Math.round((product.soldQuantity / product.quantity) * 100)
          }))
        });
      } else {
        // Flash Sale sắp diễn ra
        upcomingFlashSales.push({
          _id: sale._id,
          name: sale.name,
          description: sale.description,
          bannerImage: sale.bannerImage,
          startTime: sale.startTime,
          timeUntilStart: sale.startTime - now,
          totalProducts: sale.products.length,
          startTimeFormatted: moment(sale.startTime).format('DD/MM/YYYY HH:mm'),
          endTimeFormatted: moment(sale.endTime).format('DD/MM/YYYY HH:mm')
        });
      }
    });

    res.json({
      success: true,
      data: {
        active: activeFlashSales,
        upcoming: upcomingFlashSales
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

// Thêm API thống kê Flash Sale
router.get('/admin/flash-sales/:id/stats', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm Flash Sale
    const flashSale = await FlashSale.findOne({
      _id: id,
      isDeleted: false
    })
      .populate('products.productId', 'name image')
      .populate('products.dungluongId', 'name')
      .populate('products.mausacId', 'name');


    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Flash Sale'
      });
    }

    // Xác định trạng thái hiện tại
    const now = new Date();
    let status = 'upcoming';
    if (now > flashSale.endTime) {
      status = 'ended';
    } else if (now >= flashSale.startTime) {
      status = 'active';
    }

    // Tính toán thống kê
    const totalQuantity = flashSale.products.reduce((sum, p) => sum + p.quantity, 0);
    const soldQuantity = flashSale.products.reduce((sum, p) => sum + p.soldQuantity, 0);
    const soldPercent = totalQuantity > 0 ? Math.round((soldQuantity / totalQuantity) * 100) : 0;

    // Thống kê sản phẩm theo trạng thái
    const productStats = {
      available: flashSale.products.filter(p => p.status === 'available').length,
      soldout: flashSale.products.filter(p => p.status === 'soldout').length,
      upcoming: flashSale.products.filter(p => p.status === 'upcoming').length,
      ended: flashSale.products.filter(p => p.status === 'ended').length
    };

    // Lấy top 5 sản phẩm bán chạy
    const topProducts = await Promise.all(
      flashSale.products
        .sort((a, b) => (b.soldQuantity / b.quantity) - (a.soldQuantity / a.quantity))
        .slice(0, 5)
        .map(async (product) => {
          return {
            _id: product._id,
            name: product.productId.name,
            image: product.productId.image,
            dungluongName: product.dungluongId ? product.dungluongId.name : null,
            mausacName: product.mausacId ? product.mausacId.name : null,
            quantity: product.quantity,
            soldQuantity: product.soldQuantity,
            soldPercent: product.quantity > 0 ? Math.round((product.soldQuantity / product.quantity) * 100) : 0,
            status: product.status
          };
        })
    );

    // Thống kê biến thể
    const variantStats = [];
    // Nhóm các sản phẩm theo dung lượng và màu sắc
    const variantGroups = {};

    for (const product of flashSale.products) {
      const dungluongId = product.dungluongId ? product.dungluongId._id.toString() : 'all';
      const mausacId = product.mausacId ? product.mausacId._id.toString() : 'all';
      const key = `${dungluongId}_${mausacId}`;

      if (!variantGroups[key]) {
        variantGroups[key] = {
          dungluongId: product.dungluongId ? product.dungluongId._id : null,
          dungluongName: product.dungluongId ? product.dungluongId.name : 'Tất cả',
          mausacId: product.mausacId ? product.mausacId._id : null,
          mausacName: product.mausacId ? product.mausacId.name : 'Tất cả',
          quantity: 0,
          soldQuantity: 0
        };
      }

      variantGroups[key].quantity += product.quantity;
      variantGroups[key].soldQuantity += product.soldQuantity;
    }

    // Chuyển đổi thành mảng và tính toán tỷ lệ
    for (const key in variantGroups) {
      const variant = variantGroups[key];
      variant.remainingQuantity = variant.quantity - variant.soldQuantity;
      variant.soldPercent = variant.quantity > 0 ? Math.round((variant.soldQuantity / variant.quantity) * 100) : 0;
      variantStats.push(variant);
    }

    // Trả về kết quả
    res.json({
      success: true,
      data: {
        _id: flashSale._id,
        name: flashSale.name,
        startTime: flashSale.startTime,
        endTime: flashSale.endTime,
        status,
        stats: {
          totalProducts: flashSale.products.length,
          totalQuantity,
          soldQuantity,
          soldPercent,
          totalVariants: flashSale.products.filter(p => p.dungluongId || p.mausacId).length,
          productStats
        },
        topProducts,
        variantStats
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê Flash Sale: ' + error.message
    });
  }
});


// Cập nhật API 9. [PUBLIC] Lấy chi tiết Flash Sale
router.get('/flash-sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    // Tìm Flash Sale
    const flashSale = await FlashSale.findOne({
      _id: id,
      isActive: true,
      isDeleted: false
    })
      .populate('products.productId', 'name image namekhongdau price content')
      .populate('products.dungluongId', 'name')
      .populate('products.mausacId', 'name');

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Flash Sale'
      });
    }

    // Cập nhật trạng thái Flash Sale và sản phẩm
    await updateFlashSaleStatus(flashSale);

    // Format dữ liệu cho frontend
    let status = 'upcoming';
    if (now > flashSale.endTime) {
      status = 'ended';
    } else if (now >= flashSale.startTime) {
      status = 'active';
    }

    const formattedProducts = flashSale.products.map(product => ({
      _id: product.productId._id,
      name: product.productId.name,
      image: product.productId.image,
      namekhongdau: product.productId.namekhongdau,
      content: product.productId.content,
      dungluongId: product.dungluongId ? product.dungluongId._id : null,
      dungluongName: product.dungluongId ? product.dungluongId.name : null,
      mausacId: product.mausacId ? product.mausacId._id : null,
      mausacName: product.mausacId ? product.mausacId.name : null,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      discountPercent: product.discountPercent,
      quantity: product.quantity,
      soldQuantity: product.soldQuantity,
      remainingQuantity: product.quantity - product.soldQuantity,
      status: product.status,
      soldPercent: Math.round((product.soldQuantity / product.quantity) * 100),
      limit: product.limit
    }));

    const formattedFlashSale = {
      _id: flashSale._id,
      name: flashSale.name,
      description: flashSale.description,
      bannerImage: flashSale.bannerImage,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
      status,
      remainingTime: status === 'active' ? flashSale.endTime - now : 0,
      timeUntilStart: status === 'upcoming' ? flashSale.startTime - now : 0,
      products: formattedProducts
    };

    res.json({
      success: true,
      data: formattedFlashSale
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết Flash Sale'
    });
  }
});

// 10. [PUBLIC] Lấy sản phẩm trong Flash Sale
router.get('/flash-sale-products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { dungluongId, mausacId } = req.query; // Lấy thêm thông tin về biến thể
    const now = new Date();

    // Xây dựng điều kiện tìm kiếm
    const matchConditions = {
      isActive: true,
      isDeleted: false,
      startTime: { $lte: now },
      endTime: { $gt: now },
      'products.productId': productId
    };

    // Thêm điều kiện về dung lượng và màu sắc nếu có
    if (dungluongId) {
      matchConditions['products.dungluongId'] = dungluongId;
    }

    if (mausacId) {
      matchConditions['products.mausacId'] = mausacId;
    }

    // Tìm Flash Sale đang diễn ra có chứa sản phẩm này
    const flashSale = await FlashSale.findOne(matchConditions)
      .populate('products.productId', 'name image namekhongdau price')
      .populate('products.dungluongId', 'name')
      .populate('products.mausacId', 'name');

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong Flash Sale đang diễn ra'
      });
    }

    // Tìm thông tin biến thể sản phẩm trong Flash Sale
    const productFilter = { productId: { $eq: productId } };
    if (dungluongId) productFilter.dungluongId = dungluongId;
    if (mausacId) productFilter.mausacId = mausacId;

    const product = flashSale.products.find(p => {
      // Kiểm tra productId
      const productIdMatch = p.productId._id.toString() === productId;

      // Kiểm tra dungluongId nếu được chỉ định
      const dungluongIdMatch = dungluongId
        ? p.dungluongId && p.dungluongId._id.toString() === dungluongId
        : true;

      // Kiểm tra mausacId nếu được chỉ định
      const mausacIdMatch = mausacId
        ? p.mausacId && p.mausacId._id.toString() === mausacId
        : true;

      return productIdMatch && dungluongIdMatch && mausacIdMatch;
    });

    if (!product || product.status !== 'available' || product.soldQuantity >= product.quantity) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không có sẵn trong Flash Sale'
      });
    }

    // Format dữ liệu cho frontend
    const flashSaleProduct = {
      flashSaleId: flashSale._id,
      flashSaleName: flashSale.name,
      productId: product.productId._id,
      name: product.productId.name,
      image: product.productId.image,
      namekhongdau: product.productId.namekhongdau,
      dungluongId: product.dungluongId ? product.dungluongId._id : null,
      dungluongName: product.dungluongId ? product.dungluongId.name : null,
      mausacId: product.mausacId ? product.mausacId._id : null,
      mausacName: product.mausacId ? product.mausacId.name : null,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      discountPercent: product.discountPercent,
      quantity: product.quantity,
      soldQuantity: product.soldQuantity,
      remainingQuantity: product.quantity - product.soldQuantity,
      limit: product.limit,
      endTime: flashSale.endTime,
      remainingTime: flashSale.endTime - now
    };

    res.json({
      success: true,
      data: flashSaleProduct
    });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm Flash Sale'
    });
  }
});

// 11. [PUBLIC] Cập nhật số lượng bán khi mua sản phẩm Flash Sale
router.post('/flash-sale-purchase', async (req, res) => {
  try {
    const { flashSaleId, productId, quantity = 1, userId } = req.body;

    if (!flashSaleId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết'
      });
    }

    const now = new Date();

    // Tìm Flash Sale
    const flashSale = await FlashSale.findOne({
      _id: flashSaleId,
      isActive: true,
      isDeleted: false,
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash Sale không tồn tại hoặc đã kết thúc'
      });
    }

    // Tìm sản phẩm trong Flash Sale
    const productIndex = flashSale.products.findIndex(p =>
      p.productId.toString() === productId && p.status === 'available'
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không có trong Flash Sale hoặc không có sẵn'
      });
    }

    const product = flashSale.products[productIndex];

    // Kiểm tra số lượng còn lại
    if (product.soldQuantity + quantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm trong Flash Sale không đủ'
      });
    }

    // Kiểm tra giới hạn mua của người dùng (nếu có userId)
    if (userId && product.limit > 0) {
      // Ở đây có thể thêm logic kiểm tra số lượng đã mua của người dùng
      // Ví dụ: lấy thông tin từ bảng đơn hàng để kiểm tra

      // Giả sử đã có hàm kiểm tra số lượng đã mua
      // const purchasedQuantity = await getPurchasedQuantity(userId, flashSaleId, productId);
      // if (purchasedQuantity + quantity > product.limit) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Bạn chỉ có thể mua tối đa ${product.limit} sản phẩm này trong Flash Sale`
      //   });
      // }
    }

    // Cập nhật số lượng đã bán
    flashSale.products[productIndex].soldQuantity += quantity;

    // Cập nhật trạng thái nếu đã hết hàng
    if (flashSale.products[productIndex].soldQuantity >= flashSale.products[productIndex].quantity) {
      flashSale.products[productIndex].status = 'soldout';
    }

    await flashSale.save();

    res.json({
      success: true,
      message: 'Cập nhật số lượng sản phẩm Flash Sale thành công',
      data: {
        remainingQuantity: product.quantity - flashSale.products[productIndex].soldQuantity
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật số lượng sản phẩm Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật số lượng sản phẩm Flash Sale'
    });
  }
});

// Hàm để cập nhật tồn kho một cách an toàn, tránh race condition
const safeUpdateStock = async (stockId, quantity, session) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Tìm record tồn kho hiện tại
      const stockRecord = await ProductSizeStock.findById(stockId).session(session);

      if (!stockRecord) {
        throw new Error('Không tìm thấy thông tin tồn kho');
      }

      // Nếu kho không giới hạn, không cần cập nhật số lượng
      if (stockRecord.unlimitedStock) {
        return { success: true, unlimitedStock: true };
      }

      // Kiểm tra nếu số lượng không đủ
      if (stockRecord.quantity < quantity) {
        throw new Error(`Số lượng tồn kho không đủ. Hiện chỉ còn ${stockRecord.quantity}`);
      }

      // Sử dụng findOneAndUpdate với filter __v để tránh race condition
      // Để đảm bảo rằng chúng ta chỉ cập nhật nếu không ai khác đã cập nhật record này
      const result = await ProductSizeStock.findOneAndUpdate(
        {
          _id: stockId,
          __v: stockRecord.__v,
          quantity: { $gte: quantity }
        },
        {
          $inc: {
            quantity: -quantity,
            __v: 1
          }
        },
        {
          new: true,
          session
        }
      );

      if (!result) {
        // Nếu không có result, có thể là do race condition
        // Chờ một khoảng thời gian ngắn và thử lại
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      return { success: true, remainingQuantity: result.quantity };
    } catch (error) {
      if (error.message.includes('Số lượng tồn kho không đủ')) {
        // Nếu là lỗi thiếu hàng, ném lại lỗi để xử lý ở nơi gọi hàm
        throw error;
      }

      // Nếu là lỗi khác, thử lại
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error(`Không thể cập nhật tồn kho sau ${maxAttempts} lần thử: ${error.message}`);
      }

      // Chờ một khoảng thời gian ngắn trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, 100 * attempts));
    }
  }

  throw new Error(`Không thể cập nhật tồn kho sau ${maxAttempts} lần thử`);
};


// Hàm để cập nhật số lượng Flash Sale một cách an toàn
const safeUpdateFlashSaleQuantity = async (flashSaleId, productIndex, quantity, session) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Tìm Flash Sale hiện tại
      const flashSale = await FlashSale.findById(flashSaleId).session(session);

      if (!flashSale) {
        throw new Error('Không tìm thấy Flash Sale');
      }

      // Kiểm tra nếu productIndex không hợp lệ
      if (productIndex < 0 || productIndex >= flashSale.products.length) {
        throw new Error('Sản phẩm không tồn tại trong Flash Sale');
      }

      const product = flashSale.products[productIndex];

      // Kiểm tra nếu số lượng không đủ
      if (product.soldQuantity + quantity > product.quantity) {
        throw new Error(`Số lượng sản phẩm trong Flash Sale không đủ. Hiện chỉ còn ${product.quantity - product.soldQuantity}`);
      }

      // Cập nhật sử dụng $inc để tránh race condition
      const result = await FlashSale.findOneAndUpdate(
        {
          _id: flashSaleId,
          'products._id': product._id,
          'products.soldQuantity': { $lte: product.quantity - quantity }
        },
        {
          $inc: {
            'products.$.soldQuantity': quantity
          },
          $set: {
            'products.$.status': (product.soldQuantity + quantity >= product.quantity) ? 'soldout' : product.status
          }
        },
        {
          new: true,
          session
        }
      );

      if (!result) {
        // Nếu không có kết quả, có thể là do race condition
        // Chờ một khoảng thời gian ngắn và thử lại
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Tìm sản phẩm đã cập nhật
      const updatedProduct = result.products.find(p => p._id.toString() === product._id.toString());

      return {
        success: true,
        remainingQuantity: updatedProduct.quantity - updatedProduct.soldQuantity,
        soldOut: updatedProduct.soldQuantity >= updatedProduct.quantity
      };
    } catch (error) {
      if (error.message.includes('Số lượng sản phẩm trong Flash Sale không đủ')) {
        // Nếu là lỗi thiếu hàng, ném lại lỗi để xử lý ở nơi gọi hàm
        throw error;
      }

      // Nếu là lỗi khác, thử lại
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error(`Không thể cập nhật số lượng Flash Sale sau ${maxAttempts} lần thử: ${error.message}`);
      }

      // Chờ một khoảng thời gian ngắn trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, 100 * attempts));
    }
  }

  throw new Error(`Không thể cập nhật số lượng Flash Sale sau ${maxAttempts} lần thử`);
};

// Thêm vào flasheroutes.js
router.get('/product-flash-sale-variants/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();

    // Tìm tất cả Flash Sale đang diễn ra có chứa sản phẩm này
    const flashSales = await FlashSale.find({
      isActive: true,
      isDeleted: false,
      startTime: { $lte: now },
      endTime: { $gt: now },
      'products.productId': productId
    }).lean();

    if (!flashSales || flashSales.length === 0) {
      return res.json({
        success: true,
        variants: []
      });
    }

    // Lấy tất cả biến thể Flash Sale cho sản phẩm này
    const flashSaleVariants = [];
    let defaultVariant = null;

    flashSales.forEach(flashSale => {
      flashSale.products.forEach(product => {
        if (product.productId.toString() === productId &&
          product.status === 'available' &&
          product.soldQuantity < product.quantity) {

          const variant = {
            flashSaleId: flashSale._id,
            productId: product.productId,
            dungluongId: product.dungluongId,
            mausacId: product.mausacId,
            originalPrice: product.originalPrice,
            salePrice: product.salePrice,
            discountPercent: product.discountPercent,
            remainingQuantity: product.quantity - product.soldQuantity
          };

          flashSaleVariants.push(variant);

          // Lưu biến thể đầu tiên làm mặc định nếu chưa có
          if (!defaultVariant) {
            defaultVariant = {
              dungluongId: product.dungluongId,
              mausacId: product.mausacId
            };
          }
        }
      });
    });

    res.json({
      success: true,
      variants: flashSaleVariants,
      defaultVariant
    });
  } catch (error) {
    console.error('Lỗi khi lấy biến thể Flash Sale:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy biến thể Flash Sale'
    });
  }
});

// Xuất router
module.exports = router;