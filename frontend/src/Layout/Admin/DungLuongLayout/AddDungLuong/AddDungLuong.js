import { Modal } from '../../../../components/Modal'
import { useState } from 'react'

function AddDungLuong ({ isOpen, onClose, fetchdata, idtheloai }) {
  const [name, setname] = useState('')

  const handelClose = () => {
    setname('')
    onClose()
  }

  const handelAddDungLuong = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/postdungluong/${idtheloai}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name
          })
        }
      )
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
        <h2>Thêm dung lượng</h2>
        <div className='div_input_group'>
          <div className='input-group'>
            <input
              type='text'
              value={name}
              onChange={e => setname(e.target.value)}
              placeholder='Nhập dung lương'
            />
          </div>
        </div>

        <div className='button-group'>
          <button onClick={handelAddDungLuong} className='btnaddtl'>
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddDungLuong
