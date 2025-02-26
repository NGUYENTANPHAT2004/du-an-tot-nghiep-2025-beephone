import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import "./GioHangLayout.scss";
import { ModalNhapThongTin } from "./ModalNhapThongTin";

function GioHangLayout() {
  const [cart] = useState([
    {
      imgsanpham:
        "https://cdn.viettelstore.vn/Images/Product/ProductImage/66855595.jpeg",
      namesanpham: "Ip16",
      pricemausac: 120000,
      soluong: 2,
      mausac: "red",
    },
    {
      imgsanpham:
        "https://cdn.viettelstore.vn/Images/Product/ProductImage/66855595.jpeg",
      namesanpham: "Ip16 Pro",
      pricemausac: 200000,
      soluong: 1,
      mausac: "black",
    },
  ]);

  const [sex, setSex] = useState("Anh");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [giaotannoi, setGiaotannoi] = useState(true);
  const [address, setAddress] = useState("");
  const [ghichu, setGhichu] = useState("");
  const [magiamgia, setMagiamgia] = useState("");
  const [isOpenModaltt, setIsOpenModaltt] = useState(false);
  const [sanphams] = useState([]);

  // Chỉ để tính tổng tiền hiển thị
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.pricemausac * item.soluong,
    0
  );

  return (
    <div className="giohang_container">
      {cart.length > 0 ? (
        <>
          {/* Hiển thị danh sách sản phẩm trong giỏ */}
          <div className="giohang_header_container">
            {cart.map((item, index) => (
              <div className="giohang_header" key={index}>
                <div className="giohang_header_top">
                  <div className="giohang_header_top_left">
                    <img
                      src={item.imgsanpham}
                      alt=""
                      width={100}
                      height={110}
                    />
                  </div>
                  <div className="giohang_header_top_right">
                    <div className="giohang_header_top_right_top">
                      <span className="item_name">{item.namesanpham}</span>
                    </div>
                    <div className="giohang_header_top_right_bottom">
                      <span className="price">
                        {(item.pricemausac * item.soluong).toLocaleString()}đ
                      </span>
                      <div className="quantity">
                        <div className="quantity_minus">-</div>
                        <div className="quantity_number">{item.soluong}</div>
                        <div className="quantity_plus">+</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="giohang_header_bottom">
              <div className="giohang_header_bottom_left">
                <span>
                  <strong>Tạm tính</strong> ({cart.length} sản phẩm)
                </span>
              </div>
              <div className="giohang_header_bottom_right">
                <span>{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="giohang_content_container">
            <span className="section_title">Thông tin khách hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Anh"}
                  onChange={() => setSex("Anh")}
                />
                <label>Anh</label>
              </div>
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Chị"}
                  onChange={() => setSex("Chị")}
                />
                <label>Chị</label>
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hình thức nhận hàng */}
          <div className="giohang_content_container">
            <span className="section_title">Hình thức nhận hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={giaotannoi === true}
                  onChange={() => setGiaotannoi(true)}
                />
                <label>Giao tận nơi</label>
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Địa chỉ cụ thể"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hình thức nhận hàng */}
          <div className="giohang_content_container">
            <span className="section_title">Hình thức nhận hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={giaotannoi === true}
                  onChange={() => setGiaotannoi(true)}
                />
                <label>Giao tận nơi</label>
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Địa chỉ cụ thể"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Ghi chú (nếu có)"
                  value={ghichu}
                  onChange={(e) => setGhichu(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mã giảm giá */}
          <div className="giohang_content_container">
            <span className="section_title">Sử dụng mã giảm giá</span>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Mã giảm giá"
                  value={magiamgia}
                  onChange={(e) => setMagiamgia(e.target.value)}
                />
              </div>
            </div>
            <div className="giohang_thongtin_tongtien">
              <div className="div_thongtin_tongtien">
                <span>Tổng tiền:</span>
              </div>
              <div className="div_thongtin_tongtien">
                <span className="thongtin_tongtien">
                  {totalPrice.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>

          {/* Nút đặt hàng */}
          <div className="giohang_content_container">
            <button className="btndathang">Tiến hành đặt hàng</button>
            <div className="div_text_hinhthuc">
              Bạn có thể lựa chọn các hình thức thanh toán ở bước sau
            </div>
          </div>

          {/* Modal (nếu cần hiển thị) */}
          <ModalNhapThongTin
            isOpen={isOpenModaltt}
            onClose={() => setIsOpenModaltt(false)}
            amount={totalPrice}
            name={name}
            phone={phone}
            sex={sex}
            giaotannoi={giaotannoi}
            address={address}
            ghichu={ghichu}
            magiamgia={magiamgia}
            sanphams={sanphams}
          />
        </>
      ) : (
        <div className="giohang_no">
          <div className="giohang_no_icon">
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className="div_giohang_no_text">
            <span className="giohang_no_text">Giỏ hàng của bạn chưa có</span>
            <span className="giohang_no_text">sản phẩm nào!</span>
          </div>
          <div>
            <p className="p_hotro">
              Hỗ trợ: <a href="tel:1900.6626">1900.6626 </a> (08h00 - 22h00)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GioHangLayout;
