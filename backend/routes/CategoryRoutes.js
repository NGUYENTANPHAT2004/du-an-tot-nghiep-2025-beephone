const router = require('express').Router()
const Category = require('../models/CategoryModel');
const mongoose = require('mongoose');
const unicode = require('unidecode')
function removeSpecialChars(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// 🟢 API: Tạo danh mục mới (hỗ trợ danh mục đa cấp)
router.post('/createcate', async (req, res) => {
  try {
    let { name, parent } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Ten danh muc ko hop le" });
    }

    const namekhongdau = removeSpecialChars(name);

    // Kiểm tra nếu `parent` là `"null"` string → chuyển thành `null`
    if (parent === "null" || parent === "" || parent === undefined) {
      parent = null;
    } else if (!mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ message: "ID danh mục cha không hợp lệ" });
    }

    // Tạo danh mục mới
    const category = new Category({ name, namekhongdau, parent });

    await category.save();

    // Nếu có danh mục cha, cập nhật danh mục cha để thêm vào children[]
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: "Danh mục cha không tồn tại" });
      }
      parentCategory.children.push(category._id);
      await parentCategory.save();
    }

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

const populateRecursive = async (categories) => {
  for (let category of categories) {
    // Populate thể loại (theloai)
    if (category.theloai && category.theloai.length > 0) {
      await category.populate('theloai'); // Không cần .execPopulate()
    }

    // Populate children và gọi đệ quy
    if (category.children && category.children.length > 0) {
      await category.populate('children'); // Không cần .execPopulate()
      await populateRecursive(category.children); // Gọi đệ quy
    }
  }
};
router.get('/categoryitem/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let category = await Category.findOne({ namekhongdau: slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await populateRecursive([category]);
    res.status(200).json(category);
  } catch (error) {
    console.error('List category error:', error);
    res.status(500).json({ message: error.message });
  }
});
router.get('/listcate', async (req, res) => {
  try {
    // Lấy danh sách các danh mục cha (parent: null)
    let categories = await Category.find({ parent: null });

    // Sử dụng hàm đệ quy để populate dữ liệu
    await populateRecursive(categories);

    // Trả về kết quả
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/categoryitem/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let categories = await Category.findById(id);

    // Use recursive function to populate data
    await populateRecursive([categories]);

    const cleanedCategory = cleanCategory(categories);
    res.status(200).json(cleanedCategory);
  } catch (error) {
    console.error('List category error:', error);
    res.status(500).json({ message: error.message });
  }
});
router.delete('/deletecate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID danh mục không hợp lệ" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Nếu danh mục có cha, loại bỏ ID này khỏi mảng children của danh mục cha
    if (category.parent) {
      const parentCategory = await Category.findById(category.parent);
      if (parentCategory) {
        parentCategory.children = parentCategory.children.filter(childId => childId.toString() !== id);
        await parentCategory.save();
      }
    }

    const deleteCategoryAndChildren = async (catId) => {
      const cat = await Category.findById(catId);
      if (cat && cat.children && cat.children.length > 0) {
        const deletePromises = cat.children.map(childId => deleteCategoryAndChildren(childId));
        await Promise.all(deletePromises);
      }
      await Category.findByIdAndDelete(catId);
    };

    await deleteCategoryAndChildren(id);

    res.json({ message: "Danh mục và các danh mục con đã được xóa" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});
router.delete('/deletemultiple', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "id ko hop le" });
    }

    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: "Một hoặc nhiều ID danh mục không hợp lệ" });
    }

    const deleteCategoryAndChildren = async (catId) => {
      const cat = await Category.findById(catId);
      if (cat && cat.children && cat.children.length > 0) {
        const deletePromises = cat.children.map(childId => deleteCategoryAndChildren(childId));
        await Promise.all(deletePromises);
      }
      await Category.findByIdAndDelete(catId);
    };

    const deleteResults = await Promise.all(
      ids.map(async (id) => {
        try {
          const category = await Category.findById(id);
          if (!category) {
            return { id, success: false, message: "category ko ton tai" };
          }

          if (category.parent) {
            const parentCategory = await Category.findById(category.parent);
            if (parentCategory) {
              parentCategory.children = parentCategory.children.filter(childId => childId.toString() !== id);
              await parentCategory.save();
            }
          }

          await deleteCategoryAndChildren(id);
          return { id, success: true, message: "xoa thanh cong" };
        } catch (error) {
          console.error(`loi xoa ${id}:`, error);
          return { id, success: false, message: error.message };
        }
      })
    );
    const successCount = deleteResults.filter(result => result.success).length;
    
    res.json({
      message: `Successfully deleted ${successCount} out of ${ids.length} categories`,
      results: deleteResults
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: `An error occurred: ${error.message}` });
  }
});

module.exports = router;
