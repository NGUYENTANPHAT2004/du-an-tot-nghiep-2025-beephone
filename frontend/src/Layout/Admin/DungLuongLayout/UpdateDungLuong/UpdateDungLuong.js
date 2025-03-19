/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from '../../../../components/Modal'
import { useState, useEffect } from 'react'

function UpdateDungLuong ({
  isOpen,
  onClose,
  fetchdata,
  iddungluong,
  setSelectedIds
}) {
  const [name, setname] = useState('')

  const handelClose = () => {
    setname('')
    onClose()
  }

  const fetchchitiet = async (req, res) => {
    try {
      const response = await fetch(
        `http://localhost:3005/geteditdl/${iddungluong}`
      )
      const data = await response.json()
      if (response.ok) {
        setname(data.name)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (iddungluong && isOpen) {
      fetchchitiet()
    }
  }, [iddungluong, isOpen])

  const handelUpdateDungLuong = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/editdungluong/${iddungluong}`,
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
        setSelectedIds([])
        fetchdata()
      }
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={handelClose}>
      <div className='addtheloai'>
        <h2>Cập nhật dung lượng</h2>
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
          <button onClick={handelUpdateDungLuong} className='btnaddtl'>
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpdateDungLuong
