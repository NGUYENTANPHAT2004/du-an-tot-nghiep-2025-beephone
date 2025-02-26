import { Modal } from '../../../components/Modal'
import './ModalNhapThongTin.scss'
import { useState } from 'react'
function ModalNhapThongTin ({
  isOpen,
  onClose,
  amount,
  sanphams,
  name,
  phone,
  sex,
  giaotannoi,
  address,
  ghichu,
  magiamgia
}) {
  const [bankCode, setBankCode] = useState('')
  const handlethanhtoan = async () => {
    try {
      const response = await fetch('http://localhost:3005/create_payment_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          phone,
          sex,
          giaotannoi,
          address,
          ghichu,
          magiamgia,
          bankCode,
          amount,
          sanphams,
          language:'vn'
        })
      })
      const data = await response.json()
      if (data.message) {
        alert(data.message)
      } else {
        window.location.href = data
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='bodythanhtoan'>
        <div className='bankcode-select'>
          <label>Mã ngân hàng</label>
          <div className='manganhang'>
            <input
              type='radio'
              id='vnpay'
              name='bankCode'
              value=''
              checked={bankCode === ''}
              onChange={e => setBankCode(e.target.value)}
            />
            <label htmlFor='vnpay'>Cổng thanh toán VNPAYQR</label>
          </div>
          <div className='manganhang'>
            <input
              type='radio'
              id='vnbank'
              name='bankCode'
              value='VNBANK'
              checked={bankCode === 'VNBANK'}
              onChange={e => setBankCode(e.target.value)}
            />
            <label htmlFor='vnbank'>
              Thanh toán qua ATM-Tài khoản ngân hàng nội địa
            </label>
          </div>
          <div className='manganhang'>
            <input
              type='radio'
              id='intcard'
              name='bankCode'
              value='INTCARD'
              checked={bankCode === 'INTCARD'}
              onChange={e => setBankCode(e.target.value)}
            />
            <label htmlFor='intcard'>Thanh toán qua thẻ quốc tế</label>
          </div>
        </div>
        <button className='btndathang' onClick={handlethanhtoan}>
          Thanh toán
        </button>
      </div>
    </Modal>
  )
}

export default ModalNhapThongTin
