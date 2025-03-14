import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './DangNhapLayout.scss'
import { useState } from 'react'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { useUserContext } from '../../context/Usercontext'
import FacebookLogin from "react-facebook-login"

function DangNhap() {
  const [showPassword, setShowPassword] = useState(false)
  const { loginWithSocial, login } = useUserContext()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const validate = () => {
    const { username, password } = formData
    let isValid = true

    if (!username.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }

    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu', { position: 'top-right', autoClose: 2000 })
      isValid = false
    }
    return isValid
  }

  const handleFacebookResponse = (response) => {
    if (response.accessToken) {
      console.log("Facebook login response:", response); // For debugging
      loginWithSocial('facebook', response.accessToken);
    } else {
      console.error("Facebook login failed:", response);
    }
  };

  // Xử lý đăng nhập Google
  const handleGoogleSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      loginWithSocial('google', credentialResponse.credential);
    }
  };

  const handleRegister = async () => {
    try {
      if (!validate()) return

      login(formData)

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
            <h2>ĐĂNG NHẬP TÀI KHOẢN</h2>
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
          <div className='login_button'>
            <button onClick={handleRegister}>Đăng Ký</button>
          </div>
          <div className="social-login">
            <FacebookLogin
              appId="1851667402259732"
              autoLoad={false}
              fields="name,email"
              scope="public_profile"
              callback={handleFacebookResponse}
              cssClass="facebook-btn"
              textButton="Đăng nhập với Facebook"
            />


            <GoogleOAuthProvider clientId="625355579712-siv3ab624075ufh4uatn695jqe80m5fc.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={(error) => {
                  console.error("Google Login Failed:", error);
                  alert("Đăng nhập với Google thất bại");
                }}
                useOneTap
                theme="filled_blue"
                text="signin_with"
                shape="rectangular"
              />
            </GoogleOAuthProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DangNhap