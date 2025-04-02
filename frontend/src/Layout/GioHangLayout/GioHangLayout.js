/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import './GioHangLayout.scss'
import { useState, useEffect } from 'react'
import { ModalNhapThongTin } from './ModalNhapThongTin'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faCircleExclamation, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { useUserContext } from '../../context/Usercontext'
function GioHangLayout () {
  const { user } = useUserContext();
  const [cart, setCart] = useState([])
  const [sex, setsex] = useState('Anh')
  const [name, setname] = useState('')
  const [phone, setphone] = useState('')
  const [nguoinhan, setnguoinhan] = useState('')
  const [giaotannoi, setgiaotannoi] = useState(true)
  const [address, setaddress] = useState('')
  const [ghichu, setghichu] = useState('')
  const [magiamgia, setmagiamgia] = useState('')
  const [isOpenModaltt, setisOpenModaltt] = useState(false)
  const [sanphams, setsanphams] = useState([])
  
  // Validation states
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [nguoinhanerror, setnguoinhanerror] = useState('')
  // Validation functions
  // Name validation status
  const [nameValid, setNameValid] = useState(false)
  const [phoneValid, setPhoneValid] = useState(false)
  const [addressValid, setAddressValid] = useState(false)
  const [nguoinhanvalid, setnguoinhanvalid] = useState(false)

  const validateName = (value) => {
    setname(value)
    if (!value.trim()) {
      setNameError('Vui lòng nhập họ tên')
      setNameValid(false)
      return false
    } else if (value.trim().length < 2) {
      setNameError('Họ tên phải có ít nhất 2 ký tự')
      setNameValid(false)
      return false
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(value)) {
      setNameError('Họ tên chỉ được chứa chữ cái và khoảng trắng')
      setNameValid(false)
      return false
    } else {
      setNameError('')
      setNameValid(true)
      return true
    }
  }
  const validatenguoinhan = (value) => {
    setnguoinhan(value)
    if (!value.trim()) {
      setnguoinhanerror('Vui lòng nhập họ tên')
      setnguoinhanvalid(false)
      return false
    } else if (value.trim().length < 2) {
      setnguoinhanerror('Họ tên phải có ít nhất 2 ký tự')
      setnguoinhanvalid(false)
      return false
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(value)) {
      setnguoinhanerror('Họ tên chỉ được chứa chữ cái và khoảng trắng')
      setnguoinhanvalid(false)
      return false
    } else {
      setnguoinhanerror('')
      setnguoinhanvalid(true)
      return true
    }
  }
  const validatePhone = (value) => {
    setphone(value)
    // Vietnamese phone number regex pattern
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
    
    if (!value.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại')
      setPhoneValid(false)
      return false
    } else if (!phoneRegex.test(value)) {
      setPhoneError('Số điện thoại không hợp lệ')
      setPhoneValid(false)
      return false
    } else {
      setPhoneError('')
      setPhoneValid(true)
      return true
    }
  }

  const validateAddress = (value) => {
    setaddress(value)
    if (!value.trim()) {
      setAddressError('Vui lòng nhập địa chỉ')
      setAddressValid(false)
      return false
    } else if (value.trim().length < 5) {
      setAddressError('Địa chỉ phải có ít nhất 5 ký tự')
      setAddressValid(false)
      return false
    } else {
      setAddressError('')
      setAddressValid(true)
      return true
    }
  }

  // Gộp quá trình khởi tạo cart và gọi API thành 1 useEffect
  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart')) || []
    if (cartData.length > 0) {
      callAPIsForEachObject(cartData)
    } else {
      setCart([])
    }
  }, [])

  const callAPIsForEachObject = async cartData => {
    try {
      const updatedData = await Promise.all(
        cartData.map(async item => {
          try {
            const response = await fetch(
              `http://localhost:3005/getmausacgh/${item.iddungluong}`
            )
            if (!response.ok)
              throw new Error(`Lỗi khi gọi API với ${item.iddungluong}`)
            const data = await response.json()

            // Nếu có dữ liệu màu, đặt mặc định cho sản phẩm
            if (data.length > 0) {
              return {
                ...item,
                soluong: item.soluong ? item.soluong : 1,
                mangmausac: data,
                // Nếu sản phẩm chưa có màu được chọn, lấy mặc định là phần tử đầu tiên
                mausac: item.mausac ? item.mausac : data[0].name,
                pricemausac: item.pricemausac ? item.pricemausac : data[0].price,
                idmausac: item.idmausac ? item.idmausac : data[0]._id
              }
            } else {
              return {
                ...item,
                soluong: 1,
                mangmausac: []
              }
            }
          } catch (error) {
            console.error('Lỗi khi gọi API:', error)
            return {
              ...item,
              soluong: 1,
              mangmausac: []
            }
          }
        })
      )
      setCart(updatedData)
      localStorage.setItem('cart', JSON.stringify(updatedData))
    } catch (error) {
      console.error('Lỗi khi gọi API:', error)
    }
  }

 // Khi user nhấn nút tăng số lượng:
