import { Modal } from "../../../../components/Modal";
import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./AddSanPham.scss";

function AddSanPham({ isOpen, onClose, idtheloai, fetchData }) {
  const [name, setname] = useState("");
  const [price, setprice] = useState("");
  const [image, setimage] = useState("");
  const [file, setFile] = useState(null);
  const [mota, setmota] = useState("");

  // Biến State cho danh sách dung lượng và màu sắc của thể loại
  const [dungluongs, setDungluongs] = useState([]);
  const [mausacs, setMausacs] = useState([]);

  // Biến State cho biến thể đã chọn
  const [variantList, setVariantList] = useState([]); // Danh sách biến thể đã thêm
  const [currentVariant, setCurrentVariant] = useState({
    dungluong: "",
    mausac: "",
    stockQuantity: 0,
  });

  const [loading, setLoading] = useState(false);

  // Fetch dung lượng theo thể loại
  useEffect(() => {
    if (idtheloai && isOpen) {
      fetchDungluongs();
    }
  }, [idtheloai, isOpen]);

  // Fetch màu sắc theo dung lượng đã chọn
  useEffect(() => {
    if (currentVariant.dungluong) {
      fetchMausacs(currentVariant.dungluong);
    } else {
      setMausacs([]);
    }
  }, [currentVariant.dungluong]);

  const fetchDungluongs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3005/dungluong/${idtheloai}`
      );
      if (response.ok) {
        const data = await response.json();
        setDungluongs(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dung lượng:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMausacs = async (dungluongId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3005/mausac/${dungluongId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMausacs(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách màu sắc:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDungluongChange = (e) => {
    const dungluongId = e.target.value;
    // Tìm thông tin dung lượng từ danh sách
    const selectedDungluong = dungluongs.find((dl) => dl._id === dungluongId);

    setCurrentVariant({
      ...currentVariant,
      dungluong: dungluongId,
      dungluongName: selectedDungluong ? selectedDungluong.name : "",
      mausac: "", // Reset màu sắc khi đổi dung lượng
      mausacName: "",
      price: 0,
    });
  };

  const handleMausacChange = (e) => {
    const mausacId = e.target.value;
    // Tìm thông tin màu sắc từ danh sách
    const selectedMausac = mausacs.find((ms) => ms._id === mausacId);

    setCurrentVariant({
      ...currentVariant,
      mausac: mausacId,
      mausacName: selectedMausac ? selectedMausac.name : "",
      price: selectedMausac ? selectedMausac.price : 0,
    });
  };

  const addVariant = () => {
    // Kiểm tra nếu đã có đủ thông tin
    if (!currentVariant.dungluong || !currentVariant.mausac) {
      alert("Vui lòng chọn đầy đủ dung lượng và màu sắc");
      return;
    }

    // Kiểm tra xem biến thể đã tồn tại chưa
    const exists = variantList.some(
      (v) =>
        v.dungluong === currentVariant.dungluong &&
        v.mausac === currentVariant.mausac
    );

    if (exists) {
      alert("Biến thể này đã được thêm vào danh sách");
      return;
    }

    // Lấy tên đầy đủ từ danh sách
    const dungluongInfo = dungluongs.find(
      (dl) => dl._id === currentVariant.dungluong
    );
    const mausacInfo = mausacs.find((ms) => ms._id === currentVariant.mausac);

    // Thêm biến thể mới vào danh sách
    const newVariant = {
      ...currentVariant,
      dungluongName: dungluongInfo ? dungluongInfo.name : "Không xác định",
      mausacName: mausacInfo ? mausacInfo.name : "Không xác định",
      price: mausacInfo ? mausacInfo.price : 0,
    };

    setVariantList([...variantList, newVariant]);

    // Reset form
    setCurrentVariant({
      dungluong: "",
      mausac: "",
      stockQuantity: 0,
    });
  };

  const removeVariant = (index) => {
    const newList = [...variantList];
    newList.splice(index, 1);
    setVariantList(newList);
  };

  const handelclose = () => {
    setname("");
    setmota("");
    setprice("");
    setimage("");
    setFile(null);
    setCurrentVariant({
      dungluong: "",
      mausac: "",
      stockQuantity: 0,
    });
    setVariantList([]);
    onClose();
  };

  const handelAddsanpham = async () => {
    // Validate input
    if (!name.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!price.trim() || isNaN(parseFloat(price))) {
      alert("Vui lòng nhập giá hợp lệ");
      return;
    }

    if (!file) {
      alert("Vui lòng chọn ảnh sản phẩm");
      return;
    }

    if (variantList.length === 0) {
      alert("Vui lòng thêm ít nhất một biến thể cho sản phẩm");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("content", mota);
      formData.append("price", price);
      if (file) {
        formData.append("image", file);
      }

      // Truyền danh sách biến thể dưới dạng JSON
      formData.append("variantList", JSON.stringify(variantList));

      const response = await fetch(
        `http://localhost:3005/postchitietsp/${idtheloai}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const newProduct = await response.json();
        handelclose();
        fetchData();
      }
    } catch (error) {
      console.error(error);
      alert(`Lỗi: ${error.message || "Không xác định"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handelclose}>
      <div>
        <h2>Thêm sản phẩm</h2>
        <div className="div_input_group">
          <div className="input-group1">
            {image !== "" ? (
              <img src={image} alt="" width={150} height={200} />
            ) : (
              <h3>Ảnh sản phẩm</h3>
            )}
          </div>
          <div className="input-group">
            <label> Ảnh</label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFile(file);
                  setimage(URL.createObjectURL(file));
                }
              }}
            />
            <label>Tên sản phẩm:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setname(e.target.value)}
              placeholder="Nhập tên sản phẩm"
            />
            <label>Giá sản phẩm cơ bản:</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setprice(e.target.value)}
              placeholder="Nhập đơn giá"
            />
          </div>
        </div>

        <label>Mô tả sản phẩm:</label>
        <ReactQuill
          value={mota}
          onChange={setmota}
          placeholder="Nhập mô tả sản phẩm"
          theme="snow"
        />

        {/* Phần biến thể */}
        <div className="variant-section" style={{ marginTop: "20px" }}>
          <h3>Biến thể sản phẩm</h3>

          {/* Danh sách biến thể đã thêm */}
          {variantList.length > 0 && (
            <div className="variant-list">
              <h4>Danh sách biến thể đã chọn:</h4>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "20px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Dung lượng
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Màu sắc
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Giá thêm
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Tồn kho
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variantList.map((variant, index) => (
                    <tr key={index}>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {variant.dungluongName}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {variant.mausacName}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {parseInt(variant.price).toLocaleString()}đ
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {variant.stockQuantity}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <button
                          onClick={() => removeVariant(index)}
                          style={{
                            background: "#ff4d4f",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form chọn biến thể */}
          <div
            className="add-variant-form"
            style={{
              marginTop: "10px",
              padding: "15px",
              border: "1px solid #e8e8e8",
              borderRadius: "5px",
            }}
          >
            <h4>Chọn biến thể từ thể loại:</h4>

            {/* Chọn dung lượng */}
            <div style={{ marginBottom: "15px" }}>
              <label>Dung lượng:</label>
              <select
                value={currentVariant.dungluong}
                onChange={handleDungluongChange}
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              >
                <option value="">-- Chọn dung lượng --</option>
                {dungluongs.map((dl) => (
                  <option key={dl._id} value={dl._id}>
                    {dl.name}
                  </option>
                ))}
              </select>
              {dungluongs.length === 0 && (
                <div
                  style={{
                    color: "#ff4d4f",
                    marginTop: "5px",
                    fontSize: "14px",
                  }}
                >
                  Thể loại này chưa có dung lượng nào. Vui lòng thêm dung lượng
                  cho thể loại trước.
                </div>
              )}
            </div>

            {/* Chọn màu sắc */}
            {currentVariant.dungluong && (
              <div style={{ marginBottom: "15px" }}>
                <label>Màu sắc:</label>
                <select
                  value={currentVariant.mausac}
                  onChange={handleMausacChange}
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                >
                  <option value="">-- Chọn màu sắc --</option>
                  {mausacs.map((ms) => (
                    <option key={ms._id} value={ms._id}>
                      {ms.name} - Giá: {parseInt(ms.price || 0)}đ
                    </option>
                  ))}
                </select>
                {mausacs.length === 0 && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      marginTop: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Dung lượng này chưa có màu sắc nào. Vui lòng thêm màu sắc
                    cho dung lượng trước.
                  </div>
                )}
              </div>
            )}

            {/* Số lượng tồn kho */}
            {currentVariant.dungluong && currentVariant.mausac && (
              <div style={{ marginBottom: "15px" }}>
                <label>Số lượng tồn kho:</label>
                <input
                  type="number"
                  min="0"
                  value={currentVariant.stockQuantity}
                  onChange={(e) =>
                    setCurrentVariant({
                      ...currentVariant,
                      stockQuantity: e.target.value,
                    })
                  }
                  placeholder="Nhập số lượng tồn kho"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>
            )}

            {/* Nút thêm biến thể */}
            {currentVariant.dungluong && currentVariant.mausac && (
              <button
                onClick={addVariant}
                style={{
                  background: "#1890ff",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                Thêm vào danh sách
              </button>
            )}
          </div>
        </div>

        <div className="button-group" style={{ marginTop: "20px" }}>
          <button
            className="btnaddtl"
            onClick={handelAddsanpham}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Thêm sản phẩm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AddSanPham;
