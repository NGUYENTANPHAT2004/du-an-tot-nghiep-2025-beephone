const express = require('express')
const router = express.Router()
const HoaDon = require('../models/HoaDonModel')
const moment = require('moment')
const MaGiamGia = require('../models/MaGiamGiaModel')
const SanPham = require('../models/chitietSpModel')
const DungLuong = require('../models/DungLuongModel')
const User = require('../models/user.model')
const momenttimezone = require('moment-timezone');
const { ProductSizeStock } = require('../models/ProductSizeStockmodel')
const { 
  generateVoucherForUser, 
  isFirstOrderVoucherEligible, 
  isThirdOrderVoucherEligible 
} = require('../socket/handlers/voucherGenerator');
const db = require('../models/db')
const Category = require('../models/CategoryModel');
const LoaiSP = require('../models/LoaiSanPham').LoaiSP;

function sortObject (obj) {
  let sorted = {}
  let str = []
  let key
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
  }
  return sorted
}

router.get('/gethoadon', async (req, res) => {
  try {
    const hoadon = await HoaDon.hoadon.find().lean()
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình xóa' })
  }
})

router.post('/deletehoaddon', async (req, res) => {
  try {
    const { ids } = req.body
    
    // Find orders that might need inventory restoration before deleting
    const ordersToDelete = await HoaDon.hoadon.find({ _id: { $in: ids } })
    
    // Restore inventory for orders that reduced inventory but weren't completed
    for (const order of ordersToDelete) {
      // Only restore if the order was created but not paid or failed
      if (!order.thanhtoan && order.trangthai !== 'Hủy Đơn Hàng') {
        await restoreInventory(order.sanpham)
      }
    }
    
    await HoaDon.hoadon.deleteMany({ _id: { $in: ids } })
    res.json({ message: 'Xóa hóa đơn thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình xóa' })
  }
})

// Helper function to restore inventory
// Improved helper function to restore inventory
async function restoreInventory(sanphams) {
  if (!sanphams || !Array.isArray(sanphams) || sanphams.length === 0) {
    console.log('No products to restore in inventory');
    return;
  }
  
  const failedRestores = [];
  
  for (const sanpham of sanphams) {
    try {
      if (!sanpham || !sanpham.idsp || !sanpham.dungluong || !sanpham.soluong) {
        console.warn('Invalid product data for inventory restore:', sanpham);
        continue;
      }
      
      const { idsp, soluong, dungluong, idmausac } = sanpham;
      
      const stockItem = await ProductSizeStock.findOne({
        productId: idsp,
        dungluongId: dungluong,
        mausacId: idmausac
      });
      
      if (stockItem && !stockItem.unlimitedStock) {
        stockItem.quantity += soluong;
        await stockItem.save();
        console.log(`Restored ${soluong} items to inventory for product ${idsp}`);
      } else {
        console.log(`Stock item not found or has unlimited stock for product ${idsp}, dungluong: ${dungluong}, mausac: ${idmausac}`);
      }
    } catch (error) {
      console.error(`Error restoring inventory for product ${sanpham?.idsp}:`, error);
      failedRestores.push(sanpham);
    }
  }
  
  // Log if any items failed to be restored
  if (failedRestores.length > 0) {
    console.error(`Failed to restore ${failedRestores.length} product(s) to inventory`);
  }
}

// Improved helper function to reduce inventory
async function reduceInventory(sanphams) {
  if (!sanphams || !Array.isArray(sanphams) || sanphams.length === 0) {
    throw new Error('No products to reduce in inventory');
  }
  
  const reducedItems = [];
  
  try {
    for (const sanpham of sanphams) {
      if (!sanpham || !sanpham.idsp || !sanpham.dungluong || !sanpham.soluong) {
        throw new Error('Invalid product data for inventory reduction');
      }
      
      const { idsp, soluong, dungluong, idmausac } = sanpham;
      
      const stockItem = await ProductSizeStock.findOne({
        productId: idsp,
        dungluongId: dungluong,
        mausacId: idmausac
      });
      
      if (stockItem) {
        if (!stockItem.unlimitedStock) {
          if (stockItem.quantity < soluong) {
            // Roll back any inventory reductions made so far
            for (const item of reducedItems) {
              await ProductSizeStock.findByIdAndUpdate(
                item.stockId,
                { $inc: { quantity: item.quantity } }
              );
            }
            
            throw new Error(`Sản phẩm không đủ số lượng trong kho. Hiện chỉ còn ${stockItem.quantity} sản phẩm.`);
          }
          
          stockItem.quantity -= soluong;
          await stockItem.save();
          reducedItems.push({ 
            stockId: stockItem._id, 
            quantity: soluong 
          });
        }
      } else {
        console.log(`Không tìm thấy thông tin tồn kho cho sản phẩm: ${idsp}, dungluong: ${dungluong}, mausac: ${idmausac}`);
      }
    }
  } catch (error) {
    // If there's an error during reduction and we already reduced some items,
    // restore those items before propagating the error
    if (reducedItems.length > 0) {
      console.error('Error during inventory reduction, rolling back changes:', error);
      
      for (const item of reducedItems) {
        try {
          await ProductSizeStock.findByIdAndUpdate(
            item.stockId,
            { $inc: { quantity: item.quantity } }
          );
        } catch (restoreErr) {
          console.error(`Critical error: Failed to restore inventory for stock item ${item.stockId}:`, restoreErr);
          // Continue to try restoring other items even if this one failed
        }
      }
    }
    
    throw error;
  }
}


