const router = require('express').Router()
const { ProductSizeStock } = require('../models/ProductSizeStockmodel');

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
  router.post('/stock/update', async (req, res) => {
    try {
      const { productId, dungluongId, mausacId, quantity } = req.body;
  
      // Kiểm tra dữ liệu đầu vào
      if (!productId) {
        return res.status(400).json({ message: "Thiếu productId" });
      }
  
      // Nếu dungluongId hoặc mausacId là rỗng (""), đặt thành null
      if (!dungluongId) dungluongId = null;
      if (!mausacId) mausacId = null;
  
      // Tìm sản phẩm trong kho
      let existingStock = await ProductSizeStock.findOne({ productId, dungluongId, mausacId });
  
      if (!existingStock) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm trong kho" });
      }
  
      // Kiểm tra nếu tồn kho không đủ số lượng
      if (existingStock.quantity < quantity) {
        return res.status(400).json({ message: "Hàng tồn kho không đủ" });
      }
  
      // Giảm số lượng tồn kho
      existingStock.quantity -= quantity;
      await existingStock.save();
  
      res.status(200).json({ message: "Cập nhật tồn kho thành công", stock: existingStock });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi cập nhật tồn kho", error });
    }
  });
  
  module.exports = router