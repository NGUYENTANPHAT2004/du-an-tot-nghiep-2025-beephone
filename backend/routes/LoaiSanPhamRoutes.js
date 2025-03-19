const router = require('express').Router()
const LoaiSP = require('../models/LoaiSanPham')
const Sp = require('../models/chitietSpModel')
const unicode = require('unidecode')
const Category = require('../models/CategoryModel')

function removeSpecialChars (str) {
  const specialChars = /[:+,!@#$%^&*()\-/?.\s]/g // Bao gồm cả dấu cách (\s)
  return str
    .replace(specialChars, '-') // Thay tất cả ký tự đặc biệt và dấu cách bằng dấu -
    .replace(/-+/g, '-') // Loại bỏ dấu - thừa (nhiều dấu liền nhau chỉ còn 1)
    .replace(/^-|-$/g, '') // Loại bỏ dấu - ở đầu hoặc cuối chuỗi
}

router.post('/postloaisp', async (req, res) => {
  try {
    const {
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      category
    } = req.body
    const namekhongdau1 = unicode(name)
    const namekhongdau = removeSpecialChars(namekhongdau1)
    const cate = await Category.findById(category);
    if (!cate || cate.children.length > 0) {
      return res.status(400).json({ message: 'Danh mục này không thể chứa thể loại' });
    }
    const tensp = new LoaiSP.LoaiSP({
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      namekhongdau,
      category: category
    })
    cate.theloai.push(tensp._id);
    await cate.save();
    await tensp.save()
    res.json(tensp)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/putloaisp/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      category // ID category mới
    } = req.body;

    // 1. Tìm LoạiSP cũ
    const loaiSpOld = await LoaiSP.LoaiSP.findById(id);
    if (!loaiSpOld) {
      return res.status(404).json({ message: 'Không tìm thấy thể loại' });
    }

    // 2. (Tùy chọn) Kiểm tra danh mục mới
    const cateNew = await Category.findById(category);
    if (!cateNew) {
      return res.status(400).json({ message: 'Danh mục mới không tồn tại' });
    }
    if (cateNew.children.length > 0) {
      return res.status(400).json({ message: 'Danh mục này không thể chứa thể loại' });
    }

    // 3. Nếu category cũ khác category mới, cần:
    //    a) Bỏ _id của loaiSpOld ra khỏi theloai[] của Category cũ
    //    b) Thêm _id của loaiSpOld vào theloai[] của Category mới
    const oldCategoryId = loaiSpOld.category.toString();
    const newCategoryId = category.toString();

    if (oldCategoryId !== newCategoryId) {
      // 3a. Tìm Category cũ
      const cateOld = await Category.findById(oldCategoryId);
      if (cateOld) {
        cateOld.theloai = cateOld.theloai.filter(
          (itemId) => itemId.toString() !== id
        );
        await cateOld.save();
      }

      // 3b. Thêm _id LoaiSP vào Category mới
      cateNew.theloai.push(loaiSpOld._id);
      await cateNew.save();
    }

    // 4. Cập nhật LoạiSP
    const namekhongdau1 = unicode(name);
    const namekhongdau = removeSpecialChars(namekhongdau1);

    loaiSpOld.name = name;
    loaiSpOld.manhinh = manhinh;
    loaiSpOld.chip = chip;
    loaiSpOld.ram = ram;
    loaiSpOld.dungluong = dungluong;
    loaiSpOld.camera = camera;
    loaiSpOld.pinsac = pinsac;
    loaiSpOld.hang = hang;
    loaiSpOld.congsac = congsac;
    loaiSpOld.thongtin = thongtin;
    loaiSpOld.namekhongdau = namekhongdau;
    loaiSpOld.category = category;

    await loaiSpOld.save();

    res.json({ message: 'Sửa thành công', loaiSp: loaiSpOld });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});
router.get('/theloaisanpham', async (req, res) => {
  try {
    const theloai = await LoaiSP.LoaiSP.find().lean()
    const theloaijson = await Promise.all(
      theloai.map(async tl => {
        return {
          _id: tl._id,
          name: tl.name,
          namekhongdau: tl.namekhongdau
        }
      })
    )
    res.json(theloaijson)
  } catch (error) {
    console.log(error)
  }
})
router.get('/theloaiadmin', async (req, res) => {
  try {
    const theloai = await LoaiSP.LoaiSP.find().lean()
    const theloaijson = await Promise.all(
      theloai.map(async tl => {
        return {
          _id: tl._id,
          name: tl.name,
          chip: tl.chip,
          ram: tl.ram,
          dungluong: tl.dungluong,
          camera: tl.camera,
          pinsac: tl.pinsac,
          hang: tl.hang,
          congsac: tl.congsac,
          khuyenmai: tl.khuyenmai
        }
      })
    )
    res.json(theloaijson)
  } catch (error) {
    console.log(error)
  }
})
router.post('/putloaisp/:id', async (req, res) => {
  try {
    const id = req.params.id
    const {
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin
    } = req.body
    const namekhongdau1 = unicode(name)
    const namekhongdau = removeSpecialChars(namekhongdau1)

    await LoaiSP.LoaiSP.findByIdAndUpdate(id, {
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      namekhongdau
    })
    res.json({ message: 'sửa thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
router.post('/deleteloaisp/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const loaiSp = await LoaiSP.LoaiSP.findById(id);
    if (!loaiSp) {
      return res.status(404).json({ message: 'Không tìm thấy thể loại' });
    }

    // Xóa chi tiết sản phẩm (nếu cần)
    await Sp.ChitietSp.deleteMany({ _id: { $in: loaiSp.chitietsp } });

    // Xóa reference trong Category
    let resultUpdate = null;
    if (loaiSp.category) {
      resultUpdate = await Category.updateOne(
        { _id: loaiSp.category },
        { $pull: { theloai: loaiSp._id } }
      );
    }

    // Kiểm tra nếu Category vẫn còn tham chiếu
    // (vd: do ObjectId/string không khớp)
    if (resultUpdate && resultUpdate.modifiedCount === 0) {
      console.error(
        `Cảnh báo: LoạiSP ${loaiSp._id} vẫn còn trong mảng 'theloai' của Category ${loaiSp.category}`
      );
      // Tuỳ bạn xử lý, có thể throw Error hoặc chỉ log cảnh báo
      // throw new Error('Không thể xóa tham chiếu LoạiSP khỏi Category');
    }

    // Xoá chính LoaiSP
    await LoaiSP.LoaiSP.deleteOne({ _id: id });

    res.json({ message: 'Xoá LoạiSP thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});



router.post('/deletehangloatloaisp', async (req, res) => {
  try {
    const { ids } = req.body 

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' })
    }

    const loaiSPs = await LoaiSP.LoaiSP.find({ _id: { $in: ids } })

    if (loaiSPs.length === 0) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thể loại nào để xóa' })
    }

    await Promise.all(
      loaiSPs.map(async loaiSP => {
        // Xóa các chi tiết sản phẩm liên quan
        await Sp.ChitietSp.deleteMany({ _id: { $in: loaiSP.chitietsp } })

        // Cập nhật Category: loại bỏ _id của loaiSP khỏi mảng theloai
        if (loaiSP.category) {
          await Category.updateOne(
            { _id: loaiSP.category },
            { $pull: { theloai: loaiSP._id } }
          )
        }
      })
    )

    // Xóa hàng loạt các LoaiSP
    await LoaiSP.LoaiSP.deleteMany({ _id: { $in: ids } })

    res.json({ message: `Đã xóa ${ids.length} thể loại thành công` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
router.get('/getchitiettl/:idtheloai', async (req, res) => {
  try {
    const idtheloai = req.params.idtheloai
    const theloai = await LoaiSP.LoaiSP.findById(idtheloai)
    res.json(theloai)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
module.exports = router
