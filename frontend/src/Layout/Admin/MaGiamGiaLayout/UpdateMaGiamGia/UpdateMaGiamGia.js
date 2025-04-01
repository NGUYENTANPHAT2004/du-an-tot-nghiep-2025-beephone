/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from '../../../../components/Modal'
import { useEffect, useState } from 'react'

function UpdateMaGiamGia ({ isOpen, onClose, fetchdata, idmagiamgia }) {
  const [soluong, setsoluong] = useState(0)
  const [phantram, setphantram] = useState(0)
  const [ngaybatdau, setngaybatdau] = useState('')
  const [ngayketthuc, setngayketthuc] = useState('')

  const handelClose = () => {
    setsoluong('')
    onClose()
  }

  const fetchchitiet = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/getchitietmagg/${idmagiamgia}`
      )
      const data = await response.json()
      if (response.ok) {
        setsoluong(data.soluong)
        setphantram(data.sophantram)
        setngaybatdau(data.ngaybatdau ? data.ngaybatdau.split('T')[0] : '')
        setngayketthuc(data.ngayketthuc ? data.ngayketthuc.split('T')[0] : '')
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (idmagiamgia && isOpen) {
      fetchchitiet()
    }
  }, [idmagiamgia, isOpen])

  const handelUpdateMaGiamGia = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/updatemagg/${idmagiamgia}`,
        {
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
        <h2>Cập nhật mã giảm giá</h2>
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
          <button onClick={handelUpdateMaGiamGia} className='btnaddtl'>
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpdateMaGiamGia
