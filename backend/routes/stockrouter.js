const router = require('express').Router()
const { ProductSizeStock } = require('../models/ProductSizeStockmodel');
const ChitietSp = require('../models/chitietSpModel');
const DungLuong = require('../models/DungLuongModel');
const MauSac = require('../models/MauSacModel');
const LoaiSP = require('../models/LoaiSanPham');
router.get('/tonkho/sanpham', async (req, res) => {
  try {
    // Lấy tất cả sản phẩm
    const sanphams = await ChitietSp.ChitietSp.find().lean();

    // Xử lý từng sản phẩm
    const productList = await Promise.all(
      sanphams.map(async (product) => {
        try {
          // Kiểm tra sản phẩm có tồn tại không
          const productExists = await ChitietSp.ChitietSp.findById(product._id);
          if (!productExists) {
            return null; // Bỏ qua nếu sản phẩm đã bị xóa
          }

          // Lấy danh sách dung lượng của sản phẩm
          const dungluongs = await DungLuong.dungluong.find({ idloaisp: product.idloaisp }).lean();

          // Nếu không có dung lượng nào, bỏ qua sản phẩm này
          if (!dungluongs || dungluongs.length === 0) {
            return null;
          }

          // Xử lý mỗi dung lượng và màu sắc
          const dungLuongData = await Promise.all(
            dungluongs.map(async (dungluong) => {
              try {
                // Kiểm tra dung lượng có tồn tại không
                const dungluongExists = await DungLuong.dungluong.findById(dungluong._id);
                if (!dungluongExists) {
                  return null; // Bỏ qua nếu dung lượng đã bị xóa
                }

                // Lấy tất cả màu sắc cho dung lượng này
                const mausacs = await MauSac.mausac.find({ dungluong: dungluong._id }).lean();

                if (!mausacs || mausacs.length === 0) {
                  return null; // Bỏ qua nếu không có màu sắc
                }

                // Xử lý từng màu sắc
                const mausacData = await Promise.all(
                  mausacs.map(async (mausac) => {
                    try {
                      // Kiểm tra màu sắc có tồn tại không
                      const mausacExists = await MauSac.mausac.findById(mausac._id);
                      if (!mausacExists) {
                        return null; // Bỏ qua nếu màu sắc đã bị xóa
                      }

                      // Tìm thông tin tồn kho cho sản phẩm/dung lượng/màu sắc
                      const stock = await ProductSizeStock.findOne({
                        productId: product._id,
                        dungluongId: dungluong._id,
                        mausacId: mausac._id
                      }).lean();

                      return {
                        _id: mausac._id,
                        name: mausac.name,
                        price: mausac.price || 0,
                        images: mausac.image || [],
                        quantity: stock ? stock.quantity || 0 : 0, // Đảm bảo quantity không bị null
                      };
                    } catch (error) {
                      console.error(`Lỗi khi xử lý màu sắc ${mausac._id}:`, error);
                      return null;
                    }
                  })
                );

                // Lọc ra màu sắc hợp lệ (không null)
                const validMauSacData = mausacData.filter(ms => ms !== null);

                if (validMauSacData.length === 0) {
                  return null; // Bỏ qua dung lượng nếu không có màu sắc hợp lệ
                }

                return {
                  _id: dungluong._id,
                  name: dungluong.name,
                  mausac: validMauSacData
                };
              } catch (error) {
                console.error(`Lỗi khi xử lý dung lượng ${dungluong._id}:`, error);
                return null;
              }
            })
          );

          // Lọc ra dung lượng hợp lệ (không null)
          const filteredDungLuongData = dungLuongData.filter(dl => dl !== null);

          // Nếu không có dung lượng hợp lệ, bỏ qua sản phẩm này
          if (filteredDungLuongData.length === 0) {
            return null;
          }

          return {
            _id: product._id,
            name: product.name,
            image: product.image,
            price: product.price,
            dungluong: filteredDungLuongData
          };
        } catch (error) {
          console.error(`Lỗi khi xử lý sản phẩm ${product._id}:`, error);
          return null;
        }
      })
    );

    // Lọc ra các sản phẩm hợp lệ (không null)
    const filteredProductList = productList.filter(product => product !== null);

    res.json(filteredProductList);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});



router.post('/stock/add', async (req, res) => {
  try {
    console.log("🚀 Dữ liệu nhận được từ request:", req.body);

    let { productId, dungluongId, mausacId, quantity } = req.body;

    // Kiểm tra productId (bắt buộc)
    if (!productId) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    // Nếu dungluongId hoặc mausacId là rỗng (""), thì đặt thành null
    if (!dungluongId) dungluongId = null;
    if (!mausacId) mausacId = null;

    let existingStock = await ProductSizeStock.findOne({ productId, dungluongId, mausacId });

    if (!existingStock) {
      const sku = `${productId}-${dungluongId || 'default'}-${mausacId || 'default'}`;
      const newStock = new ProductSizeStock({
        productId,
        dungluongId,
        mausacId,
        quantity: quantity !== undefined ? quantity : null,
        sku
      });
      await newStock.save();
      return res.status(201).json({ message: "Thêm tồn kho thành công", stock: newStock });
    } else {
      existingStock.quantity = quantity;
      await existingStock.save();
      return res.status(200).json({ message: "Số lượng tồn kho đã được điều chỉnh", stock: existingStock });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi cập nhật tồn kho', error });
  }
});

router.get('/stock/:productId/:dungluongId/:mausacId', async (req, res) => {
  try {
    const { productId, dungluongId, mausacId } = req.params;
    const stock = await ProductSizeStock.findOne({ productId, dungluongId, mausacId });

    if (!stock) return res.status(404).json({ message: 'Không tìm thấy tồn kho' });

    res.json({
      stock: stock.unlimitedStock ? 'Không giới hạn' : stock.quantity,
      unlimitedStock: stock.unlimitedStock
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy tồn kho', error });
  }
});
// Thay đổi trong routes/stockrouter.js
// Cập nhật route /stock/update
router.post('/stock/update', async (req, res) => {
  try {
    const { productId, dungluongId, mausacId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    // Thực hiện atomic update - kiểm tra và cập nhật trong cùng một thao tác
    const result = await ProductSizeStock.findOneAndUpdate(
      { 
        productId, 
        dungluongId: dungluongId || null, 
        mausacId: mausacId || null,
        $or: [
          { unlimitedStock: true },
          { quantity: { $gte: quantity } }
        ]
      },
      { 
        $inc: { quantity: -quantity } 
      },
      { 
        new: true,  // Trả về document đã cập nhật
        runValidators: true  // Đảm bảo ràng buộc vẫn được áp dụng
      }
    );

    if (!result) {
      return res.status(400).json({ message: "Hàng tồn kho không đủ hoặc không tìm thấy" });
    }

    res.status(200).json({ 
      message: "Cập nhật tồn kho thành công", 
      stock: result.unlimitedStock ? 'Không giới hạn' : result.quantity
    });
  } catch (error) {
    console.error("Lỗi cập nhật tồn kho:", error);
    res.status(500).json({ message: "Lỗi cập nhật tồn kho", error: error.message });
  }
});

module.exports = router