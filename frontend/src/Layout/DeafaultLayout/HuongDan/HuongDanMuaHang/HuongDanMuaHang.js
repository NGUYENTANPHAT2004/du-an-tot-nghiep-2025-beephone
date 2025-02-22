import React from "react";
import "./HuongDanMuaHang.scss";

const HuongDanMuaHang = () => {
  return (
    <div id="huong-dan-mua-hang">
      <div className="muahang-title">HƯỚNG DẪN MUA HÀNG</div>

      <div className="muahang-subtitle">1. ĐẶT HÀNG QUA WEBSITE:</div>
      <p>
        <strong>Bước 1:</strong> Quý khách xem sản phẩm tại website, sau đó chọn
        sản phẩm cần mua rồi bấm vào nút MUA HÀNG. Quý khách nhập đầy đủ thông
        tin cho đơn hàng và tiến hành đặt hàng. Chúng tôi sẽ liên lạc với quý
        khách chậm nhất sau 24h kể từ khi quý khách gửi đơn hàng.
      </p>
      <p>
        <strong>Bước 2:</strong> Sau khi quý khách gửi đơn hàng và chúng tôi gọi
        điện thoại xác nhận, tùy vào đơn hàng mà chúng tôi sẽ yêu cầu quý khách
        đặt cọc để tránh tình trạng bom hàng.{" "}
        <a href="/huong-dan-thanh-toan" className="muahang-red">Hướng dẫn chuyển khoản qua ngân hàng</a>. Bên cạnh đó chúng tôi cũng khuyến
        khích quý vị liên lạc qua zalo hoặc Facebook messenger để dễ dàng trao
        đổi đầy đủ nhất về thông tin sản phẩm.
      </p>
      <p>
        <strong>Bước 3:</strong> Sau khi nhận tiền đặt cọc chúng tôi sẽ tiến
        hành chuyển hàng cho quý khách thông qua công ty chuyển phát nhanh
        J&T, thời gian giao hàng từ 1 đến 7 ngày tùy từng khu vực, đối với
        những đơn hàng có vị trí gần chúng tôi sẽ vận chuyển bằng ô tô. Nhân
        viên giao hàng sẽ thu nốt số tiền còn lại khi bàn giao sản phẩm trực
        tiếp tại nhà cho khách hàng.{" "}
        <a href="/chinh-sach-van-chuyen" className="muahang-red">Xem chính sách vận chuyển tại đây</a>.
      </p>
      <p>
        <strong>Bước 4:</strong> Khách hàng được mở kiểm tra sản phẩm trước khi
        thanh toán. Nếu cần phản ánh bất cứ điều gì về sản phẩm cũng như dịch
        vụ vận chuyển, quý khách vui lòng gọi ngay cho chúng tôi theo số{" "}
        <strong>Hotline: 0985963784</strong>.{" "}
        <a href="/doi-tra" className="muahang-red">Xem thêm quy định đổi trả sản phẩm tại đây</a>.
      </p>
      <p>
        <strong>Lưu ý:</strong> Tên sản phẩm luôn đi kèm với kích thước theo thứ
        tự chiều cao, chiều rộng, chiều sâu để quý khách tiện ước lượng. Ví
        dụ: tượng Di Lặc gỗ hương 80x38x34cm nghĩa là cao 80cm rộng 38cm và sâu
        34cm.
      </p>

      <div className="muahang-subtitle">2. ĐẶT HÀNG QUA ĐIỆN THOẠI:</div>
      <p>
        <strong>Bước 1:</strong> Quý khách gọi vào số{" "}
        <strong>Hotline: 0985963784</strong> và vui lòng cung cấp cho chúng tôi
        các thông tin sau:
      </p>
      <ul>
        <li>Chi tiết sản phẩm cần mua</li>
        <li>Yêu cầu thêm nếu có</li>
        <li>
          Cung cấp thông tin người nhận hàng gồm: tên, địa chỉ và số điện thoại
          liên hệ
        </li>
      </ul>
      <p>
        <strong>Bước 2:</strong> Tùy vào từng đơn hàng mà chúng tôi sẽ yêu cầu
        quý khách đặt cọc hay không.
      </p>
    </div>
  );
};

export default HuongDanMuaHang;