router.post('/posthoadon', async (req, res) => {
  try {
    const {
      name,
      phone,
      sex,
      nguoinhan,
      giaotannoi,
      address,
      ghichu,
      magiamgia,
      sanphams,
      userId // ✅ nhận thêm từ body
    } = req.body;

    const hoadon = new HoaDon.hoadon({
      name,
      phone,
      sex,
      nguoinhan,
      giaotannoi,
      ngaymua: moment().toISOString(),
      trangthai: 'Đang xử lý',
      tongtien: 0,
      userId: userId || null // ✅ gán userId nếu có
    });

    let tongtien = 0;

    for (const sanpham of sanphams) {
      const { idsp, soluong } = sanpham;
      const sanpham1 = await SanPham.ChitietSp.findById(idsp);
      hoadon.sanpham.push({ idsp, soluong, price: sanpham1.price });
      tongtien += sanpham1.price * soluong;
    }

    hoadon.tongtien = tongtien;

    if (magiamgia) {
      const magiamgia1 = await MaGiamGia.magiamgia.findOne({ magiamgia });
      const ngayHienTai = moment();
      const ngayKetThuc = moment(magiamgia1.ngayketthuc);

      if (ngayHienTai.isAfter(ngayKetThuc)) {
        return res.json({ message: 'Mã giảm giá đã hết hạn' });
      }

      const daSuDung = await HoaDon.hoadon.findOne({ phone, magiamgia });
      if (daSuDung) {
        return res.status(400).json({ message: 'Bạn đã sử dụng mã giảm giá này' });
      }

      hoadon.magiamgia = magiamgia;
      const giamGia = magiamgia1.sophantram / 100;
      hoadon.tongtien = tongtien - tongtien * giamGia;
    }

    if (giaotannoi) hoadon.address = address;
    if (ghichu) hoadon.ghichu = ghichu;

    await hoadon.save();
    res.json(hoadon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi trong quá trình thêm' });
  }
});

async function validateVoucher(magiamgia, phone, totalAmount) {
  if (!magiamgia) return { valid: false, message: 'Không có mã giảm giá' };
  
  const voucher = await MaGiamGia.magiamgia.findOne({ magiamgia });
  if (!voucher) return { valid: false, message: 'Mã giảm giá không tồn tại' };
  
  // Check expiration
  const ngayHienTai = moment();
  const ngayKetThuc = moment(voucher.ngayketthuc);
  const ngayBatDau = moment(voucher.ngaybatdau);
  if (ngayHienTai.isAfter(ngayKetThuc) || ngayHienTai.isBefore(ngayBatDau)) {
    return { valid: false, message: 'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng' };
  }
  
  // Check available quantity
  if (voucher.soluong <= 0) {
    return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
  }
  
  // Check for minimum order value
  if (totalAmount < voucher.minOrderValue) {
    return { 
      valid: false, 
      message: `Giá trị đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ` 
    };
  }
  
  // Check for maximum order value
  if (voucher.maxOrderValue && totalAmount > voucher.maxOrderValue) {
    return { 
      valid: false, 
      message: `Giá trị đơn hàng không được vượt quá ${voucher.maxOrderValue.toLocaleString('vi-VN')}đ` 
    };
  }
  
  // Check golden hour restrictions
  if (voucher.goldenHourStart && voucher.goldenHourEnd) {
    const now = moment();
    const currentTime = now.format('HH:mm');
    
    let isWithinHour = false;
    if (voucher.goldenHourStart <= voucher.goldenHourEnd) {
      isWithinHour = currentTime >= voucher.goldenHourStart && currentTime <= voucher.goldenHourEnd;
    } else {
      isWithinHour = currentTime >= voucher.goldenHourStart || currentTime <= voucher.goldenHourEnd;
    }
    
    if (!isWithinHour) {
      return { 
        valid: false, 
        message: `Mã giảm giá chỉ có hiệu lực trong khung giờ vàng: ${voucher.goldenHourStart} - ${voucher.goldenHourEnd}` 
      };
    }
  }
  
  // Check day of week restrictions
  if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
    const today = moment().day(); // 0-6, Sunday-Saturday
    if (!voucher.daysOfWeek.includes(today)) {
      const allowedDays = voucher.daysOfWeek
        .map(day => ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day])
        .join(', ');
      
      return { 
        valid: false, 
        message: `Mã giảm giá chỉ có hiệu lực vào: ${allowedDays}` 
      };
    }
  }
  
  // Check if serverWide or one-time-per-user restriction
  if (!voucher.isServerWide && voucher.isOneTimePerUser) {
    // Check if user has already used this voucher
    if (voucher.appliedUsers && voucher.appliedUsers.includes(phone)) {
      return { valid: false, message: 'Bạn đã sử dụng mã giảm giá này' };
    }
  }
  
  // All checks passed, voucher is valid
  return { 
    valid: true, 
    voucher
  };
}
router.post('/create_payment_url', async (req, res) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh'

  let date = new Date()
  let createDate = moment(date).format('YYYYMMDDHHmmss')

  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress

  let config = require('config')

  let tmnCode = config.get('vnp_TmnCode')
  let secretKey = config.get('vnp_HashSecret')
  let vnpUrl = config.get('vnp_Url')
  let returnUrl = config.get('vnp_ReturnUrl')
  let orderId = moment(date).format('DDHHmmss')
  let amount = req.body.amount
  let bankCode = req.body.bankCode

  let locale = req.body.language || 'vn'
  const { name,nguoinhan, phone, sex, giaotannoi, address, ghichu, magiamgia, sanphams, userId } =
    req.body

  let currCode = 'VND'
  let vnp_Params = {}
  vnp_Params['vnp_Version'] = '2.1.0'
  vnp_Params['vnp_Command'] = 'pay'
  vnp_Params['vnp_TmnCode'] = tmnCode
  vnp_Params['vnp_Locale'] = locale
  vnp_Params['vnp_CurrCode'] = currCode
  vnp_Params['vnp_TxnRef'] = orderId
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId
  vnp_Params['vnp_OrderType'] = 'other'
  vnp_Params['vnp_Amount'] = amount * 100
  vnp_Params['vnp_ReturnUrl'] = returnUrl
  vnp_Params['vnp_IpAddr'] = ipAddr
  vnp_Params['vnp_CreateDate'] = createDate
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode
  }
  const ngaymua = momenttimezone().toDate()
  const hoadon = new HoaDon.hoadon({
    name,
    phone,
    sex,
    nguoinhan,
    giaotannoi,
    ngaymua,
    trangthai: 'Đang xử lý',
    tongtien: 0,
    orderId,
    thanhtoan: false,
    userId: userId || null // Explicitly set to false initially
  })

  hoadon.maHDL = 'HD' + hoadon._id.toString().slice(-4)
  let tongtien = 0

  for (const sanpham of sanphams) {
    const { idsp, soluong, dungluong, idmausac, price, mausac } = sanpham
    hoadon.sanpham.push({
      idsp,
      soluong,
      price,
      dungluong,
      idmausac, // Make sure to store idmausac
      mausac
    })
    tongtien += price * soluong
  }
  
  hoadon.tongtien = tongtien

  if (magiamgia) {
    // Use the enhanced validation function
    const validationResult = await validateVoucher(magiamgia, phone, tongtien);
    
    if (!validationResult.valid) {
      return res.json({ message: validationResult.message });
    }
    
    const magiamgia1 = validationResult.voucher;
    
    hoadon.magiamgia = magiamgia;
    const giamGia = magiamgia1.sophantram / 100;
    hoadon.tongtien = tongtien - tongtien * giamGia;
    vnp_Params['vnp_Amount'] = hoadon.tongtien * 100;
    
    // If this is a one-time-per-user voucher, add user to appliedUsers array
    if (magiamgia1.isOneTimePerUser && !magiamgia1.appliedUsers.includes(phone)) {
      magiamgia1.appliedUsers.push(phone);
      await magiamgia1.save();
    }
  } else {
    hoadon.tongtien = tongtien;
    vnp_Params['vnp_Amount'] = tongtien * 100;
  }

  if (giaotannoi) {
    hoadon.address = address
  }
  if (ghichu) {
    hoadon.ghichu = ghichu
  }

  try {
    // Check and reduce inventory before saving the order
    await reduceInventory(hoadon.sanpham);
    
    // Save the order with payment pending
    await hoadon.save();
    
    // Create an expiration timeout for the order payment
    // If payment is not completed within 15 minutes, inventory will be restored 
    // and order status updated
    setTimeout(async () => {
      try {
        const order = await HoaDon.hoadon.findById(hoadon._id);
        if (order && !order.thanhtoan && order.trangthai !== 'Hủy Đơn Hàng') {
          // Payment wasn't completed within the timeframe
          await restoreInventory(order.sanpham);
          order.trangthai = 'Thanh toán hết hạn';
          await order.save();
          console.log(`Payment timeout for order ${order._id}, inventory restored`);
        }
      } catch (err) {
        console.error('Error handling payment timeout:', err);
      }
    }, 15 * 60 * 1000); // 15 minutes timeout
    
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(400).json({ message: error.message || 'Lỗi khi xử lý đơn hàng' });
  }

  vnp_Params = sortObject(vnp_Params)

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
  vnp_Params['vnp_SecureHash'] = signed
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })

  res.json(vnpUrl)
})

