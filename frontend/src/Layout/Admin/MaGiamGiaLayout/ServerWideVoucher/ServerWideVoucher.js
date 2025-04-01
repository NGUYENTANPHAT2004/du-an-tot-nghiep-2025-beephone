import { useState } from 'react'
import { Modal } from '../../../../components/Modal'
import './ServerWideVoucher.scss'

function ServerWideVoucher({ isOpen, onClose, onVoucherCreated }) {
  const [phantram, setPhantram] = useState(10)
  const [expireMinutes, setExpireMinutes] = useState(60)
  const [minOrderValue, setMinOrderValue] = useState(0)
  const [maxOrderValue, setMaxOrderValue] = useState('')
  const [goldenHourStart, setGoldenHourStart] = useState('')
  const [goldenHourEnd, setGoldenHourEnd] = useState('')
  const [isOneTimePerUser, setIsOneTimePerUser] = useState(true)
  const [daysOfWeek, setDaysOfWeek] = useState([])
  const [voucherMessage, setVoucherMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleClose = () => {
    setPhantram(10)
    setExpireMinutes(60)
    setMinOrderValue(0)
    setMaxOrderValue('')
    setGoldenHourStart('')
    setGoldenHourEnd('')
    setIsOneTimePerUser(true)
    setDaysOfWeek([])
    setVoucherMessage('')
    setResult(null)
    onClose()
  }

  const handleDayToggle = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day])
    }
  }

  const handleCreateServerWideVoucher = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3005/applyserverwidevoucher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sophantram: phantram,
          expireMinutes,
          minOrderValue: parseInt(minOrderValue || 0),
          maxOrderValue: maxOrderValue ? parseInt(maxOrderValue) : null,
          goldenHourStart,
          goldenHourEnd,
          isOneTimePerUser,
          daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek.sort() : [],
          message: voucherMessage
        })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success && onVoucherCreated) {
        onVoucherCreated(data.voucher)
      }
    } catch (error) {
      console.error('Error creating server-wide voucher:', error)
      setResult({
        success: false,
        message: 'Đã xảy ra lỗi khi tạo mã giảm giá toàn server'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className='server-wide-voucher'>
        <h2>Tạo mã giảm giá toàn server</h2>
        
        {!result ? (
          <div className='voucher-form'>
            <div className='form-group'>
              <label>Phần trăm giảm giá (%):</label>
              <input
                type='number'
                min="1"
                max="100"
                value={phantram}
                onChange={e => setPhantram(Math.min(100, Math.max(1, e.target.value)))}
                placeholder='Nhập phần trăm giảm giá'
              />
            </div>
            
            <div className='form-group'>
              <label>Thời gian hiệu lực (phút):</label>
              <input
                type='number'
                min="5"
                value={expireMinutes}
                onChange={e => setExpireMinutes(Math.max(5, e.target.value))}
                placeholder='Thời gian hiệu lực (phút)'
              />
            </div>
            
            <div className='form-group'>
              <label>Giá trị đơn hàng tối thiểu (VND):</label>
              <input
                type='number'
                value={minOrderValue}
                onChange={e => setMinOrderValue(e.target.value)}
                placeholder='Nhập giá trị tối thiểu (0 = không giới hạn)'
              />
            </div>
            
            <div className='form-group'>
              <label>Giá trị đơn hàng tối đa (VND):</label>
              <input
                type='number'
                value={maxOrderValue}
                onChange={e => setMaxOrderValue(e.target.value)}
                placeholder='Nhập giá trị tối đa (để trống = không giới hạn)'
              />
            </div>
            
            <div className='golden-hour-group'>
              <h4>Khung giờ vàng (để trống nếu không giới hạn)</h4>
              <div className='time-inputs'>
                <div className='form-group'>
                  <label>Bắt đầu:</label>
                  <input
                    type='time'
                    value={goldenHourStart}
                    onChange={e => setGoldenHourStart(e.target.value)}
                  />
                </div>
                
                <div className='form-group'>
                  <label>Kết thúc:</label>
                  <input
                    type='time'
                    value={goldenHourEnd}
                    onChange={e => setGoldenHourEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className='checkbox-group'>
              <input
                type='checkbox'
                id='oneTimeUse'
                checked={isOneTimePerUser}
                onChange={() => setIsOneTimePerUser(!isOneTimePerUser)}
              />
              <label htmlFor='oneTimeUse'>Mỗi người dùng chỉ được sử dụng một lần</label>
            </div>
            
            <div className='days-group'>
              <h4>Giới hạn ngày trong tuần (không chọn = áp dụng tất cả các ngày)</h4>
              <div className='days-checkboxes'>
                {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day, index) => (
                  <div className='day-option' key={index}>
                    <input
                      type='checkbox'
                      id={`day-sw-${index}`}
                      checked={daysOfWeek.includes(index)}
                      onChange={() => handleDayToggle(index)}
                    />
                    <label htmlFor={`day-sw-${index}`}>{day}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className='form-group'>
              <label>Thông báo cho người dùng (tùy chọn):</label>
              <textarea
                value={voucherMessage}
                onChange={e => setVoucherMessage(e.target.value)}
                placeholder='Ví dụ: Mã giảm giá đặc biệt cho khung giờ vàng! Mã giảm giá sẽ hết hạn sau 60 phút.'
                rows={3}
              />
            </div>
            
            <div className='button-group'>
              <button 
                onClick={handleCreateServerWideVoucher} 
                className='btn-create'
                disabled={loading}
              >
                {loading ? 'Đang tạo...' : 'Tạo mã giảm giá toàn server'}
              </button>
              <button onClick={handleClose} className='btn-cancel'>
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className='result-container'>
            {result.success ? (
              <>
                <div className='success-message'>
                  <h3>Đã tạo mã giảm giá toàn server thành công!</h3>
                  <div className='voucher-details'>
                    <div className='voucher-code'>
                      <span>Mã giảm giá:</span>
                      <strong>{result.voucher.code}</strong>
                    </div>
                    <div className='voucher-info'>
                      <p>Giảm giá: <strong>{result.voucher.percentOff}%</strong></p>
                      <p>Hết hạn vào: <strong>{result.voucher.expiresAt}</strong></p>
                    </div>
                    <div className='voucher-message'>
                      <p>Thông báo: {result.voucher.message}</p>
                    </div>
                  </div>
                </div>
                <div className='button-group'>
                  <button onClick={handleClose} className='btn-close'>
                    Đóng
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className='error-message'>
                  <h3>Không thể tạo mã giảm giá</h3>
                  <p>{result.message || 'Đã xảy ra lỗi không xác định'}</p>
                </div>
                <div className='button-group'>
                  <button onClick={() => setResult(null)} className='btn-retry'>
                    Thử lại
                  </button>
                  <button onClick={handleClose} className='btn-cancel'>
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ServerWideVoucher