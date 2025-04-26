import { useState, useEffect } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { AddBlog } from "./AddBlog";
import { XoaBlog } from "./XoaBlog";
import { UpdateBlog } from "./UpdateBlog";
import "./BlogLayout.scss";

function BlogLayout() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3005/getblog");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const blogData = await response.json();
      setData(blogData);
      setError(null);
    } catch (error) {
      console.error("Error fetching blog data:", error);
      setError("Failed to load blog data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => item._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prevIds) => {
      const newSelectedIds = prevIds.includes(id)
        ? prevIds.filter((itemId) => itemId !== id)
        : [...prevIds, id];

      // Update selectAll state based on if all items are selected
      const allSelected = newSelectedIds.length === data.length;
      setSelectAll(allSelected);

      return newSelectedIds;
    });
  };

  const handleEdit = () => {
    if (selectedIds.length === 0) {
      alert("Chọn một Blog để cập nhật");
    } else if (selectedIds.length > 1) {
      alert("Chỉ được chọn một Blog để cập nhật");
    } else {
      setIsOpenEdit(true);
    }
  };

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      setIsOpenDelete(true);
    } else {
      alert("Chọn một Blog để xóa");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="blog_container">
      <div className="nav_chucnang">
        <button className="btnthemtheloai" onClick={() => setIsOpenAdd(true)}>
          <FaPlus className="icons" />
          Thêm Blog
        </button>
        <button className="btnthemtheloai" onClick={handleEdit}>
          <FaEdit className="icons" />
          Cập nhật
        </button>
        <button className="btnthemtheloai" onClick={handleDelete}>
          <FaTrashCan className="icons" />
          Xóa Blog
        </button>
      </div>

      {data.length === 0 ? (
        <div className="no-data">Không có dữ liệu blog</div>
      ) : (
        <table className="tablenhap">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th>STT</th>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tiêu đề</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item._id || index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item._id)}
                    onChange={() => handleSelectItem(item._id)}
                  />
                </td>
                <td>{index + 1}</td>
                <td>{item._id}</td>
                <td>
                  <img
                    src={item.img_blog}
                    alt={item.tieude_blog || "Blog image"}
                  />
                </td>
                <td>{item.tieude_blog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddBlog
        isOpen={isOpenAdd}
        onClose={() => setIsOpenAdd(false)}
        fetchdata={fetchData}
      />
      <XoaBlog
        isOpen={isOpenDelete}
        onClose={() => setIsOpenDelete(false)}
        idblog={selectedIds}
        fetchdata={fetchData}
      />
      <UpdateBlog
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        fetchdata={fetchData}
        idblog={selectedIds}
      />
    </div>
  );
}

export default BlogLayout;