router.get('/vnpay_return', async (req, res) => {
  let vnp_Params = req.query

  let secureHash = vnp_Params['vnp_SecureHash']
  let orderId = vnp_Params['vnp_TxnRef']
  let hoadon = await HoaDon.hoadon.findOne({ orderId: orderId })
  
  if (!hoadon) {
    return res.redirect('https://localhost:3000/thanhcong')
  }

  let magiamgia = await MaGiamGia.magiamgia.findOne({
    magiamgia: hoadon.magiamgia
  })

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']
  vnp_Params = sortObject(vnp_Params)

  let config = require('config')
  let secretKey = config.get('vnp_HashSecret')

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  if (secureHash === signed) {
    if (vnp_Params['vnp_ResponseCode'] === '00') {
      // Payment successful
      hoadon.thanhtoan = true;
      hoadon.trangthai = 'Đã thanh toán';
      
      // Apply discount code if used
      if (magiamgia) {
        magiamgia.soluong = magiamgia.soluong - 1;
        await magiamgia.save();
      }
      
      await hoadon.save();
      
      // Check for first-time purchase or every third purchase
      try {
        const userPhone = hoadon.phone;
        
        // Check if this is their first order
        if (await isFirstOrderVoucherEligible(userPhone)) {
          await generateVoucherForUser(userPhone, 'first-order');
        }
        
        // Check if this is their third, sixth, ninth, etc. order
        if (await isThirdOrderVoucherEligible(userPhone)) {
          await generateVoucherForUser(userPhone, 'third-order');
        }
      } catch (error) {
        console.error('Error generating automatic voucher:', error);
        // Don't fail the order just because voucher generation failed
      }
      
      return res.redirect('https://localhost:3000/thanhcong?success=true');
    } else {
      // Payment failed, restore inventory
      await restoreInventory(hoadon.sanpham);
      
      // Mark the order as payment failed
      hoadon.thanhtoan = false;
      hoadon.trangthai = 'Thanh toán thất bại';
      await hoadon.save();
      
      console.log(`Payment failed for order ${orderId}, inventory restored`);
      return res.redirect('https://localhost:3000/thanhcong');
    }
  } else {
    // Hash verification failed, potential security issue
    console.log('Hash verification failed');
    return res.redirect('https://localhost:3000/thanhcong');
  }
})
router.get('/checknewvouchers/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin số điện thoại' 
      });
    }
    
    // Get current date
    const currentDate = new Date();
    
    // Find recent vouchers for this user (created in the last hour)
    const oneHourAgo = moment().subtract(1, 'hour').toDate();
    
    const recentVouchers = await MaGiamGia.magiamgia.find({
      magiamgia: { 
        $regex: /^(FIRST|LOYAL|WELCOME|REWARD)/ 
      },
      ngaybatdau: { $gte: oneHourAgo },
      ngayketthuc: { $gte: currentDate },
      soluong: { $gt: 0 },
      $or: [
        { isServerWide: true },
        { appliedUsers: { $nin: [phone] } }
      ]
    }).sort({ ngaybatdau: -1 }).limit(5).lean();
    
    // Transform vouchers for response
    const formattedVouchers = recentVouchers.map(voucher => ({
      code: voucher.magiamgia,
      discount: voucher.sophantram,
      minOrderValue: voucher.minOrderValue || 0,
      expiresAt: moment(voucher.ngayketthuc).format('DD/MM/YYYY'),
      isNew: moment(voucher.ngaybatdau).isAfter(oneHourAgo)
    }));
    
    res.json({
      success: true,
      hasNewVouchers: formattedVouchers.length > 0,
      vouchers: formattedVouchers
    });
  } catch (error) {
    console.error('Error checking new vouchers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra voucher mới' 
    });
  }
});

