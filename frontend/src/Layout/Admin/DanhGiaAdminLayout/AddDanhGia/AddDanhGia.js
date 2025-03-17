import { Modal } from '../../../../components/Modal'
import { useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import './AddDanhGia.scss'

function AddDanhGia ({ isOpen, onClose, fetchdata }) {
  const [name, setname] = useState('')
  const [rating, setRating] = useState(0)
  const [thongtin, sethongtin] = useState('')

  const handelClose = () => {
    setname('')
    sethongtin('')
    setRating(0)
    onClose()
  }

  const handelAddDanhGia = async () => {
    try {
      const response = await fetch('http://localhost:3005/danhgiaadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenkhach: name,
          content: thongtin,
          rating
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
  const handleRating = value => {
    setRating(value)
  }

  return (
    <Modal isOpen={isOpen} onClose={handelClose}>
      <div className='addtheloai'>
        <h2>Thêm đánh giá</h2>
        <div className='rating-select-admin'>
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`star_admin ${
                rating >= star ? 'starselected_admin' : ''
              }`}
              onClick={() => handleRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <div className='div_input_group'>
          <div className='input-group'>
            <input
              type='text'
              value={name}
              onChange={e => setname(e.target.value)}
              placeholder='Nhập tên đánh giá'
            />
            <textarea
              className='input-review_admin'
              value={thongtin}
              onChange={e => sethongtin(e.target.value)}
              placeholder='Nhập nội dung'
            ></textarea>
          </div>
        </div>

        <div className='button-group'>
          <button onClick={handelAddDanhGia} className='btnaddtl'>
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddDanhGia