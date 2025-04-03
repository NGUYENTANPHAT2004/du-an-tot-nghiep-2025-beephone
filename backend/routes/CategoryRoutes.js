const router = require("express").Router();
const Category = require("../models/CategoryModel");
const mongoose = require("mongoose");
const unicode = require("unidecode");

function removeSpecialChars(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// 🟢 API: Create new category (supports multi-level categories)
router.post("/createcate", async (req, res) => {
  try {
    let { name, parent } = req.body;

    // Input validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const namekhongdau = removeSpecialChars(name);

    // Check if parent is "null" string → convert to null
    if (parent === "null" || parent === "" || parent === undefined) {
      parent = null;
    } else if (!mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ message: "Invalid parent category ID" });
    }

    // Create new category
    const category = new Category({ name, namekhongdau, parent });

    await category.save();

    // If parent exists, update parent to add to children[]
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res
          .status(400)
          .json({ message: "Parent category does not exist" });
      }
      parentCategory.children.push(category._id);
      await parentCategory.save();
    }

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `An error occurred: ${error.message}` });
  }
});

// Optimized recursive population function for better performance
const populateRecursive = async (categories) => {
  // Create array of promises for all categories at this level
  const populatePromises = categories.map(async (category) => {
    const populateTasks = [];

    // Add theloai population if needed
    // Lọc chỉ lấy theloai chưa bị xoá mềm
    if (category.theloai && category.theloai.length > 0) {
      populateTasks.push(
        category.populate({
          path: "theloai",
          match: { isDeleted: false },
        })
      );
    }

    // Lọc children không cần match vì category không có xoá mềm (nếu có thì thêm tương tự)
    if (category.children && category.children.length > 0) {
      populateTasks.push(
        category.populate({
          path: "children",
          // Nếu bạn sau này cho category cũng xóa mềm thì thêm match ở đây
          // match: { isDeleted: false }
        })
      );
    }
    // Execute all populate tasks in parallel
    if (populateTasks.length > 0) {
      await Promise.all(populateTasks);
    }

    // Recursively populate children if they exist
    if (category.children && category.children.length > 0) {
      await populateRecursive(category.children);
    }
  });

  // Wait for all category populations to complete in parallel
  await Promise.all(populatePromises);
};
router.get("/categoryitem/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    let category = await Category.findOne({ namekhongdau: slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await populateRecursive([category]);
    res.status(200).json(category);
  } catch (error) {
    console.error("List category error:", error);
    res.status(500).json({ message: error.message });
  }
});

// List categories route (returns tree structure)
router.get("/listcate", async (req, res) => {
  try {
    // Get root categories (parent: null)
    let categories = await Category.find({ parent: null });

    // Use recursive function to populate data
    await populateRecursive(categories);

    res.status(200).json(categories);
  } catch (error) {
    console.error("List category error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/categoryitem/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let categories = await Category.findById(id);

    // Use recursive function to populate data
    await populateRecursive([categories]);

    const cleanedCategory = cleanCategory(categories);
    res.status(200).json(cleanedCategory);
  } catch (error) {
    console.error("List category error:", error);
    res.status(500).json({ message: error.message });
  }
});
// Delete category route (with recursive deletion of children)
router.delete("/deletecate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If category has parent, remove this ID from parent's children array
    if (category.parent) {
      const parentCategory = await Category.findById(category.parent);
      if (parentCategory) {
        parentCategory.children = parentCategory.children.filter(
          (childId) => childId.toString() !== id
        );
        await parentCategory.save();
      }
    }

    // Recursive function to delete category and all its children
    const deleteCategoryAndChildren = async (catId) => {
      const cat = await Category.findById(catId);
      if (cat && cat.children && cat.children.length > 0) {
        // Create deletion promises for all children
        const deletePromises = cat.children.map((childId) =>
          deleteCategoryAndChildren(childId)
        );
        await Promise.all(deletePromises);
      }
      await Category.findByIdAndDelete(catId);
    };

    await deleteCategoryAndChildren(id);

    res.json({
      message: "Category and all subcategories deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `An error occurred: ${error.message}` });
  }
});

// Add a new route to handle bulk deletion
router.delete("/deletemultiple", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid category IDs" });
    }

    // Validate all IDs
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ message: "One or more invalid category IDs" });
    }

    // Recursive function to delete category and all its children
    const deleteCategoryAndChildren = async (catId) => {
      const cat = await Category.findById(catId);
      if (cat && cat.children && cat.children.length > 0) {
        const deletePromises = cat.children.map((childId) =>
          deleteCategoryAndChildren(childId)
        );
        await Promise.all(deletePromises);
      }
      await Category.findByIdAndDelete(catId);
    };

    // Process each ID in parallel
    const deleteResults = await Promise.all(
      ids.map(async (id) => {
        try {
          const category = await Category.findById(id);
          if (!category) {
            return { id, success: false, message: "Category not found" };
          }

          // If category has parent, remove this ID from parent's children array
          if (category.parent) {
            const parentCategory = await Category.findById(category.parent);
            if (parentCategory) {
              parentCategory.children = parentCategory.children.filter(
                (childId) => childId.toString() !== id
              );
              await parentCategory.save();
            }
          }

          await deleteCategoryAndChildren(id);
          return { id, success: true, message: "Deleted successfully" };
        } catch (error) {
          console.error(`Error deleting category ${id}:`, error);
          return { id, success: false, message: error.message };
        }
      })
    );

    // Count successful deletions
    const successCount = deleteResults.filter(
      (result) => result.success
    ).length;

    res.json({
      message: `Successfully deleted ${successCount} out of ${ids.length} categories`,
      results: deleteResults,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: `An error occurred: ${error.message}` });
  }
});

module.exports = router;
