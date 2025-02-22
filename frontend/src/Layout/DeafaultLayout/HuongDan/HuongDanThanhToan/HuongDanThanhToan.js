import React from "react";
import "./HuongDanThanhToan.scss";

const HuongDanThanhToan = () => {
  return (
    <div id="huong-dan-thanh-toan">
      <p className="thanhtoan-title">HƯỚNG DẪN THANH TOÁN</p>
      <p>
        • Quý khách chuyển khoản đặt cọc trước 10~30% giá trị đơn hàng: Khi nhận
        được tiền chúng tôi sẽ liên lạc ngay với quý khách để xác nhận đơn hàng
        và tiến hành chuyển hàng ngay.
      </p>
      <p>
        • Thanh toán số tiền còn lại khi nhận được hàng: nhân viên giao hàng sẽ
        đến tận nhà giao hàng cho quý khách và thu nốt số tiền này.
      </p>
      <h4>QUÝ KHÁCH CHUYỂN TIỀN CHO CHÚNG TÔI THEO THÔNG TIN TÀI KHOẢN SAU:</h4>
      <p>
        Chủ tài khoản: <span className="bold">NGUYỄN VĂN CÔNG</span>
      </p>
      <ul>
        <li>
          Ngân hàng VietTinBank Số tài khoản: 
          <span className="bold">****************</span>
        </li>
        <li>
          Ngân hàng Vietcombank Số tài khoản: 
          <span className="bold">****************</span>
        </li>
        <li>
          Ngân hàng Agribank Số tài khoản:
          <span className="bold">****************</span>
        </li>
        <li>
          Ngân hàng MB Bank Số tài khoản: 
          <span className="bold">****************</span>
        </li>
      </ul>
    </div>
  );
};

export default HuongDanThanhToan;
