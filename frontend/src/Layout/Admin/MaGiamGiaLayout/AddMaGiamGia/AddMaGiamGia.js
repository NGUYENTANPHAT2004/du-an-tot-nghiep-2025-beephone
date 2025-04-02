import { Modal } from '../../../../components/Modal'
import { useState } from 'react'
import './AddMaGG.scss'

function AddMaGiamGia({ isOpen, onClose, fetchdata }) {
  const [soluong, setSoluong] = useState(0)
  const [phantram, setPhantram] = useState(0)
  const [ngaybatdau, setNgaybatdau] = useState('')
  const [ngayketthuc, setNgayketthuc] = useState('')
  const [minOrderValue, setMinOrderValue] = useState(0)
  const [maxOrderValue, setMaxOrderValue] = useState('')
  const [goldenHourStart, setGoldenHourStart] = useState('')
  const [goldenHourEnd, setGoldenHourEnd] = useState('')
  const [isServerWide, setIsServerWide] = useState(false)
  const [isOneTimePerUser, setIsOneTimePerUser] = useState(true)
  const [daysOfWeek, setDaysOfWeek] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleClose = () => {
    setSoluong(0)
    setPhantram(0)
    setNgaybatdau('')
    setNgayketthuc('')
    setMinOrderValue(0)
    setMaxOrderValue('')
    setGoldenHourStart('')
    setGoldenHourEnd('')
    setIsServerWide(false)
    setIsOneTimePerUser(true)
    setDaysOfWeek([])
    setShowAdvanced(false)
    onClose()
  }

  const handleDayToggle = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day])
    }
  }

  const handelAddMaGiamGia = async () => {
    try {
      const response = await fetch('http://localhost:3005/postmagg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          soluong,
          sophantram: phantram,
          ngaybatdau,
          ngayketthuc,
          minOrderValue: parseInt(minOrderValue || 0),
          maxOrderValue: maxOrderValue ? parseInt(maxOrderValue) : null,
          goldenHourStart,
          goldenHourEnd,
          isServerWide,
          isOneTimePerUser,
          daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek.sort() : [] // Sort days numerically
        })
      })
      if (response.ok) {
        handleClose()
        fetchdata()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className='addtheloai'>
        <h2>Thêm mã giảm giá</h2>
        <div className='div_input_group'>
          <div className='input-group'>
            <label>Số lượng mã giảm giá:</label>
            <input
              type='number'
              value={soluong}
              onChange={e => setSoluong(e.target.value)}
              placeholder='Nhập số lượng'
            />
            
            <label>Phần trăm giảm giá (%):</label>
            <input
              type='number'
              value={phantram}
              onChange={e => setPhantram(e.target.value)}
              placeholder='Nhập số phần trăm'
            />
            
            <div className='div_date_magg'>
              <span>Từ ngày:</span>
              <input
                type='date'
                value={ngaybatdau}
                onChange={e => setNgaybatdau(e.target.value)}
              />
              <span>Đến ngày:</span>
              <input
                type='date'
                value={ngayketthuc}
                onChange={e => setNgayketthuc(e.target.value)}
              />
            </div>
            
            <div className="toggle-advanced">
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-toggle"
              >
                {showAdvanced ? 'Ẩn tùy chọn nâng cao' : 'Hiển thị tùy chọn nâng cao'}
              </button>
            </div>

            {showAdvanced && (
              <div className="advanced-options">
                <h3>Tùy chọn nâng cao</h3>
                
                <div className="order-limits">
                  <label>Giá trị đơn hàng tối thiểu (VND):</label>
                  <input
                    type='number'
                    value={minOrderValue}
                    onChange={e => setMinOrderValue(e.target.value)}
                    placeholder='Nhập giá trị tối thiểu (0 = không giới hạn)'
                  />
                  
                  <label>Giá trị đơn hàng tối đa (VND):</label>
                  <input
                    type='number'
                    value={maxOrderValue}
                    onChange={e => setMaxOrderValue(e.target.value)}
                    placeholder='Nhập giá trị tối đa (để trống = không giới hạn)'
                  />
                </div>
                
                <div className="golden-hour">
                  <h4>Khung giờ vàng (để trống nếu không giới hạn)</h4>
                  <div className="time-inputs">
                    <label>Bắt đầu:</label>
                    <input
                      type='time'
                      value={goldenHourStart}
                      onChange={e => setGoldenHourStart(e.target.value)}
                    />
                    
                    <label>Kết thúc:</label>
                    <input
                      type='time'
                      value={goldenHourEnd}
                      onChange={e => setGoldenHourEnd(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="usage-options">
                  <div className="checkbox-group">
                    <input
                      type='checkbox'
                      id='serverWide'
                      checked={isServerWide}
                      onChange={() => setIsServerWide(!isServerWide)}
                    />
                    <label htmlFor='serverWide'>Áp dụng cho toàn bộ người dùng (Server-wide)</label>
                  </div>
                  
                  <div className="checkbox-group">
                    <input
                      type='checkbox'
                      id='oneTimeUse'
                      checked={isOneTimePerUser}
                      onChange={() => setIsOneTimePerUser(!isOneTimePerUser)}
                    />
                    <label htmlFor='oneTimeUse'>Mỗi người dùng chỉ được sử dụng một lần</label>
                  </div>
                </div>
                
                <div className="day-restrictions">
                  <h4>Giới hạn ngày trong tuần (không chọn = áp dụng tất cả các ngày)</h4>
                  <div className="days-checkboxes">
                    {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day, index) => (
                      <div className="day-option" key={index}>
                        <input
                          type='checkbox'
                          id={`day-${index}`}
                          checked={daysOfWeek.includes(index)}
                          onChange={() => handleDayToggle(index)}
                        />
                        <label htmlFor={`day-${index}`}>{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='button-group'>
          <button onClick={handelAddMaGiamGia} className='btnaddtl'>
            Thêm
          </button>
          <button onClick={handleClose} className='btncancel'>
            Hủy
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddMaGiamGia