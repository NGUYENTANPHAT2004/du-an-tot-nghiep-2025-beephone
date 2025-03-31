import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useUserContext } from '../../context/Usercontext';
import './lichsudonhang.scss';

function LichSuDonHangLayout() {
  const { user } = useUserContext();
  const [donHangs, setDonHangs] = useState([]);
  const [selectedDonHang, setSelectedDonHang] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;

      try {
        const response = await axios.post('http://localhost:3005/gethoadonuser', {
          userId: user._id,
        });
        setDonHangs(response.data.hoadons || []);
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleXemChiTiet = async (idhoadon) => {
    try {
      const response = await axios.get(`http://localhost:3005/getchitiethd/${idhoadon}`);
      setSelectedDonHang(response.data);
    } catch (error) {
      console.error('Lỗi khi xem chi tiết:', error);
    }
  };

  const handleXacNhan = async (idhoadon) => {
    try {
      await axios.post(`http://localhost:3005/settrangthai/${idhoadon}`, {
        trangthai: 'Hoàn thành',
      });
      alert('Đơn hàng đã được xác nhận hoàn thành');
      setSelectedDonHang(null);
      // Reload lại danh sách
      const refreshed = await axios.post('http://localhost:3005/gethoadonuser', {
        userId: user._id,
      });
      setDonHangs(refreshed.data.hoadons || []);
    } catch (error) {
      console.error('Lỗi xác nhận đơn:', error);
    }
  };

  return (
    <div className="lichsu-donhang-container">
      <h2>Lịch sử đơn hàng</h2>

      {donHangs.length === 0 ? (
        <p className="empty-message">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <table className="table-donhang">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Ngày Mua</th>
              <th>Trạng Thái</th>
              <th>Tổng Tiền</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {donHangs.map((hd) => (
              <tr key={hd._id}>
                <td>{hd.maHDL || hd._id.slice(-4)}</td>
                <td>{moment(hd.ngaymua).format('DD/MM/YYYY')}</td>
                <td>{hd.trangthai}</td>
                <td>{hd.tongtien.toLocaleString()}₫</td>
                <td>
                  <button className="btn-view" onClick={() => handleXemChiTiet(hd._id)}>Chi tiết</button>
                  {hd.trangthai === 'Đã thanh toán' && (
                    <button className="btn-confirm" onClick={() => handleXacNhan(hd._id)}>Xác nhận</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedDonHang && (
        <div className="chitiet-donhang">
          <h3>Chi tiết đơn hàng</h3>
          <p><strong>Người nhận:</strong> {selectedDonHang.nguoinhan}</p>
          <p><strong>SĐT:</strong> {selectedDonHang.phone}</p>
          <p><strong>Địa chỉ:</strong> {selectedDonHang.address}</p>
          <p><strong>Ngày mua:</strong> {selectedDonHang.ngaymua}</p>
          <p><strong>Ghi chú:</strong> {selectedDonHang.ghichu}</p>
          <h4>Sản phẩm:</h4>
          <ul>
            {selectedDonHang.hoadonsanpham.map((sp, index) => (
              <li key={index}>
                {sp.namesanpham} - {sp.dungluong} - {sp.mausac} - SL: {sp.soluong} - {sp.price.toLocaleString()}₫
              </li>
            ))}
          </ul>
          <p><strong>Tổng tiền:</strong> {selectedDonHang.tongtien.toLocaleString()}₫</p>
          <button className="btn-close" onClick={() => setSelectedDonHang(null)}>Đóng</button>
        </div>
      )}
    </div>
  );
}

export default LichSuDonHangLayout;