router.post('/settrangthai/:idhoadon', async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon
    const { trangthai } = req.body
    const hoadon = await HoaDon.hoadon.findById(idhoadon)
    
    if (!hoadon) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }
    
    // Check if the order is being canceled
    if (trangthai === 'Hủy Đơn Hàng' && hoadon.trangthai !== 'Hủy Đơn Hàng') {
      // Only restore inventory if the order was not already canceled and payment was successful
      // For unpaid orders, we've already reduced inventory so need to restore it
      if (hoadon.thanhtoan) {
        // Paid orders also need inventory restoration when canceled
        await restoreInventory(hoadon.sanpham);
      } else if (hoadon.trangthai !== 'Thanh toán thất bại' && hoadon.trangthai !== 'Thanh toán hết hạn') {
        // Unpaid orders (except those marked as failed/expired) need inventory restoration
        await restoreInventory(hoadon.sanpham);
      }
    }
    
    // Update order status
    hoadon.trangthai = trangthai
    await hoadon.save()
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'lỗi' })
  }
})

router.get('/getchitiethd/:idhoadon', async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon

    const hoadon = await HoaDon.hoadon.findById(idhoadon)
    const hoadonsanpham = await Promise.all(
      hoadon.sanpham.map(async sanpham => {
        const sanpham1 = await SanPham.ChitietSp.findById(sanpham.idsp)
        const dungluong = await DungLuong.dungluong.findById(sanpham.dungluong)
        return {
          namesanpham: sanpham1.name,
          dungluong: dungluong.name,
          mausac: sanpham.mausac,
          soluong: sanpham.soluong,
          price: sanpham.price
        }
      })
    )
    const hoadonjson = {
      nguoinhan : hoadon.nguoinhan,
      name: hoadon.name,
      phone: hoadon.phone,
      sex: hoadon.sex,
      address: hoadon.address,
      ghichu: hoadon.ghichu || '',
      magiamgia: hoadon.magiamgia || '',
      ngaymua: moment(hoadon.ngaymua).format('DD/MM/YYYY'),
      thanhtoan: hoadon.thanhtoan,
      trangthai: hoadon.trangthai,
      tongtien: hoadon.tongtien,
      hoadonsanpham: hoadonsanpham
    }
    res.json(hoadonjson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi khi lấy thông tin hóa đơn' })
  }
})

router.get('/getdoanhthu', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập ngày bắt đầu và ngày kết thúc.' })
    }

    const start = moment(startDate, 'YYYY-MM-DD').startOf('day')
    const end = moment(endDate, 'YYYY-MM-DD').endOf('day')

    const hoadons = await HoaDon.hoadon.find({
      ngaymua: { $gte: start.toDate(), $lte: end.toDate() }
    })

    let doanhthuTheoNgay = {}
    let current = moment(start)

    while (current.isSameOrBefore(end, 'day')) {
      doanhthuTheoNgay[current.format('DD/MM/YYYY')] = 0
      current.add(1, 'days')
    }

    hoadons.forEach(hd => {
      const ngay = moment(hd.ngaymua).format('DD/MM/YYYY')
      doanhthuTheoNgay[ngay] += hd.tongtien
    })

    const doanhthuArray = Object.keys(doanhthuTheoNgay).map(ngay => ({
      ngay,
      doanhthu: doanhthuTheoNgay[ngay]
    }))

    res.json(doanhthuArray)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi server!' })
  }
})
router.get('/product-sales-trend', async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let matchQuery = {
      ngaymua: { $gte: start, $lte: end },
      trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
    };

    // Add product filter if provided
    if (productId) {
      matchQuery["sanpham.idsp"] = new db.mongoose.Types.ObjectId(productId);
    }

    const result = await HoaDon.hoadon.aggregate([
      { $match: matchQuery },
      { $unwind: "$sanpham" },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$ngaymua" } },
          productId: "$sanpham.idsp",
          quantity: "$sanpham.soluong",
          revenue: { $multiply: ["$sanpham.soluong", "$sanpham.price"] }
        }
      },
      {
        $group: {
          _id: {
            date: "$date",
            productId: "$productId"
          },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$revenue" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Transform the data for easier frontend consumption
    const transformedData = await Promise.all(
      result.map(async (item) => {
        const product = await SanPham.ChitietSp.findById(item._id.productId);
        return {
          date: item._id.date,
          productId: item._id.productId,
          productName: product ? product.name : "Không rõ",
          quantity: item.totalQuantity,
          revenue: item.totalRevenue
        };
      })
    );

    res.json(transformedData);
  } catch (err) {
    console.error("Error in product-sales-trend:", err);
    res.status(500).json({ message: "Lỗi xu hướng bán sản phẩm", error: err.message });
  }
});

