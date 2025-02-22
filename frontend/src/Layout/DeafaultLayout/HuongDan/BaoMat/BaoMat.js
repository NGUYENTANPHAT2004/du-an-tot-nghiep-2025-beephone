import React from "react";
import "./BaoMat.scss";

const BaoMat = () => {
  return (
    <div id="baomat">
      <img
        src="https://dogovinhdinh.vn/wp-content/uploads/2020/10/baomatthongtin1.jpg"
        alt="Logo"
        className="img-bao-mat"
      />
      <div className="baomat-description">
        Chính sách bảo mật thông tin khách hàng của chúng tôi cụ thể như sau:
      </div>
      <div className="bao-mat-subtitle">1. Thu nhập thông tin cá nhân</div>
      <div className="baomat-description">
        Các thông tin cá nhân của khách hàng được thu thập thông qua website Đồ
        thờ Công Hương sẽ giúp chúng tôi:
        <ul className="baomat-list1">
          <li>Hỗ trợ khách hàng khi mua sản phẩm</li>
          <li>Giải đáp thắc mắc khách hàng</li>
          <li>
            Cung cấp cho bạn thông tin mới nhất trên Website của chúng tôi
          </li>
          <li>
            Xem xét và nâng cấp nội dung và giao diện của Website cho phù hợp
          </li>
          <li>Thực hiện các bản khảo sát khách hàng</li>
          <li>
            Thực hiện các hoạt động quảng bá liên quan đến các sản phẩm và dịch
            vụ của chúng tôi.
          </li>
        </ul>
      </div>
      <div className="bao-mat-subtitle">2. Sử dụng thông tin cá nhân</div>
      <ul className="baomat-list2">
        <li>
          Website Shopdunk thu thập và sử dụng thông tin cá nhân quý
          khách với mục đích phù hợp và hoàn toàn tuân thủ nội dung của “Chính
          sách bảo mật” này.
        </li>
        <li>
          Khi cần thiết chúng tôi có thể sử dụng những thông tin này để liên hệ
          trực tiếp với khách hàng dưới các hình thức như: gửi thư ngỏ, đơn đặt
          hàng, thư cảm ơn, giới thiệu các chương trình ưu đãi, giảm giá …
        </li>
      </ul>

      <div className="bao-mat-subtitle">3. Chia sẻ thông tin cá nhân</div>
      <ul className="baomat-list3">
        <li>
          Ngoại trừ các trường hợp về sử dụng thông tin cá nhân như đã nêu trong
          chính sách này, chúng tôi cam kết sẽ không tiết lộ thông tin cá nhân
          của khách hàng ra bên ngoài.
        </li>
        <li>
          Chúng tôi có thể tiết lộ hoặc cung cấp thông tin cá nhân của bạn trong
          các trường hợp thật sự cần thiết như sau: (a) khi có yêu cầu của các
          cơ quan pháp luật; (b) trong trường hợp mà chúng tôi tin rằng điều đó
          sẽ giúp chúng tôi bảo vệ quyền lợi chính đáng của mình trước pháp
          luật.
        </li>
      </ul>

      <div className="bao-mat-subtitle">4. Thay đổi về chính sách</div>
      <ul className="baomat-list4">
        <li>
          Chúng tôi hoàn toàn có thể thay đổi nội dung trong trang này mà không
          cần phải thông báo trước, để phù hợp với các nhu cầu của Đồ gỗ Vinh
          Đính cũng như nhu cầu và sự phản hồi từ khách hàng nếu có.
        </li>
        <li>
          Nội dung “Chính sách bảo mật” này chỉ áp dụng tại website Đồ thờ Công
          Hương. Chúng tôi khuyến khích bạn đọc kỹ chính sách An toàn và Bảo mật
          của các trang web của bên thứ ba trước khi cung cấp thông tin cá nhân
          cho các trang web đó. Chúng tôi không chịu trách nhiệm dưới bất kỳ
          hình thức nào về nội dung và tính pháp lý của trang web thuộc bên thứ
          ba.
        </li>
        <li>
          Vì vậy, bạn đã đồng ý rằng, khi bạn sử dụng website của chúng tôi sau
          khi chỉnh sửa nghĩa là bạn đã thừa nhận, đồng ý tuân thủ cũng như tin
          tưởng vào sự chỉnh sửa này. Do đó, chúng tôi đề nghị bạn nên xem trước
          nội dung trang này trước khi truy cập các nội dung khác trên website
          cũng như bạn nên đọc và tham khảo kỹ nội dung “Chính sách bảo mật” của
          từng website mà bạn đang truy cập.
        </li>
      </ul>
      <div className="bao-mat-subtitle">5. Thông tin liên hệ</div>
      <div className="baomat-description">
        Chúng tôi luôn hoan nghênh các ý kiến đóng góp và phản hồi thông tin từ
        quý khách hàng về “Chính sách bảo mật” này. Nếu quý khách có những thắc
        mắc liên quan xin vui lòng{" "}
        <a href="/lien-he" style={{ color: "red", textDecoration: "none" }}>
          liên hệ với chúng tôi
        </a>{" "}
        để được giải đáp.
      </div>
    </div>
  );
};

export default BaoMat;
