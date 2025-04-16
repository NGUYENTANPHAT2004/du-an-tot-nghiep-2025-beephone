import { useState, useEffect } from "react";

import { FaMobile, FaTrashCan } from "react-icons/fa6";
import { HoaDonChiTiet } from "./HoaDonChiTiet";
import { XoaHoaDon } from "./XoaHoaDon";
import "./HoaDonLayout.scss";

function HoaDonLayout() {
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenXoaHoaDon, setisOpenXoaHoaDon] = useState(false);

  const fetchdata = async () => {
    try {
      const response = await fetch("http://localhost:3005/gethoadon");
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchdata();
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
    // Find the order being selected
    const selectedOrder = data.find((item) => item._id === id);

    // Check if the order has a restricted status

    let newSelectedIds = [...selectedIds];
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter((itemId) => itemId !== id);
    } else {
      newSelectedIds.push(id);
    }
    setSelectedIds(newSelectedIds);

    setSelectAll(newSelectedIds.length === data.length);
  };

  const handleStatusChange = async (id, value) => {
    try {
      // Find the current order
      const currentOrder = data.find((item) => item._id === id);

      // Prevent invalid status transitions
      if (
        currentOrder.trangthai === "Hủy Đơn Hàng" &&
        value !== "Hủy Đơn Hàng"
      ) {
        alert("Không thể thay đổi trạng thái của đơn hàng đã hủy");
        return;
      }

      // Prevent canceling completed orders
      if (
        value === "Hủy Đơn Hàng" &&
        (currentOrder.trangthai === "Đã nhận" ||
          currentOrder.trangthai === "Hoàn thành")
      ) {
        alert("Không thể hủy đơn hàng đã hoàn thành");
        return;
      }

      // Prevent invalid status transitions for completed orders
      if (
        currentOrder.trangthai === "Hoàn thành" &&
        (value === "Thanh toán thất bại" ||
          value === "Thanh toán hết hạn" ||
          value === "Đang xử lý" ||
          value === "Đã thanh toán" ||
          value === "Đang vận chuyển" ||
          value === "Đã nhận")
      ) {
        alert("Không thể thay đổi trạng thái của đơn hàng đã hoàn thành");
        return;
      }

      // Prevent invalid status transitions for received orders
      if (
        currentOrder.trangthai === "Đã nhận" &&
        (value === "Thanh toán thất bại" ||
          value === "Thanh toán hết hạn" ||
          value === "Đang xử lý" ||
          value === "Đã thanh toán" ||
          value === "Đang vận chuyển")
      ) {
        alert("Không thể thay đổi trạng thái của đơn hàng đã nhận");
        return;
      }

      // Prevent invalid status transitions for failed payment orders
      if (
        currentOrder.trangthai === "Thanh toán thất bại" &&
        (value === "Đã nhận" || value === "Hoàn thành")
      ) {
        alert(
          "Không thể chuyển đơn hàng thanh toán thất bại sang trạng thái này"
        );
        return;
      }

      // Prevent invalid status transitions for expired payment orders
      if (
        currentOrder.trangthai === "Thanh toán hết hạn" &&
        (value === "Đã nhận" || value === "Hoàn thành")
      ) {
        alert(
          "Không thể chuyển đơn hàng thanh toán hết hạn sang trạng thái này"
        );
        return;
      }

      // Set default values based on current status
      let defaultValues = {};

      // If order is already paid, set default values for shipping states
      if (currentOrder.thanhtoan) {
        if (value === "Đang vận chuyển") {
          defaultValues = {
            trangthai: "Đang vận chuyển",
            thanhtoan: true,
          };
        } else if (value === "Đã nhận") {
          defaultValues = {
            trangthai: "Đã nhận",
            thanhtoan: true,
          };
        } else if (value === "Hoàn thành") {
          defaultValues = {
            trangthai: "Hoàn thành",
            thanhtoan: true,
          };
        }
      }

      // If order is unpaid, set default values for payment states
      if (!currentOrder.thanhtoan) {
        if (value === "Đã thanh toán") {
          defaultValues = {
            trangthai: "Đã thanh toán",
            thanhtoan: true,
          };
        } else if (value === "Thanh toán thất bại") {
          defaultValues = {
            trangthai: "Thanh toán thất bại",
            thanhtoan: false,
          };
        } else if (value === "Thanh toán hết hạn") {
          defaultValues = {
            trangthai: "Thanh toán hết hạn",
            thanhtoan: false,
          };
        }
      }

      // Confirm before canceling an order
      if (value === "Hủy Đơn Hàng") {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
          return;
        }
        defaultValues = {
          trangthai: "Hủy Đơn Hàng",
          thanhtoan: currentOrder.thanhtoan,
        };
      }

      const response = await fetch(`http://localhost:3005/settrangthai/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trangthai: value,
          ...defaultValues,
        }),
      });

      if (response.ok) {
        fetchdata();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Có lỗi xảy ra khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  return (
    <div className="theloai_container">
      <div className="nav_chucnang">
        <button
          className="btnthemtheloai"
          onClick={() => {
            if (selectedIds.length === 0) {
              alert("Chọn một hóa đơn để xem chi tiết");
            } else if (selectedIds.length > 1) {
              alert("Chỉ được chọn một hóa đơn để xem chi tiết");
            } else {
              setIsOpen(true);
            }
          }}
        >
          <FaMobile className="icons" />
          Chi tiết
        </button>
        <button
          className="btnthemtheloai"
          onClick={() => {
            if (selectedIds.length === 0) {
              alert("Chọn một hóa đơn để xóa");
              return;
            }

            const hoaDonDuocChon = data.filter((hoaDon) =>
              selectedIds.includes(hoaDon._id)
            );

            const coHoaDonDaThanhToan = hoaDonDuocChon.some(
              (hoaDon) => hoaDon.thanhtoan
            );

            if (coHoaDonDaThanhToan) {
              alert("Chỉ được xóa hóa đơn chưa thanh toán");
              return;
            }

            setisOpenXoaHoaDon(true);
          }}
        >
          <FaTrashCan className="icons" />
          Xóa hóa đơn
        </button>
      </div>

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
            <th>Tên khách hàng</th>
            <th>Số điện thoại</th>
            <th>Địa chỉ</th>
            <th>Số lượng sản phẩm</th>
            <th>Tổng tiền</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelectItem(item._id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.phone}</td>
              <td>{item.address}</td>
              <td>{item.sanpham.length}</td>
              <td>{item.tongtien.toLocaleString()}đ </td>
              <td>{item.thanhtoan ? "Đã thanh toán" : "Chưa thanh toán"}</td>
              <td>
                <select
                  value={item.trangthai}
                  onChange={(e) => handleStatusChange(item._id, e.target.value)}
                  className="custom-select"
                >
                  <option value="Đang xử lý">🕒 Đang xử lý</option>
                  <option value="Đã thanh toán">💳 Đã thanh toán</option>
                  <option value="Đang vận chuyển">🚚 Đang vận chuyển</option>
                  <option value="Đã nhận">✅ Đã nhận</option>
                  <option value="Hoàn thành">✨ Hoàn thành</option>
                  <option value="Thanh toán thất bại">
                    ❌ Thanh toán thất bại
                  </option>
                  <option value="Thanh toán hết hạn">
                    ⏰ Thanh toán hết hạn
                  </option>
                  <option value="Hủy Đơn Hàng">🗑️ Hủy đơn hàng</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <HoaDonChiTiet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        idhoadon={selectedIds}
      />
      <XoaHoaDon
        isOpen={isOpenXoaHoaDon}
        onClose={() => setisOpenXoaHoaDon(false)}
        idhoadon={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
    </div>
  );
}

export default HoaDonLayout;