// New route for product category statistics
// Fixed category-stats route in HoaDonRoutes.js
// Fixed category-stats route in HoaDonRoutes.js
router.get('/category-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // First, get all products sold in the period
    const soldProducts = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành', 'Đã nhận'] }
        }
      },
      { $unwind: "$sanpham" },
      {
        $group: {
          _id: "$sanpham.idsp",
          totalSold: { $sum: "$sanpham.soluong" },
          totalRevenue: { $sum: { $multiply: ["$sanpham.soluong", "$sanpham.price"] } }
        }
      }
    ]);

    // If no data, return empty array
    if (soldProducts.length === 0) {
      return res.json([]);
    }

    // Get category info for each product
    const categoryStats = {};
    
    for (const product of soldProducts) {
      try {
        if (!product || !product._id) continue;

        const productDetails = await SanPham.ChitietSp.findById(product._id);
        
        // Skip if product not found or has no category
        if (!productDetails || !productDetails.idloaisp) continue;
        
        const loaisp = await LoaiSP.findById(productDetails.idloaisp);
        if (!loaisp) continue;
        
        const categoryId = loaisp._id.toString();
        const categoryName = loaisp.name || "Không rõ danh mục";
        
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            categoryId,
            categoryName,
            productCount: 0,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        
        categoryStats[categoryId].productCount++;
        categoryStats[categoryId].totalQuantity += product.totalSold || 0;
        categoryStats[categoryId].totalRevenue += product.totalRevenue || 0;
      } catch (err) {
        console.error(`Error processing product ${product._id}:`, err);
      }
    }

    // Convert to array and sort by revenue
    const sortedStats = Object.values(categoryStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // If no categories were found, return empty array
    if (sortedStats.length === 0) {
      return res.json([]);
    }

    // Calculate percentages
    const totalRevenue = sortedStats.reduce((sum, category) => sum + category.totalRevenue, 0);
    const totalQuantity = sortedStats.reduce((sum, category) => sum + category.totalQuantity, 0);

    const statsWithPercentages = sortedStats.map(category => ({
      ...category,
      revenuePercentage: totalRevenue > 0 ? ((category.totalRevenue / totalRevenue) * 100).toFixed(2) : "0",
      quantityPercentage: totalQuantity > 0 ? ((category.totalQuantity / totalQuantity) * 100).toFixed(2) : "0"
    }));

    res.json(statsWithPercentages);
  } catch (err) {
    console.error("Error in category-stats:", err);
    res.status(500).json({ message: "Lỗi thống kê danh mục", error: err.message });
  }
});
router.get('/top-products', async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // First get the total sales for percentage calculation
    const totalSales = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
        }
      },
      { $unwind: "$sanpham" },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$sanpham.soluong" },
          totalRevenue: { 
            $sum: { $multiply: ["$sanpham.soluong", "$sanpham.price"] }
          }
        }
      }
    ]);

    const totals = totalSales[0] || { totalQuantity: 0, totalRevenue: 0 };

    // Get top products with detailed information
    const result = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
        }
      },
      { $unwind: "$sanpham" },
      {
        $group: {
          _id: {
            productId: "$sanpham.idsp",
            dungluong: "$sanpham.dungluong",
            mausac: "$sanpham.idmausac"
          },
          soluong: { $sum: "$sanpham.soluong" },
          doanhthu: {
            $sum: { $multiply: ["$sanpham.soluong", "$sanpham.price"] }
          },
          averagePrice: { $avg: "$sanpham.price" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: "$_id.productId",
          dungluong: "$_id.dungluong",
          mausac: "$_id.mausac",
          soluong: 1,
          doanhthu: 1,
          averagePrice: 1,
          orderCount: 1,
          percentOfTotalSales: { 
            $multiply: [{ $divide: ["$soluong", totals.totalQuantity || 1] }, 100] 
          },
          percentOfTotalRevenue: { 
            $multiply: [{ $divide: ["$doanhthu", totals.totalRevenue || 1] }, 100] 
          }
        }
      },
      { $sort: { soluong: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Properly populate product data
    const populatedData = await Promise.all(result.map(async (item) => {
      try {
        const product = await SanPham.ChitietSp.findById(item._id);
        const dungluong = await DungLuong.dungluong.findById(item.dungluong);
        
        return {
          ...item,
          tensp: product ? product.name : "Không rõ",
          dungluongName: dungluong ? dungluong.name : "N/A",
          percentOfTotalSales: item.percentOfTotalSales.toFixed(2),
          percentOfTotalRevenue: item.percentOfTotalRevenue.toFixed(2)
        };
      } catch (err) {
        console.error(`Error populating product ${item._id}:`, err);
        return {
          ...item,
          tensp: "Không rõ",
          dungluongName: "N/A",
          percentOfTotalSales: item.percentOfTotalSales.toFixed(2),
          percentOfTotalRevenue: item.percentOfTotalRevenue.toFixed(2)
        };
      }
    }));

    res.json(populatedData);
  } catch (err) {
    console.error("Error in top-products:", err);
    res.status(500).json({ message: "Lỗi top sản phẩm", error: err.message });
  }
});

