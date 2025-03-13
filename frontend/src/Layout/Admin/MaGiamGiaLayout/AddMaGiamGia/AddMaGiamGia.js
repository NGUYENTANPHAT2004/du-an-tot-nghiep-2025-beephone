import { Modal } from '../../../../components/Modal'
import { useState } from 'react'
import './AddMaGG.scss'

function AddMaGiamGia ({ isOpen, onClose, fetchdata }) {
  const [soluong, setsoluong] = useState(0)
  const [phantram, setphantram] = useState(0)
  const [ngaybatdau, setngaybatdau] = useState('')
  const [ngayketthuc, setngayketthuc] = useState('')

  const handelClose = () => {
    setsoluong('')

    onClose()
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
          ngayketthuc
        })
      })
      if (response.ok) {
        handelClose()
        fetchdata()
      }
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={handelClose}>
      <div className='addtheloai'>
        <h2>Thêm mã giảm giá</h2>
        <div className='div_input_group'>
          <div className='input-group'>
            <input
              type='number'
              value={soluong}
              onChange={e => setsoluong(e.target.value)}
              placeholder='Nhập số lượng'
            />
            <input
              type='number'
              value={phantram}
              onChange={e => setphantram(e.target.value)}
              placeholder='Nhập số phần trăm'
            />
            <div className='div_date_magg'>
              <span>Từ ngày</span>
              <input
                type='date'
                value={ngaybatdau}
                onChange={e => setngaybatdau(e.target.value)}
              />
              <span>Đến ngày</span>
              <input
                type='date'
                value={ngayketthuc}
                onChange={e => setngayketthuc(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='button-group'>
          <button onClick={handelAddMaGiamGia} className='btnaddtl'>
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddMaGiamGia