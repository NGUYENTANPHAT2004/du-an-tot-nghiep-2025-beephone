import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './DangKiLayout.scss'
import { useState } from 'react'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserContext } from '../../context/Usercontext'

function DangKiLayout() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: ''
  })
  const {register} = useUserContext();
  const validate = () => {
    const { username, password, email, phone } = formData
    let isValid = true

    if (!username.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }

    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      toast.error('Email không hợp lệ', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }

    if (!/^(0|\+84)(\d{9,10})$/.test(phone)) {
      toast.error('Số điện thoại không hợp lệ', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }

    return isValid
  }

  const handleRegister = async () => {
    try {
      if (!validate()) return
      register(formData)
    } catch (error) {
      toast.error(error.message, { position: 'top-right', autoClose: 2000 })
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className='login_container'>
      <ToastContainer />
      <div className='login_main'>
        <div className='login_left'>
          <video autoPlay muted loop playsInline>
            <source src='/video.mp4' type='video/mp4' />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
        
        <div className='login_right'>
          <div className='login_logo'>
            <img src='/logo2.png' alt='logo' />
            <h2>ĐĂNG KÝ TÀI KHOẢN</h2>
          </div>

          <div className='login_input'>
            <label>Tài khoản</label>
            <div className='divinput_login'>
              <input
                type='text'
                name='username'
                placeholder='Nhập tên đăng nhập'
                value={formData.username}
                onChange={handleInputChange}
                autoComplete='off'
              />
            </div>
          </div>

          <div className='login_input'>
            <label>Mật khẩu</label>
            <div className='divinput_login'>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                placeholder='Nhập mật khẩu'
                value={formData.password}
                onChange={handleInputChange}
                autoComplete='new-password'
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          <div className='login_input'>
            <label>Email</label>
            <div className='divinput_login'>
              <input
                type='email'
                name='email'
                placeholder='Nhập email'
                value={formData.email}
                onChange={handleInputChange}
                autoComplete='email'
              />
            </div>
          </div>

          <div className='login_input'>
            <label>Số điện thoại</label>
            <div className='divinput_login'>
              <input
                type='tel'
                name='phone'
                placeholder='Nhập số điện thoại'
                value={formData.phone}
                onChange={handleInputChange}
                autoComplete='tel'
              />
            </div>
          </div>

          <div className='login_button'>
            <button onClick={handleRegister}>Đăng Ký</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DangKiLayout