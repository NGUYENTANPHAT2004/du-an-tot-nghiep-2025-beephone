const express = require("express");
const router = express.Router();
const Blog = require("../models/blog.model");
const uploads = require("./upload");
const unicode = require("unidecode");


const DOMAIN = "http://localhost:3005";

const  extractImageUrl = (req) => 
    req.files?.image ? `${DOMAIN}/${req.files.image[0].filename}` : null;

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);


function removeSpecialChars(str) {
  const specialChars = /[:+,!@#$%^&*()\-/?.\s]/g;
  return str
    .replace(specialChars, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// POST new blog
router.post(
  "/postblog",
  uploads.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { tieude_blog, noidung } = req.body;

      if (!tieude_blog) {
        return res
          .status(400)
          .json({ message: "Tiêu đề blog không được để trống" });
      }

      
      const image = extractImageUrl(req);

      
      const tieude_khongdau = removeSpecialChars(tieude_khongdau1);

      const blog = new Blog.blogModel({
        tieude_blog,
        tieude_khongdau,
        img_blog: image,
        noidung,
      });

      await blog.save();
      res.status(201).json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
    }
  }
);

// UPDATE blog
router.post(
  "/putblog/:idblog",
  uploads.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const idblog = req.params.idblog;
      const { tieude_blog, noidung } = req.body;

      if (!tieude_blog) {
        return res
          .status(400)
          .json({ message: "Tiêu đề blog không được để trống" });
      }

      const blog = await Blog.blogModel.findById(idblog);

      if (!blog) {
        return res.status(404).json({ message: "Không tìm thấy blog" });
      }

      
      

      blog.tieude_blog = tieude_blog;
      blog.tieude_khongdau = tieude_khongdau;
      blog.noidung = noidung;

      // Update image if provided
      if (req.files?.image) {
        blog.img_blog = extractImageUrl(req);
      }

      await blog.save();
      res.json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
    }
  }
);

// DELETE blog
router.post("/deleteblog/:idblog", async (req, res) => {
  try {
    const idblog = req.params.idblog;
    const result = await Blog.blogModel.findByIdAndDelete(idblog);

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy blog" });
    }

    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

// DELETE multiple blogs
router.post("/deletemanyblogs", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    const result = await Blog.blogModel.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy blog nào để xóa" });
    }

    res.json({
      message: `Đã xóa ${result.deletedCount} blog thành công`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

// GET all blogs
router.get("/getblog", async (req, res) => {
  try {
    const blog = await Blog.blogModel.find().lean();

    const blogjson = blog.map((bl) => {
      const ngayTao = new Date(
        parseInt(bl._id.toString().substring(0, 8), 16) * 1000
      );

      return {
        _id: bl._id,
        tieude_blog: bl.tieude_blog,
        tieude_khongdau: bl.tieude_khongdau,
        img_blog: bl.img_blog,
        noidung: bl.noidung,
        ngay_tao: ngayTao.toLocaleDateString("vi-VN"), // Format dd/mm/yyyy
      };
    });

    res.json(blogjson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

// GET blog by slug
router.get("/chitietblog/:tieude", async (req, res) => {
  try {
    const tieude = req.params.tieude;
    const blog = await Blog.blogModel.findOne({ tieude_khongdau: tieude });

    if (!blog) {
      return res.status(404).json({ message: "Không tìm thấy blog" });
    }

    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

// GET blog by ID
router.get("/chitietblog1/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await Blog.blogModel.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Không tìm thấy blog" });
    }

    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error.message}` });
  }
});

// Upload single image
router.post("/upload", uploads.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Fix typo in URL (http;// -> http://)
  const fileUrl = `http://localhost:3005/${req.file.filename}`;
  res.json({ url: fileUrl });
});

module.exports = router;