// Similar enhancement for least-products route
router.get('/least-products', async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get total sales for percentage calculation
    const totalSales = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
        }
      },
      { $unwind: "$sanpham" },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$sanpham.soluong" },
          totalRevenue: { 
            $sum: { $multiply: ["$sanpham.soluong", "$sanpham.price"] }
          }
        }
      }
    ]);

    const totals = totalSales[0] || { totalQuantity: 0, totalRevenue: 0 };

    // Get detailed data for least selling products
    const result = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
        }
      },
      { $unwind: "$sanpham" },
      {
        $group: {
          _id: {
            productId: "$sanpham.idsp",
            dungluong: "$sanpham.dungluong",
            mausac: "$sanpham.idmausac"
          },
          soluong: { $sum: "$sanpham.soluong" },
          doanhthu: {
            $sum: { $multiply: ["$sanpham.soluong", "$sanpham.price"] }
          },
          averagePrice: { $avg: "$sanpham.price" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: "$_id.productId",
          dungluong: "$_id.dungluong",
          mausac: "$_id.mausac",
          soluong: 1,
          doanhthu: 1,
          averagePrice: 1,
          orderCount: 1,
          percentOfTotalSales: { 
            $multiply: [{ $divide: ["$soluong", totals.totalQuantity || 1] }, 100] 
          },
          percentOfTotalRevenue: { 
            $multiply: [{ $divide: ["$doanhthu", totals.totalRevenue || 1] }, 100] 
          }
        }
      },
      { $sort: { soluong: 1 } },
      { $limit: parseInt(limit) }
    ]);

    // Properly populate product data
    const populatedData = await Promise.all(result.map(async (item) => {
      try {
        const product = await SanPham.ChitietSp.findById(item._id);
        const dungluong = await DungLuong.dungluong.findById(item.dungluong);
        
        return {
          ...item,
          tensp: product ? product.name : "Không rõ",
          dungluongName: dungluong ? dungluong.name : "N/A",
          percentOfTotalSales: item.percentOfTotalSales.toFixed(2),
          percentOfTotalRevenue: item.percentOfTotalRevenue.toFixed(2)
        };
      } catch (err) {
        console.error(`Error populating product ${item._id}:`, err);
        return {
          ...item,
          tensp: "Không rõ",
          dungluongName: "N/A",
          percentOfTotalSales: item.percentOfTotalSales.toFixed(2),
          percentOfTotalRevenue: item.percentOfTotalRevenue.toFixed(2)
        };
      }
    }));

    res.json(populatedData);
  } catch (err) {
    console.error("Error in least-products:", err);
    res.status(500).json({ message: "Lỗi sản phẩm ít bán", error: err.message });
  }
});


