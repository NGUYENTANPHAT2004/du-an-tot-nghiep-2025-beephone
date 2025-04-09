import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaRobot,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaSearch,
  FaFilter,
  FaFileImport,
  FaDownload,
} from "react-icons/fa";
import "./chatlayout.scss";

const AdminChatTraining = () => {
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [importData, setImportData] = useState(null);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchTrainingData();
  }, [page, searchTerm, categoryFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3005/api/admin/chat/categories"
      );

      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải danh mục. Vui lòng thử lại sau.");
    }
  };

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      // Xây dựng query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter) params.append("category", categoryFilter);
      params.append("sort", sortBy);
      params.append("order", sortOrder);
      params.append("page", page);
      params.append("limit", itemsPerPage);

      console.log("Gọi API với tham số:", params.toString());
      const response = await axios.get(
        `http://localhost:3005/api/admin/chat/training?${params.toString()}`
      );
      console.log("Kết quả API:", response.data);

      if (response.data.success) {
        setTrainingData(response.data.data);
        setTotalItems(response.data.count);
      } else {
        toast.error("Không thể tải dữ liệu huấn luyện.");
      }
    } catch (error) {
      console.error("Error fetching training data:", error);
      toast.error("Lỗi tải dữ liệu huấn luyện. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainingData = async (e) => {
    e.preventDefault();

    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Vui lòng nhập cả câu hỏi và câu trả lời");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3005/api/admin/chat/training",
        {
          question: newQuestion,
          answer: newAnswer,
          category: newCategory,
        }
      );

      if (response.data.success) {
        toast.success("Thêm dữ liệu huấn luyện thành công!");
        setNewQuestion("");
        setNewAnswer("");
        setNewCategory("general");
        fetchTrainingData();
      } else {
        toast.error("Không thể thêm dữ liệu huấn luyện");
      }
    } catch (error) {
      console.error("Error adding training data:", error);
      toast.error("Lỗi khi thêm dữ liệu huấn luyện");
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:3005/api/admin/chat/training/${id}`
      );

      if (response.data.success) {
        toast.success("Đã xóa dữ liệu huấn luyện");
        fetchTrainingData();
      } else {
        toast.error("Không thể xóa dữ liệu huấn luyện");
      }
    } catch (error) {
      console.error("Error deleting training data:", error);
      toast.error("Lỗi khi xóa dữ liệu huấn luyện");
    }
  };

  const startEditing = (item) => {
    setEditItem({
      id: item._id,
      question: item.question,
      answer: item.answer,
      category: item.category || "general",
    });
    setEditingIndex(trainingData.findIndex((data) => data._id === item._id));
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditItem(null);
  };

  const saveEdit = async () => {
    if (!editItem || !editItem.id) return;

    try {
      const response = await axios.put(
        `http://localhost:3005/api/admin/chat/training/${editItem.id}`,
        {
          question: editItem.question,
          answer: editItem.answer,
          category: editItem.category,
        }
      );

      if (response.data.success) {
        toast.success("Đã cập nhật dữ liệu huấn luyện");
        setEditingIndex(-1);
        setEditItem(null);
        fetchTrainingData();
      } else {
        toast.error("Không thể cập nhật dữ liệu huấn luyện");
      }
    } catch (error) {
      console.error("Error updating training data:", error);
      toast.error("Lỗi khi cập nhật dữ liệu huấn luyện");
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      const response = await axios.patch(
        `http://localhost:3005/api/admin/chat/training/${id}/toggle`,
        {
          isActive: !isActive,
        }
      );

      if (response.data.success) {
        toast.success(
          `Đã ${!isActive ? "kích hoạt" : "vô hiệu hóa"} dữ liệu huấn luyện`
        );
        fetchTrainingData();
      } else {
        toast.error("Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let data;

        if (file.name.endsWith(".json")) {
          data = JSON.parse(content);
        } else if (file.name.endsWith(".csv")) {
          // Parse CSV
          const lines = content.split("\n");
          data = [];

          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const [question, answer, category] = line
                .split(",")
                .map((item) => item.trim());
              if (question && answer) {
                data.push({
                  question,
                  answer,
                  category: category || "general",
                });
              }
            }
          }
        } else {
          throw new Error("Định dạng file không hỗ trợ");
        }

        setImportData(data);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Lỗi khi đọc file: " + error.message);
      }
    };

    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      toast.error("Chỉ hỗ trợ file .json hoặc .csv");
    }
  };

  const handleImport = async () => {
    if (!importData || importData.length === 0) {
      toast.error("Không có dữ liệu để import");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3005/api/admin/chat/training/import",
        {
          items: importData,
        }
      );

      if (response.data.success) {
        toast.success(
          `Đã import ${response.data.result.success}/${response.data.result.total} dữ liệu huấn luyện`
        );
        setImportData(null);
        setImportFile(null);
        document.getElementById("fileInput").value = "";
        fetchTrainingData();
      } else {
        toast.error("Không thể import dữ liệu");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Lỗi khi import dữ liệu");
    }
  };

  const exportData = () => {
    // Tạo dữ liệu JSON
    const dataStr = JSON.stringify(trainingData, null, 2);

    // Tạo blob và URL
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Tạo link tải xuống
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat_training_data.json";
    document.body.appendChild(a);
    a.click();

    // Dọn dẹp
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Nếu đang sort theo field này, đổi thứ tự sort
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu sort theo field mới, mặc định sort theo thứ tự desc
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(totalItems / itemsPerPage)) {
      setPage(newPage);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>
          <FaRobot /> Quản lý Chat AI
        </h2>
      </div>

      <div className="admin-content">
        <div className="admin-section">
          <h3>Thêm dữ liệu huấn luyện mới</h3>
          <form onSubmit={handleAddTrainingData} className="training-form">
            <div className="form-group">
              <label>Câu hỏi:</label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Nhập câu hỏi của người dùng"
                rows="3"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Câu trả lời:</label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Nhập câu trả lời cho chat AI"
                rows="4"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Danh mục:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="general">Chung</option>
                <option value="product">Sản phẩm</option>
                <option value="payment">Thanh toán</option>
                <option value="shipping">Vận chuyển</option>
                <option value="return">Đổi trả</option>
                <option value="warranty">Bảo hành</option>
                {categories.map(
                  (cat) =>
                    // Chỉ hiển thị các danh mục chưa được liệt kê ở trên
                    ![
                      "general",
                      "product",
                      "payment",
                      "shipping",
                      "return",
                      "warranty",
                    ].includes(cat) && (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                )}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              <FaPlus /> Thêm dữ liệu
            </button>
          </form>
        </div>

        <div className="admin-section">
          <h3>Dữ liệu huấn luyện hiện tại</h3>

          <div className="admin-tools">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm dữ liệu huấn luyện..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset về trang 1 khi tìm kiếm
                }}
              />
            </div>

            <div className="filter-bar">
              <FaFilter className="filter-icon" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1); // Reset về trang 1 khi lọc
                }}
              >
                <option value="">Tất cả danh mục</option>
                <option value="general">Chung</option>
                <option value="product">Sản phẩm</option>
                <option value="payment">Thanh toán</option>
                <option value="shipping">Vận chuyển</option>
                <option value="return">Đổi trả</option>
                <option value="warranty">Bảo hành</option>
                {categories.map(
                  (cat) =>
                    // Chỉ hiển thị các danh mục chưa được liệt kê ở trên
                    ![
                      "general",
                      "product",
                      "payment",
                      "shipping",
                      "return",
                      "warranty",
                    ].includes(cat) && (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                )}
              </select>
            </div>

            <div className="import-export">
              <div className="import-wrapper">
                <input
                  type="file"
                  id="fileInput"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  className="btn-import"
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  <FaFileImport /> Import
                </button>
                {importFile && (
                  <span className="file-name">{importFile.name}</span>
                )}
                {importData && (
                  <button className="btn-process-import" onClick={handleImport}>
                    Xử lý {importData.length} mục
                  </button>
                )}
              </div>

              <button className="btn-export" onClick={exportData}>
                <FaDownload /> Export
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : (
            <>
              <div className="training-data-table">
                <table>
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("question")}
                        className={
                          sortBy === "question" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Câu hỏi
                      </th>
                      <th
                        onClick={() => handleSort("answer")}
                        className={
                          sortBy === "answer" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Câu trả lời
                      </th>
                      <th
                        onClick={() => handleSort("category")}
                        className={
                          sortBy === "category" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Danh mục
                      </th>
                      <th
                        onClick={() => handleSort("useCount")}
                        className={
                          sortBy === "useCount" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Lượt dùng
                      </th>
                      <th
                        onClick={() => handleSort("accuracy")}
                        className={
                          sortBy === "accuracy" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Độ chính xác
                      </th>
                      <th
                        onClick={() => handleSort("isActive")}
                        className={
                          sortBy === "isActive" ? `sort-${sortOrder}` : ""
                        }
                      >
                        Trạng thái
                      </th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          Không có dữ liệu huấn luyện
                        </td>
                      </tr>
                    ) : (
                      trainingData.map((item, index) => (
                        <tr
                          key={item._id || index}
                          className={editingIndex === index ? "editing" : ""}
                        >
                          {editingIndex === index ? (
                            // Chế độ chỉnh sửa
                            <>
                              <td>
                                <textarea
                                  value={editItem.question}
                                  onChange={(e) =>
                                    setEditItem({
                                      ...editItem,
                                      question: e.target.value,
                                    })
                                  }
                                  rows="3"
                                ></textarea>
                              </td>
                              <td>
                                <textarea
                                  value={editItem.answer}
                                  onChange={(e) =>
                                    setEditItem({
                                      ...editItem,
                                      answer: e.target.value,
                                    })
                                  }
                                  rows="4"
                                ></textarea>
                              </td>
                              <td>
                                <select
                                  value={editItem.category}
                                  onChange={(e) =>
                                    setEditItem({
                                      ...editItem,
                                      category: e.target.value,
                                    })
                                  }
                                >
                                  <option value="general">Chung</option>
                                  <option value="product">Sản phẩm</option>
                                  <option value="payment">Thanh toán</option>
                                  <option value="shipping">Vận chuyển</option>
                                  <option value="return">Đổi trả</option>
                                  <option value="warranty">Bảo hành</option>
                                  {categories.map(
                                    (cat) =>
                                      // Chỉ hiển thị các danh mục chưa được liệt kê ở trên
                                      ![
                                        "general",
                                        "product",
                                        "payment",
                                        "shipping",
                                        "return",
                                        "warranty",
                                      ].includes(cat) && (
                                        <option key={cat} value={cat}>
                                          {cat}
                                        </option>
                                      )
                                  )}
                                </select>
                              </td>
                              <td colSpan="3">
                                <div className="edit-actions">
                                  <button
                                    onClick={saveEdit}
                                    className="btn-save"
                                  >
                                    <FaSave /> Lưu
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="btn-cancel"
                                  >
                                    <FaTimes /> Hủy
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Chế độ xem
                            <>
                              <td className="training-question">
                                {item.question}
                              </td>
                              <td className="training-answer">{item.answer}</td>
                              <td className="training-category">
                                {item.category || "general"}
                              </td>
                              <td className="training-count">
                                {item.useCount || 0}
                              </td>
                              <td className="training-accuracy">
                                {item.accuracy
                                  ? `${item.accuracy.toFixed(1)}%`
                                  : "N/A"}
                              </td>
                              <td
                                className={`training-status ${
                                  item.isActive ? "active" : "inactive"
                                }`}
                              >
                                {item.isActive ? "Kích hoạt" : "Vô hiệu"}
                              </td>
                              <td className="training-actions">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="btn-edit"
                                  title="Sửa"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="btn-delete"
                                  title="Xóa"
                                >
                                  <FaTrash />
                                </button>
                                <button
                                  onClick={() =>
                                    toggleActive(item._id, item.isActive)
                                  }
                                  className={`btn-toggle ${
                                    item.isActive ? "active" : "inactive"
                                  }`}
                                  title={
                                    item.isActive ? "Vô hiệu hóa" : "Kích hoạt"
                                  }
                                >
                                  {item.isActive ? "✓" : "✗"}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > itemsPerPage && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="pagination-button"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="pagination-button"
                  >
                    &lt;
                  </button>

                  <span className="pagination-info">
                    Trang {page} / {Math.ceil(totalItems / itemsPerPage)}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totalItems / itemsPerPage)}
                    className="pagination-button"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(Math.ceil(totalItems / itemsPerPage))
                    }
                    disabled={page >= Math.ceil(totalItems / itemsPerPage)}
                    className="pagination-button"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatTraining;
