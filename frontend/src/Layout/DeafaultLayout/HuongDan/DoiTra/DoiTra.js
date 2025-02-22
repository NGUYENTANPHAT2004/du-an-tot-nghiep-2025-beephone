import React, { useState } from "react";
import "./DoiTra.scss"; 

const DoiTra = () => {
  return (
    <div>
      <div className="exchange">THU CŨ ĐỔI MỚI</div>
      <div className="catelog_banner">
  <img src="https://shopdunk.com/images/uploaded/banner/PaaC.png" alt="" />

      </div>
      <div className="exchange-container">
      <h3 className="exchange-title">
        <strong>Thu cũ đổi mới lên đời Apple 0 đồng, tặng thêm đến 2.400.000đ lên đời iPhone 16 series</strong>
      </h3>
      <ul className="exchange-info">
        <li>
          <strong>Thời gian áp dụng:</strong> đến 31/10/2024
        </li>
        <li>
          <strong>Phạm vi:</strong> Toàn bộ hệ thống ShopDunk và ShopDunk+
        </li>
        <li>
          <strong>Lưu ý:</strong> Được áp dụng trả góp và <strong>không áp dụng</strong> cộng gộp các chương trình khuyến mãi khác.
        </li>
      </ul>
      <p className="exchange-content">
        <strong>Nội dung chương trình:</strong>
      </p>
      <ul className="exchange-details">
        <li>Thu máy cũ giá cao, thẩm định nhanh, lên đời máy mới ngay và không cần trả trước bất cứ khoản gì tại ShopDunk.</li>
        <li>
          Tặng thêm đến <strong>2.400.000đ</strong> khi khách hàng lên đời iPhone 16 series mới nhất, chi tiết như sau:
          <table className="exchange-table">
            <thead>
              <tr>
                <th>Mã hàng</th>
                <th>Giảm giá khi lên đời iPhone 16 series</th>
              </tr>
            </thead>
            <tbody>
              {["iPhone 15 series", "iPhone 14 series", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 Plus", "iPhone 13", "iPhone 12 Pro", "iPhone 12", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11"].map((model) => (
                <tr key={model}>
                  <td>{model}</td>
                  <td>đến 2.400.000</td>
                </tr>
              ))}
            </tbody>
          </table>
        </li>
      </ul>
      <p className="exchange-note">
        <strong>* Lưu ý:</strong>
      </p>
      <ul className="exchange-terms">
        <li>Không áp dụng cộng gộp với chương trình giảm giá khác</li>
        <li>Hỗ trợ trả góp số tiền thiếu lại khi lên đời</li>
        <li>Chỉ áp dụng sản phẩm được xác định thu lại là loại A/TBH</li>
      </ul>
    </div>
    </div>
  );
};

export default DoiTra;
