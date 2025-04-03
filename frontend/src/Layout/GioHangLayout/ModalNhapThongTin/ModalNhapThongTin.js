import { Modal } from '../../../components/Modal'
import './ModalNhapThongTin.scss'
import { useState, useEffect } from 'react'

function ModalNhapThongTin ({
  isOpen,
  onClose,
  amount,
  sanphams,
  name,
  nguoinhan,
  phone,
  sex,
  giaotannoi,
  address,
  ghichu,
  magiamgia,
  userId
}) {
  const [bankCode, setBankCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [stockError, setStockError] = useState(null)
  const [isStockChecked, setIsStockChecked] = useState(false)
   
  // ✅ Kiểm tra tồn kho khi modal mở
  useEffect(() => {
    if (isOpen && sanphams && sanphams.length > 0) {
      checkStockAvailability()
    }
  }, [isOpen, sanphams])

  const checkStockAvailability = async () => {
    setLoading(true)
    setStockError(null)
    setIsStockChecked(false)

    try {
      for (const item of sanphams) {
        const response = await fetch(`http://localhost:3005/stock/${item.idsp}/${item.dungluong}/${item.idmausac}`)
        const stockInfo = await response.json()

        if (!stockInfo.unlimitedStock && stockInfo.stock !== 'Không giới hạn' && stockInfo.stock < item.soluong) {
          setStockError({
            productId: item.idsp,
            available: stockInfo.stock,
            requested: item.soluong,
            message: `Sản phẩm không đủ số lượng trong kho. Hiện chỉ còn ${stockInfo.stock} sản phẩm.`
          })
          setIsStockChecked(true)
          setLoading(false)
          return
        }
      }

      setIsStockChecked(true)
      setLoading(false)
    } catch (error) {
      console.error('Lỗi kiểm tra tồn kho:', error)
      setStockError({
        message: 'Không thể kiểm tra tồn kho. Vui lòng thử lại sau.'
      })
      setIsStockChecked(true)
      setLoading(false)
    }
  }

  const handlethanhtoan = async () => {
    if (!isStockChecked) {
      await checkStockAvailability()
      if (stockError) return
    }

    if (stockError) {
      alert(stockError.message)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3005/create_payment_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nguoinhan,
          phone,
          sex,
          giaotannoi,
          address,
          ghichu,
          magiamgia,
          bankCode,
          amount,
          sanphams,
          language: 'vn',
          userId: userId || null // ✅ Gửi userId nếu có
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
      alert('Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='bodythanhtoan'>
        {stockError && (
          <div className='stock-error'>
            <p>{stockError.message}</p>
          </div>
        )}

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
            <label htmlFor='vnbank'>Thanh toán qua ATM - ngân hàng nội địa</label>
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

        <button 
          className={`btndathang ${stockError || loading ? 'disabled' : ''}`} 
          onClick={handlethanhtoan}
          disabled={stockError || loading}
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán'}
        </button>
      </div>
    </Modal>
  )
}

export default ModalNhapThongTin
