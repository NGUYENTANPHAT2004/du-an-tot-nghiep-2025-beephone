/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import "./GioHangLayout.scss";
import { useState, useEffect } from "react";
import { ModalNhapThongTin } from "./ModalNhapThongTin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";

function GioHangLayout() {
  const [cart, setCart] = useState([]);
  const [sex, setsex] = useState("Anh");
  const [name, setname] = useState("");
  const [phone, setphone] = useState("");

  const [giaotannoi, setgiaotannoi] = useState(true);
  const [address, setaddress] = useState("");
  const [ghichu, setghichu] = useState("");
  const [magiamgia, setmagiamgia] = useState("");
  const [isOpenModaltt, setisOpenModaltt] = useState(false);
  const [sanphams, setsanphams] = useState([]);

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(cartData);
  }, []);

  const callAPIsForEachObject = async (cart) => {
    try {
      const updatedData = await Promise.all(
        cart.map(async (item) => {
          try {
            const response = await fetch(
              `http://localhost:3005/getmausacgh/${item.iddungluong}`
            );
            if (!response.ok)
              throw new Error(`Lỗi khi gọi API với ${item.iddungluong}`);

            const data = await response.json();

            return {
              ...item,
              soluong: 1,
              mangmausac: data.length > 0 ? data : [],
            };
          } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            return {
              ...item,
              soluong: 1,
              mangmausac: [],
            };
          }
        })
      );

      setCart(updatedData);
      localStorage.setItem("cart", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(cartData);
    if (cartData.length > 0) {
      callAPIsForEachObject(cartData);
    }
  }, []);

  const increaseQuantity = (index) => {
    const newCart = [...cart];
    newCart[index].soluong += 1;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];

    if (newCart[index].soluong > 1) {
      newCart[index].soluong -= 1;
    } else {
      newCart.splice(index, 1);
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.pricemausac * item.soluong,
    0
  );

  const changeColor = (index, selectedColor, newPrice) => {
    const newCart = [...cart];
    newCart[index].mausac = selectedColor;
    newCart[index].pricemausac = newPrice;

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  useEffect(() => {
    const formattedSanphams = cart.map((item) => ({
      idsp: item.idsanpham,
      soluong: item.soluong,
      price: item.pricemausac,
      dungluong: item.iddungluong,
      mausac: item.mausac,
    }));
    setsanphams(formattedSanphams);
  }, [cart]);

  const handelOpenModalTT = () => {
    if (!name) {
      alert("Vui lòng nhập họ tên");
      return;
    }

    if (!phone) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }
    if (!address) {
      alert("Vui lòng nhập địa chỉ");
      return;
    }
    setisOpenModaltt(true);
  };
  return (
    <div className="giohang_container">
      {cart.length > 0 ? (
        <>
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
                      <span>{item.namesanpham}</span>
                      <div className="mausac_container">
                        {item.mangmausac &&
                          item.mangmausac.map((mausac, row) => (
                            <div
                              className={
                                item.mausac === mausac.name
                                  ? `border_mausac border_mausac1`
                                  : `border_mausac`
                              }
                              key={row}
                              onClick={() =>
                                changeColor(index, mausac.name, mausac.price)
                              }
                            >
                              <div
                                style={{ backgroundColor: `${mausac.name}` }}
                              ></div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="giohang_header_top_right_bottom">
                      <span>
                        {(item.pricemausac * item.soluong).toLocaleString()}đ
                      </span>
                      <div className="quantity">
                        <div
                          className="quantity_minus"
                          onClick={() => decreaseQuantity(index)}
                        >
                          -
                        </div>
                        <div className="quantity_number">{item.soluong}</div>
                        <div
                          className="quantity_plus"
                          onClick={() => increaseQuantity(index)}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="giohang_header_bottom">
              <div className="giohang_header_bottom_left">
                <span>
                  <strong>Tạm tính </strong>({cart.length} sản phẩm)
                </span>
              </div>
              <div className="giohang_header_bottom_right">
                <span>{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <span>Thông tin khách hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Anh"}
                  onClick={() => setsex("Anh")}
                />
                <label htmlFor="">Anh</label>
              </div>
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Chị"}
                  onClick={() => setsex("Chị")}
                />
                <label htmlFor="">Chị</label>
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setname(e.target.value)}
                />
              </div>
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setphone(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <span>Hình thức nhận hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={giaotannoi}
                  onClick={() => setgiaotannoi(true)}
                />
                <label htmlFor="">Giao tận nơi</label>
              </div>
            </div>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Địa chỉ cụ thể"
                  value={address}
                  onChange={(e) => setaddress(e.target.value)}
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
                  onChange={(e) => setghichu(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <span>Sử dụng mã giảm giá</span>
            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Mã giảm giá"
                  value={magiamgia}
                  onChange={(e) => setmagiamgia(e.target.value)}
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
          <div className="giohang_content_container">
            <button className="btndathang" onClick={handelOpenModalTT}>
              Tiến hành đặt hàng
            </button>
            <div className="div_text_hinhthuc">
              Bạn có thể lựa chọn các hình thức thanh toán ở bước sau
            </div>
          </div>
          <ModalNhapThongTin
            isOpen={isOpenModaltt}
            onClose={() => setisOpenModaltt(false)}
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
