import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";

import "./TimKiemLayout.scss";

const SearchResults = () => {
  const { keyword } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [IsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3005/timkiemhoadon", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: keyword }),
        });

        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Lỗi khi tải kết quả tìm kiếm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (keyword) fetchResults();
  }, [keyword]);

  const handleOpen = (item) => {
    item.thanhtoan === "Chưa thanh toán" ? setIsOpen(true) : setIsOpen(false);
  };

  if (loading) return <div>Đang tải kết quả tìm kiếm...</div>;

  return (
    <div className="timkiem_container">
      <table className="tablenhap">
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Tên Khách Hàng</th>
            <th>Số điện Thoại</th>
            <th>Ngày Mua</th>
            <th>Số lượng sản phẩm</th>
            <th>Tổng tiền</th>
            <th>Trạng thái thanh toán</th>
            <th>Trạng thái đơn hàng</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item) => (
            <tr key={item._id} onClick={() => handleOpen(item)}>
              <td>{item.maHDL}</td>
              <td>{item.name}</td>
              <td>{item.phone}</td>
              <td>{moment(item.ngaymua).format("DD/MM/YYYY")}</td>
              <td>{item.sanpham.length}</td>
              <td>{item.tongtien}</td>
              <td>{item.thanhtoan ? "Đã thanh toán" : "Chưa thanh toán"}</td>
              <td>{item.trangthai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchResults;
