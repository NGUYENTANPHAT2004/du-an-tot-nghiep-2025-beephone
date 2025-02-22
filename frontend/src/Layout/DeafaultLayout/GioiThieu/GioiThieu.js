import React from "react";
import "./GioiThieu.scss";

const GioiThieu = () => {
  return (
    <div id="gioithieu">
      <div className="gioi-thieu-title">Về chúng tôi</div>
      <p>
      HESMAN Group là đơn vị số 1 tạo nên những trải nghiệm tuyệt vời cho quá trình mua sắm sản phẩm công nghệ tại Việt Nam. Chúng tôi là đối tác ủy quyền tin cậy của các hãng công nghệ uy tín hàng đầu trên thế giới như Apple, Samsung trong lĩnh vực thương mại và dịch vụ.Điều tuyệt vời nhất ở HESMAN chính là, khi chúng ta trở thành đồng nghiệp, đối tác hay khách hàng của nhau, chúng ta đã trở thành người một nhà. Ở mỗi điểm chạm, chúng ta luôn kết nối, bàn bạc và trao đổi để cùng thống nhất mục tiêu chung, bởi chúng ta không có khoảng cách.
      </p>
      <p>
      HESMAN Group đã tạo nên một lịch sử mới cho thương hiệu ShopDunk, xóa nhòa đi mọi định kiến và khái niệm về thương hiệu ShopDunk cũ ở những năm 2012-2016. Hiện ShopDunk đang mạnh mẽ dấn thân, trở thành đối tác uy tín của những hãng công nghệ hàng đầu thế giới.
      </p>
      <div className="gioithieu-image">
        <img
          src="https://shopdunk.com/images/uploaded/Image%20(6)_1000.png"
          alt=""
          className="image-gt"
        />
        <p className="caption">
          Giới thiệu về cơ sở Shopdunk
        </p>
      </div>
      <p>
      Tầm nhìn tương lai, HESMAN Group sẽ là đơn vị tiên phong số 1 trong lĩnh vực cung cấp các sản phẩm công nghệ cao cấp mới nhất tới tay người tiêu dùng Việt Nam. Nâng cao giá trị trải nghiệm mua sắm cho khách hàng từ những nhu cầu nhỏ nhất với hệ thống stores rộng khắp trên toàn quốc

      </p>
      <p>
      HESMAN đặt ra sứ mệnh phát triển vượt bậc, mang những sản phẩm công nghệ độc đáo tới tay người tiêu dùng nhanh nhất, giúp tạo ra cuộc sống hiện đại, nơi con người kết nối với công nghệ và công nghệ phục vụ con người.
      </p>
      <p>
      Lấy con người và công nghệ làm cốt lõi cho định hướng phát triển doanh nghiệp, xoay quanh khách hàng làm trung tâm, HESMAN xây dựng hệ sinh thái cung cấp sản phẩm, dịch vụ công nghệ cao, định hướng mở rộng chi nhánh ở tất cả các tỉnh trên toàn quốc.
      </p>
      <p>
        <b>0985963963</b> (Tổng đài CSKH) và <b>0982560560</b> (Đại lý khu vực)
      </p>
      <div className="contact-info">
        <h3>Shopdunk</h3>
        <p>Địa chỉ: 202 Trường Chinh, Đống Đa, Hà Nội
        </p>
        <p>
          Fanpage:{" "}
          <a href="https://www.facebook.com/shopdunk/" className="gioithieu-red">
            https://www.facebook.com/shopdunk/
          </a>
        </p>
      </div>
    </div>
  );
};

export default GioiThieu;
