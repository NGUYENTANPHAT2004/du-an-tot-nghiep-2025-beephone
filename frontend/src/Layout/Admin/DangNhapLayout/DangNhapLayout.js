import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './DangNhapLayout.scss'
import { useState } from 'react'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import {ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function DagNhapLayout () {
  const [ispassword, setispassword] = useState(true)
  const [password, setpassword] = useState('')
  const [username, setusername] = useState('')

  const validate = () => {
    let isValid = true
    if (!password) {
      toast.error('bạn chưa nhập mật khẩu', {
        position: 'top-right',
        autoClose: 2000 // Ẩn sau 2 giây
      })
      isValid = false
    }
    if (!username) {
      toast.error('bạn chưa nhập tài khoản', {
        position: 'top-right',
        autoClose: 2000 // Ẩn sau 2 giây
      })
      isValid = false
    }

    return isValid
  }

  const handleLogin = async () => {
    try {
      if (validate()) {
        const response = await fetch('http://localhost:3005/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password
          })
        })
        const data = await response.json()
        if (data.message) {
          toast.error(data.message, {
            position: 'top-right',
            autoClose: 2000 // Ẩn sau 2 giây
          })
        } else {
          localStorage.setItem('data', data)
          window.location.href = '/admin?tab=Sản Phẩm'
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className='login_container'>
      <ToastContainer />
      <div className='login_main'>
        <div className='login_left'>
          <video autoPlay={true} muted loop playsInline>
            <source src='/video.mp4' type='video/mp4' />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
        <div className='login_right'>
          <div className='login_logo'>
            <img src='/logo2.png' alt='' />
            <h2>WELCOME BACK!</h2>
          </div>
          <div className='login_input'>
            <label htmlFor=''>Tài khoản</label>
            <div className='divinput_login'>
              <input
                type='text'
                placeholder='Nhập tài khoản'
                value={username}
                onChange={e => {
                  setusername(e.target.value)
                }}
                autoComplete='off'
              />
            </div>
          </div>
          <div className='login_input'>
            <label htmlFor=''>Mật khẩu</label>
            <div className='divinput_login'>
              <input
                type={ispassword ? 'password' : 'text'}
                placeholder='Nhập mật khẩu'
                value={password}
                onChange={e => {
                  setpassword(e.target.value)
                }}
                autoComplete='new-password'
              />
              <FontAwesomeIcon
                icon={ispassword ? faEyeSlash : faEye}
                onClick={() => setispassword(!ispassword)}
              />
            </div>
          </div>
          <div className='login_button'>
            <button onClick={handleLogin}>Đăng nhập</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DagNhapLayout