// Cập nhật route trung bình sản phẩm mỗi đơn
// Fixed avg-products-per-order route in HoaDonRoutes.js
router.get('/avg-products-per-order', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Thống kê cơ bản
    const basicStats = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành','Đã nhận'] }
        }
      },
      {
        $project: {
          tongSL: {
            $sum: "$sanpham.soluong"
          },
          orderTime: "$ngaymua",
          status: "$trangthai"
        }
      },
      {
        $group: {
          _id: null,
          avgSP: { $avg: "$tongSL" },
          totalDon: { $sum: 1 },
          totalItems: { $sum: "$tongSL" },
          maxItems: { $max: "$tongSL" },
          orders: { $push: { items: "$tongSL", time: "$orderTime", status: "$status" } }
        }
      }
    ]);
    
    // If no data, return default values
    if (basicStats.length === 0) {
      return res.json({ 
        avgSP: 0, 
        totalDon: 0,
        totalItems: 0,
        maxItems: 0,
        medianItems: 0,
        orderSizes: {
          single: 0,
          small: 0,
          medium: 0,
          large: 0,
          extraLarge: 0
        },
        timeOfDay: {
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: 0
        },
        busiest: {
          day: 'N/A',
          timeOfDay: 'N/A'
        },
        returnsPercent: '0.0'
      });
    }
    
    const stats = basicStats[0];
    
    // Safety check for null stats
    if (!stats) {
      return res.json({ 
        avgSP: 0, 
        totalDon: 0,
        totalItems: 0
      });
    }
    
    // Ensure orders array exists
    if (!stats.orders || !Array.isArray(stats.orders)) {
      stats.orders = [];
    }
    
    // Ensure totalDon and totalItems are numbers
    stats.totalDon = stats.totalDon || 0;
    stats.totalItems = stats.totalItems || 0;
    
    // Tìm median (trung vị) số sản phẩm mỗi đơn
    const itemsPerOrder = stats.orders.map(order => order.items).sort((a, b) => a - b);
    const medianItems = itemsPerOrder.length % 2 === 0 
      ? (itemsPerOrder[itemsPerOrder.length/2 - 1] + itemsPerOrder[itemsPerOrder.length/2]) / 2
      : itemsPerOrder[Math.floor(itemsPerOrder.length/2)];
    
    // Phân loại đơn hàng theo kích thước
    const orderSizes = {
      single: 0,    // 1 sản phẩm
      small: 0,     // 2-3 sản phẩm
      medium: 0,    // 4-5 sản phẩm
      large: 0,     // 6-10 sản phẩm
      extraLarge: 0 // >10 sản phẩm
    };
    
    itemsPerOrder.forEach(count => {
      if (count === 1) orderSizes.single++;
      else if (count <= 3) orderSizes.small++;
      else if (count <= 5) orderSizes.medium++;
      else if (count <= 10) orderSizes.large++;
      else orderSizes.extraLarge++;
    });
    
    // Phân loại theo thời gian trong ngày
    const timeOfDay = {
      morning: 0,    // 6-11
      afternoon: 0,  // 12-17
      evening: 0,    // 18-21
      night: 0       // 22-5
    };
    
    stats.orders.forEach(order => {
      if (!order.time) return;
      const hour = new Date(order.time).getHours();
      if (hour >= 6 && hour < 12) timeOfDay.morning++;
      else if (hour >= 12 && hour < 18) timeOfDay.afternoon++;
      else if (hour >= 18 && hour < 22) timeOfDay.evening++;
      else timeOfDay.night++;
    });
    
    // Xác định ngày bận rộn nhất
    const ordersByDay = {};
    stats.orders.forEach(order => {
      if (!order.time) return;
      const date = moment(order.time).format('DD/MM/YYYY');
      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });
    
    let busiestDay = { day: 'N/A', count: 0 };
    Object.entries(ordersByDay).forEach(([day, count]) => {
      if (count > busiestDay.count) {
        busiestDay = { day, count };
      }
    });
    
    // Xác định thời gian phổ biến nhất
    let busiestTime = { timeOfDay: 'N/A', count: 0 };
    Object.entries(timeOfDay).forEach(([timeOfDay, count]) => {
      if (count > busiestTime.count) {
        const timeLabels = {
          morning: 'Sáng (6h-12h)',
          afternoon: 'Chiều (12h-18h)',
          evening: 'Tối (18h-22h)',
          night: 'Đêm (22h-6h)'
        };
        busiestTime = { timeOfDay: timeLabels[timeOfDay] || 'N/A', count };
      }
    });
    
    // Tính phần trăm đơn hàng bị trả lại hoặc hủy
    const returnOrders = stats.orders.filter(order => 
      order.status === 'Hủy Đơn Hàng' || 
      order.status === 'Trả hàng/Hoàn tiền'
    ).length;
    
    const returnsPercent = ((returnOrders / (stats.totalDon || 1)) * 100).toFixed(1);
    
    const response = {
      avgSP: Number((stats.avgSP || 0).toFixed(2)),
      totalDon: stats.totalDon || 0,
      totalItems: stats.totalItems || 0,
      maxItems: stats.maxItems || 0,
      medianItems: Number((medianItems || 0).toFixed(2)),
      orderSizes,
      timeOfDay,
      busiest: {
        day: busiestDay.day,
        timeOfDay: busiestTime.timeOfDay
      },
      returnsPercent
    };
    
    res.json(response);
  } catch (err) {
    console.error("Error in avg-products-per-order:", err);
    res.status(500).json({ 
      message: "Lỗi tính trung bình sản phẩm", 
      error: err.message,
      // Provide default values
      avgSP: 0,
      totalDon: 0,
      totalItems: 0
    });
  }
});

// Cập nhật route thống kê số điện thoại khách hàng
// Fixed top-phone route in HoaDonRoutes.js
router.get('/top-phone', async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Lấy thông tin cơ bản khách hàng mua nhiều
    const basicStats = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end },
          trangthai: { $in: ['Đã thanh toán', 'Hoàn thành', 'Đã nhận'] }
        }
      },
      {
        $group: {
          _id: "$phone",
          soDon: { $sum: 1 },
          tongTien: { $sum: "$tongtien" },
          lastOrderDate: { $max: "$ngaymua" },
          orders: { $push: { date: "$ngaymua", value: "$tongtien" } }
        }
      },
      { $sort: { soDon: -1, tongTien: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // If no data, return empty array
    if (!basicStats || basicStats.length === 0) {
      return res.json([]);
    }

    // Cố gắng bổ sung thêm thông tin khách hàng nếu có thể
    const enhancedData = await Promise.all(basicStats.map(async (customer) => {
      try {
        if (!customer || !customer._id) {
          return {
            _id: 'Không rõ',
            soDon: 0,
            tongTien: 0,
            lastOrder: 'N/A',
            avgOrdersPerMonth: 0,
            orderHistory: []
          };
        }
        
        // Tìm thông tin khách hàng từ model User nếu có
        let userInfo = null;
        try {
          userInfo = await User.User.findOne({ phone: customer._id });
        } catch (userErr) {
          console.error(`Error finding user with phone ${customer._id}:`, userErr);
        }
        
        // Format lại mảng lịch sử đơn hàng để hiển thị biểu đồ
        const orderHistory = Array.isArray(customer.orders) 
          ? customer.orders
              .filter(order => order && order.date instanceof Date) // Filter out invalid entries
              .map(order => ({
                date: moment(order.date).format('DD/MM/YYYY'),
                value: order.value || 0
              }))
              .sort((a, b) => new Date(a.date) - new Date(b.date))
          : [];
        
        const lastOrder = customer.lastOrderDate instanceof Date 
          ? moment(customer.lastOrderDate).format('DD/MM/YYYY') 
          : 'N/A';
        
        return {
          ...customer,
          customerName: userInfo ? userInfo.username : null,
          lastOrder,
          // Tính trung bình đơn hàng mỗi tháng
          avgOrdersPerMonth: calculateAvgOrdersPerMonth(customer.orders),
          orderHistory
        };
      } catch (err) {
        console.error(`Error enhancing customer data for ${customer ? customer._id : 'unknown'}:`, err);
        // Return basic data if enhancement fails
        return {
          ...customer,
          lastOrder: customer.lastOrderDate instanceof Date 
            ? moment(customer.lastOrderDate).format('DD/MM/YYYY') 
            : 'N/A',
          avgOrdersPerMonth: 0,
          orderHistory: []
        };
      }
    }));

    res.json(enhancedData);
  } catch (err) {
    console.error("Error in top-phone:", err);
    res.status(500).json({ message: "Lỗi thống kê SDT", error: err.message });
  }
});