const increaseQuantity = async (index) => {
  const newCart = [...cart];
  const product = newCart[index];

  // Gọi API check stock cho product.idsanpham, product.iddungluong, product.idmausac
  const response = await fetch(`http://localhost:3005/stock/${product.idsanpham}/${product.iddungluong}/${product.idmausac}`);
  const data = await response.json();

  // Nếu còn hàng, tăng
  if (data.stock > product.soluong) {
    newCart[index].soluong += 1;
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  } else {
    alert('Không đủ hàng');
  }
};


  const decreaseQuantity = index => {
    const newCart = [...cart]
    if (newCart[index].soluong > 1) {
      newCart[index].soluong -= 1
    } else {
      newCart.splice(index, 1)
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.pricemausac * item.soluong,
    0
  )

  const changeColor = (index, selectedColor, newPrice, colorId) => {
    const newCart = cart.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          mausac: selectedColor,
          pricemausac: newPrice,
          idmausac: colorId
        }
      }
      return item
    })
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  useEffect(() => {
    const formattedSanphams = cart.map(item => ({
      idsp: item.idsanpham,
      soluong: item.soluong,
      price: item.pricemausac,
      dungluong: item.iddungluong,
      mausac: item.mausac,
      idmausac: item.idmausac
    }))
    setsanphams(formattedSanphams)
  }, [cart])

  const validateAllFields = () => {
    const isNameValid = validateName(name);
    const isPhoneValid = validatePhone(phone);
    const isAddressValid = validateAddress(address);
    const isnguoinhanvalid = validatenguoinhan(nguoinhan)
    return isNameValid && isPhoneValid && isAddressValid && isnguoinhanvalid;
  }

  const handelOpenModalTT = () => {
    if (validateAllFields()) {
      setisOpenModaltt(true)
    }
  }

  return (
    <div className='giohang_container'>
      {cart.length > 0 ? (
        <>
          <div className='giohang_header_container'>
            {cart.map((item, index) => (
              <div className='giohang_header' key={index}>
                <div className='giohang_header_top'>
                  <div className='giohang_header_top_left'>
                    <img
                      src={item.imgsanpham}
                      alt=''
                      width={100}
                      height={110}
                    />
                  </div>
                  <div className='giohang_header_top_right'>
                    <div className='giohang_header_top_right_top'>
                      <span>{item.namesanpham}</span>
                      <div className='mausac_container'>
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
                                changeColor(index, mausac.name, mausac.price, mausac._id)
                              }
                            >
                              <div
                                style={{ backgroundColor: `${mausac.name}` }}
                              ></div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className='giohang_header_top_right_bottom'>
                      <span>
                        {(item.pricemausac * item.soluong).toLocaleString()}đ
                      </span>
                      <div className='quantity'>
                        <div
                          className='quantity_minus'
                          onClick={() => decreaseQuantity(index)}
                        >
                          -
                        </div>
                        <div className='quantity_number'>{item.soluong}</div>
                        <div
                          className='quantity_plus'
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
            <div className='giohang_header_bottom'>
              <div className='giohang_header_bottom_left'>
                <span>
                  <strong>Tạm tính </strong>({cart.length} sản phẩm)
                </span>
              </div>
              <div className='giohang_header_bottom_right'>
                <span>{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
          <div className='giohang_content_container'>
            <span>Thông tin khách hàng</span>
            <div className='giohang_thongtin_sex'>
              <div className='giohang_thongtin_sex_item'>
                <input
                  type='radio'
                  checked={sex === 'Anh'}
                  onClick={() => setsex('Anh')}
                />
                <label htmlFor=''>Anh</label>
              </div>
              <div className='giohang_thongtin_sex_item'>
                <input
                  type='radio'
                  checked={sex === 'Chị'}
                  onClick={() => setsex('Chị')}
                />
                <label htmlFor=''>Chị</label>
              </div>
            </div>
            <div className={`giohang_thongtin_input ${nameValid ? 'valid-input' : ''}`}>
              <div className={`div_thongtin_input ${nameError ? 'error' : ''}`}>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='người đặt'
                  value={name}
                  onChange={(e) => validateName(e.target.value)}
                  onBlur={(e) => validateName(e.target.value)}
                />
                {nameValid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {nameError && <div className='error_message'><FontAwesomeIcon icon={faCircleExclamation} /> {nameError}</div>}
            <div className={`giohang_thongtin_input ${nguoinhanvalid ? 'valid-input' : ''}`}>
              <div className={`div_thongtin_input ${nguoinhanerror ? 'error' : ''}`}>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='người nhận'
                  value={nguoinhan}
                  onChange={(e) => validatenguoinhan(e.target.value)}
                  onBlur={(e) => validatenguoinhan(e.target.value)}
                />
                {nguoinhanvalid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {nguoinhanerror && <div className='error_message'><FontAwesomeIcon icon={faCircleExclamation} /> {nguoinhanerror}</div>}
            <div className={`giohang_thongtin_input ${phoneValid ? 'valid-input' : ''}`}>
              <div className={`div_thongtin_input ${phoneError ? 'error' : ''}`}>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='Số điện thoại'
                  value={phone}
                  onChange={(e) => validatePhone(e.target.value)}
                  onBlur={(e) => validatePhone(e.target.value)}
                />
                {phoneValid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {phoneError && <div className='error_message'><FontAwesomeIcon icon={faCircleExclamation} /> {phoneError}</div>}
          </div>
          <div className='giohang_content_container'>
            <span>Hình thức nhận hàng</span>
            <div className='giohang_thongtin_sex'>
              <div className='giohang_thongtin_sex_item'>
                <input
                  type='radio'
                  checked={giaotannoi}
                  onClick={() => setgiaotannoi(true)}
                />
                <label htmlFor=''>Giao tận nơi</label>
              </div>
            </div>
            <div className={`giohang_thongtin_input ${addressValid ? 'valid-input' : ''}`}>
              <div className={`div_thongtin_input ${addressError ? 'error' : ''}`}>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='Địa chỉ cụ thể'
                  value={address}
                  onChange={(e) => validateAddress(e.target.value)}
                  onBlur={(e) => validateAddress(e.target.value)}
                />
                {addressValid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {addressError && <div className='error_message'><FontAwesomeIcon icon={faCircleExclamation} /> {addressError}</div>}
            
            <div className='giohang_thongtin_input'>
              <div className='div_thongtin_input'>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='Ghi chú (nếu có)'
                  value={ghichu}
                  onChange={e => setghichu(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className='giohang_content_container'>
            <span>Sử dụng mã giảm giá</span>
            <div className='giohang_thongtin_input'>
              <div className='div_thongtin_input'>
                <input
                  type='text'
                  className='input_giohang'
                  placeholder='Mã giảm giá'
                  value={magiamgia}
                  onChange={e => setmagiamgia(e.target.value)}
                />
              </div>
            </div>
            <div className='giohang_thongtin_tongtien'>
              <div className='div_thongtin_tongtien'>
                <span>Tổng tiền:</span>
              </div>
              <div className='div_thongtin_tongtien'>
                <span className='thongtin_tongtien'>
                  {totalPrice.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>
          <div className='giohang_content_container'>
            <button className='btndathang' onClick={handelOpenModalTT}>
              Tiến hành đặt hàng
            </button>
            <div className='div_text_hinhthuc'>
              Bạn có thể lựa chọn các hình thức thanh toán ở bước sau
            </div>
          </div>
          <ModalNhapThongTin
            isOpen={isOpenModaltt}
            onClose={() => setisOpenModaltt(false)}
            amount={totalPrice}
            name={name}
            nguoinhan = {nguoinhan}
            phone={phone}
            sex={sex}
            giaotannoi={giaotannoi}
            address={address}
            ghichu={ghichu}
            magiamgia={magiamgia}
            sanphams={sanphams}
            userId={user?._id || null}
          />
        </>
      ) : (
        <div className='giohang_no'>
          <div className='giohang_no_icon'>
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className='div_giohang_no_text'>
            <span className='giohang_no_text'>Giỏ hàng của bạn chưa có</span>
            <span className='giohang_no_text'>sản phẩm nào!</span>
          </div>
          <div>
            <p className='p_hotro'>
              Hỗ trợ: <a href='tel:1900.6626'>1900.6626 </a> (08h00 - 22h00)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GioHangLayout