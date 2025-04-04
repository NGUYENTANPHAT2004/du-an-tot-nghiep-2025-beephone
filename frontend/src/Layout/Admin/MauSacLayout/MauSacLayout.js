/* eslint-disable react-hooks/exhaustive-deps */
import { ModalBig } from "../../../components/ModalBig";
import { useState, useEffect } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { FaTrashCan, FaRotateLeft } from "react-icons/fa6";

import { AddMauSac } from "./AddMauSac";
import { UpdateMauSac } from "./UpdateMauSac";
import { XoaMauSac } from "./XoaMauSac";
import "./MauSacLayout.scss";

function MauSacLayout({ isOpen, onClose, iddungluong }) {
  const [data, setdata] = useState([]);
  const [isOpenThem, setIsOpenThem] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenXoa, setIsOpenXoa] = useState(false);
  const [loading, setloading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const fetchdata = async () => {
    if (iddungluong) {
      setloading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3005/mausac/${iddungluong}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Lỗi khi tải dữ liệu");
        }

        const data = await response.json();
        setdata(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setloading(false);
      }
    } else {
      setloading(false);
    }
  };

  const fetchTrashData = async () => {
    if (iddungluong) {
      setloading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3005/mausactrash/${iddungluong}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Lỗi khi tải dữ liệu thùng rác");
        }

        const data = await response.json();
        setdata(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setloading(false);
      }
    } else {
      setloading(false);
    }
  };

  useEffect(() => {
    if (iddungluong && isOpen) {
      if (showTrash) {
        fetchTrashData();
      } else {
        fetchdata();
      }
    }
  }, [iddungluong, isOpen, showTrash]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => item._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    let newSelectedIds = [...selectedIds];
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter((itemId) => itemId !== id);
    } else {
      newSelectedIds.push(id);
    }
    setSelectedIds(newSelectedIds);

    setSelectAll(newSelectedIds.length === data.length);
  };

  const handleRestore = async () => {
    if (selectedIds.length === 0) {
      alert("Chọn màu sắc để hoàn tác");
      return;
    }

    setloading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3005/restore-mausac", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Có lỗi xảy ra khi hoàn tác");
      }

      alert("Hoàn tác thành công");
      setSelectedIds([]);
      setSelectAll(false);
      fetchTrashData();
    } catch (error) {
      console.error(error);
      setError(`Lỗi hoàn tác: ${error.message}`);
    } finally {
      setloading(false);
    }
  };

  const handleToggleTrash = () => {
    setSelectedIds([]);
    setSelectAll(false);
    setShowTrash(!showTrash);
  };

  return (
    <ModalBig
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSelectedIds([]);
        setSelectAll(false);
        setShowTrash(false);
        setError(null);
      }}
    >
      <div>
        <div className="nav_chucnang">
          {!showTrash ? (
            <>
              <button
                className="btnthemtheloai"
                onClick={() => setIsOpenThem(true)}
                disabled={loading}
              >
                <FaPlus className="icons" />
                Thêm màu sắc
              </button>
              <button
                className="btnthemtheloai"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Chọn một màu sắc để cập nhật");
                  } else if (selectedIds.length > 1) {
                    alert("Chỉ được chọn một màu sắc để cập nhật");
                  } else {
                    setIsOpenEdit(true);
                  }
                }}
                disabled={loading || selectedIds.length !== 1}
              >
                <FaEdit className="icons" />
                Cập nhật
              </button>
              <button
                className="btnthemtheloai"
                onClick={() =>
                  selectedIds.length > 0
                    ? setIsOpenXoa(true)
                    : alert("Chọn màu sắc để xóa")
                }
                disabled={loading || selectedIds.length === 0}
              >
                <FaTrashCan className="icons" />
                Xóa màu sắc
              </button>
              <button
                className="btnthemtheloai"
                onClick={handleToggleTrash}
                disabled={loading}
              >
                <FaTrashCan className="icons" />
                Thùng rác
              </button>
            </>
          ) : (
            <>
              <button
                className="btnthemtheloai"
                onClick={handleToggleTrash}
                disabled={loading}
              >
                <FaRotateLeft className="icons" />
                Quay lại
              </button>
              <button
                className="btnthemtheloai"
                onClick={handleRestore}
                disabled={loading || selectedIds.length === 0}
              >
                <FaRotateLeft className="icons" />
                Hoàn tác
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Đóng</button>
          </div>
        )}

        <div className="view-title">
          <h3>{showTrash ? "Thùng rác màu sắc" : "Quản lý màu sắc"}</h3>
        </div>

        <table className="tablenhap">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  disabled={loading || data.length === 0}
                />
              </th>
              <th>STT</th>
              <th>ID</th>
              <th>Tên màu sắc</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading-cell">
                  <div className="loading-spinner"></div> Đang tải dữ liệu...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>{item._id}</td>
                  <td>{item.name}</td>
                  <td>{item.price.toLocaleString()}đ</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  {showTrash
                    ? "Không có màu sắc nào trong thùng rác"
                    : "Không có màu sắc nào"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddMauSac
        isOpen={isOpenThem}
        onClose={() => {
          setIsOpenThem(false);
          fetchdata();
        }}
        iddungluong={iddungluong}
        fetchdata={fetchdata}
      />
      <UpdateMauSac
        isOpen={isOpenEdit}
        onClose={() => {
          setIsOpenEdit(false);
          fetchdata();
        }}
        idmausac={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      <XoaMauSac
        isOpen={isOpenXoa}
        onClose={() => {
          setIsOpenXoa(false);
          fetchdata();
        }}
        idmausac={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
    </ModalBig>
  );
}

export default MauSacLayout;