// Hàm hỗ trợ tính trung bình đơn hàng mỗi tháng
function calculateAvgOrdersPerMonth(orders) {
  if (!orders || !Array.isArray(orders) || orders.length === 0) return 0;
  
  // Lọc đơn hàng có ngày hợp lệ
  const validOrders = orders.filter(order => order && order.date instanceof Date);
  if (validOrders.length === 0) return 0;
  
  // Lấy tháng đầu tiên và tháng cuối cùng
  try {
    const dates = validOrders.map(order => new Date(order.date));
    if (dates.length === 0) return 0;
    
    const firstDate = new Date(Math.min(...dates));
    const lastDate = new Date(Math.max(...dates));
    
    // Kiểm tra ngày hợp lệ
    if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) return 0;
    
    // Tính số tháng giữa hai ngày
    const monthsDiff = 
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
      (lastDate.getMonth() - firstDate.getMonth()) + 1;
    
    // Tránh trường hợp chia cho 0
    if (monthsDiff <= 0) return validOrders.length;
    
    // Nếu chỉ trong một tháng, trả về số lượng đơn hàng
    if (monthsDiff <= 1) return validOrders.length;
    
    // Nếu nhiều tháng, tính trung bình
    return (validOrders.length / monthsDiff).toFixed(1);
  } catch (error) {
    console.error("Error calculating average orders per month:", error);
    return 0;
  }
}

// Hàm hỗ trợ tính trung bình đơn hàng mỗi tháng




router.post('/timkiemhoadon', async (req, res) => {
  try {
    const { phone } = req.body
    const hoadon = await HoaDon.hoadon.find({ phone })
    if (!hoadon || hoadon.length === 0) {
      return res.json({
        message: 'Không có đơn hàng tương ứng với số điện thoại'
      })
    }
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi khi tìm kiếm hóa đơn' })
  }
})
router.post('/gethoadonuser', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Thiếu userId' });
    }

    const hoadons = await HoaDon.hoadon.find({ userId }).sort({ ngaymua: -1 });

    if (!hoadons || hoadons.length === 0) {
      return res.status(200).json({
        message: 'Người dùng chưa có đơn hàng nào',
        hoadons: []
      });
    }

    res.json({ hoadons });
  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng theo user:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy hóa đơn người dùng' });
  }
});

router.get('/order-success-rate', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const stats = await HoaDon.hoadon.aggregate([
      {
        $match: {
          ngaymua: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$trangthai",
          count: { $sum: 1 },
          totalAmount: { $sum: "$tongtien" }
        }
      }
    ]);

    // Tính tổng số đơn hàng và tổng doanh thu
    const totalOrders = stats.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = stats.reduce((sum, item) => sum + item.totalAmount, 0);

    // Phân loại trạng thái đơn hàng
    const statusStats = {
      success: { count: 0, amount: 0, rate: 0 },
      pending: { count: 0, amount: 0, rate: 0 },
      failed: { count: 0, amount: 0, rate: 0 },
      cancelled: { count: 0, amount: 0, rate: 0 }
    };

    stats.forEach(item => {
      const status = item._id;
      const count = item.count;
      const amount = item.totalAmount;

      if (status === 'Đã thanh toán' || status === 'Hoàn thành' || status === 'Đã nhận') {
        statusStats.success.count += count;
        statusStats.success.amount += amount;
      } else if (status === 'Đang xử lý') {
        statusStats.pending.count += count;
        statusStats.pending.amount += amount;
      } else if (status === 'Thanh toán thất bại' || status === 'Thanh toán hết hạn') {
        statusStats.failed.count += count;
        statusStats.failed.amount += amount;
      } else if (status === 'Hủy Đơn Hàng') {
        statusStats.cancelled.count += count;
        statusStats.cancelled.amount += amount;
      }
    });

    // Tính tỷ lệ phần trăm
    Object.keys(statusStats).forEach(key => {
      statusStats[key].rate = ((statusStats[key].count / totalOrders) * 100).toFixed(2);
    });

    res.json({
      totalOrders,
      totalRevenue,
      statusStats,
      dailyStats: await getDailyOrderStats(start, end)
    });
  } catch (err) {
    console.error("Error in order-success-rate:", err);
    res.status(500).json({ message: "Lỗi thống kê tỷ lệ đơn hàng", error: err.message });
  }
});

// Helper function to get daily order statistics
async function getDailyOrderStats(start, end) {
  const dailyStats = await HoaDon.hoadon.aggregate([
    {
      $match: {
        ngaymua: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$ngaymua" } },
          status: "$trangthai"
        },
        count: { $sum: 1 },
        amount: { $sum: "$tongtien" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        totalOrders: { $sum: "$count" },
        totalAmount: { $sum: "$amount" },
        statusBreakdown: {
          $push: {
            status: "$_id.status",
            count: "$count",
            amount: "$amount"
          }
        }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  return dailyStats;
}

module.exports = router