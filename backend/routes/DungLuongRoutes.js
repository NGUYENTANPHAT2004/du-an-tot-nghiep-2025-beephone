const express = require('express')
const router = express.Router()
const DungLuong = require('../models/DungLuongModel')
const LoaiSP = require('../models/LoaiSanPham')
const MauSac = require('../models/MauSacModel')

router.post('/postdungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp
    const { name } = req.body
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp)
    const dungluong = new DungLuong.dungluong({ name, idloaisp })
    loaisp.dungluongmay.push(dungluong._id)
    await dungluong.save()
    await loaisp.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/editdungluong/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong

    const { name } = req.body
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    dungluong.name = name
    await dungluong.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/geteditdl/:id', async (req, res) => {
  try {
    const id = req.params.id
    const dungluong = await DungLuong.dungluong.findById(id)
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
router.get('/dungluongmay/:namekhongdau', async (req, res) => {
  try {
    const namekhongdau = req.params.namekhongdau;
    const loaisp = await LoaiSP.LoaiSP.findOne({ namekhongdau });

    const dungluong = await Promise.all(
      loaisp.dungluongmay.map(async (dl) => {
        const dluong = await DungLuong.dungluong.findOne({ _id: dl._id, isDeleted: false });
        if (!dluong) return null;

        const mausac = await Promise.all(
          dluong.mausac.map(async (ms) => {
            const mausac1 = await MauSac.mausac.findOne({ _id: ms._id, isDeleted: false });
            if (!mausac1) return null;

            return {
              _id: mausac1._id,
              name: mausac1.name,
              price:
                loaisp.khuyenmai === 0
                  ? mausac1.price
                  : mausac1.price - (mausac1.price * loaisp.khuyenmai) / 100,
              giagoc: mausac1.price,
              khuyenmai: loaisp.khuyenmai,
              images: mausac1.image
            };
          })
        );

        return {
          _id: dluong._id,
          name: dluong.name,
          mausac: mausac.filter(Boolean)
        };
      })
    );

    res.json(dungluong.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});

router.get('/getmausacgh/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong;
    const dungluong = await DungLuong.dungluong.findById(iddungluong);
    const mausac = await Promise.all(
      dungluong.mausac.map(async (ms) => {
        const maus = await MauSac.mausac.findOne({ _id: ms._id, isDeleted: false });
        if (!maus) return null;

        return {
          _id: maus._id,
          name: maus.name,
          price: maus.price || 0
        };
      })
    );

    res.json(mausac.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});


router.post('/deletedungluong/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong;
    const dungluong = await DungLuong.dungluong.findById(iddungluong);
    const loaisp = await LoaiSP.TenSP.findById(dungluong.idloaisp);

    if (loaisp) {
      loaisp.dungluongmay = loaisp.dungluongmay.filter(
        dl => dl.toString() !== dungluong._id.toString()
      );
      await loaisp.save();
    }

    // Xoá mềm dung lượng
    dungluong.isDeleted = true;
    await dungluong.save();

    // Xoá mềm màu sắc liên quan
    await Promise.all(
      dungluong.mausac.map(async mausacId => {
        const mausac = await MauSac.mausac.findById(mausacId._id);
        if (mausac) {
          mausac.isDeleted = true;
          await mausac.save();
        }
      })
    );

    res.json({ message: 'Đã xoá mềm dung lượng và màu sắc' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});

// BƯỚC 3: Xoá mềm hàng loạt

router.post('/deletedungluonghangloat', async (req, res) => {
  try {
    const { iddungluongList } = req.body;

    if (!Array.isArray(iddungluongList) || iddungluongList.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });
    }

    const dungluongList = await DungLuong.dungluong.find({
      _id: { $in: iddungluongList }
    });

    if (!dungluongList.length) {
      return res.status(404).json({ message: 'Không tìm thấy dung lượng để xoá' });
    }

    await Promise.all(
      dungluongList.map(async dungluong => {
        const loaisp = await LoaiSP.LoaiSP.findById(dungluong.idloaisp);

        if (loaisp) {
          loaisp.dungluongmay = loaisp.dungluongmay.filter(
            dl => dl.toString() !== dungluong._id.toString()
          );
          await loaisp.save();
        }

        dungluong.isDeleted = true;
        await dungluong.save();

        await Promise.all(
          dungluong.mausac.map(async mausac => {
            const ms = await MauSac.mausac.findById(mausac._id);
            if (ms) {
              ms.isDeleted = true;
              await ms.save();
            }
          })
        );
      })
    );

    res.json({ message: 'Đã xoá mềm danh sách dung lượng', deletedIds: iddungluongList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});

// BƯỚC 4: Khi lấy dữ liệu, lọc theo isDeleted = false nếu cần

// Ví dụ trong /dungluong/:idloaisp
router.get('/dungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp;
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp);
    const dungluong = await Promise.all(
      loaisp.dungluongmay.map(async dl => {
        const dluong = await DungLuong.dungluong.findOne({ _id: dl._id, isDeleted: false });
        if (!dluong) return null;
        return {
          _id: dluong._id,
          name: dluong.name
        };
      })
    );
    res.json(dungluong.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});


module.exports = router