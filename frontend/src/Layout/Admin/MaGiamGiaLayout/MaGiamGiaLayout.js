import { useState, useEffect } from 'react'
import { FaEdit, FaPlus } from 'react-icons/fa'

import {FaTrashCan } from 'react-icons/fa6'
import { AddMaGiamGia } from './AddMaGiamGia'
import { UpdateMaGiamGia } from './UpdateMaGiamGia'
import { XoaMaGiamGia } from './XoaMaGiamGia'

function MaGiamGiaLayout () {
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenXoaTL, setisOpenXoaTL] = useState(false)
  const [isOpenCapNhat, setisOpenCapNhat] = useState(false)

  const fetchdata = async () => {
    try {
      const response = await fetch('http://localhost:3005/getmagg')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchdata()
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(item => item._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectItem = id => {
    let newSelectedIds = [...selectedIds]
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter(itemId => itemId !== id)
    } else {
      newSelectedIds.push(id)
    }
    setSelectedIds(newSelectedIds)

    setSelectAll(newSelectedIds.length === data.length)
  }

  return (
    <div className='theloai_container'>
      <div className='nav_chucnang'>
        <button className='btnthemtheloai' onClick={() => setIsOpen(true)}>
          <FaPlus className='icons' />
          Thêm mã giảm giá
        </button>
        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một mã giảm giá để cập nhật')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một mã giảm giá để cập nhật')
            } else {
              setisOpenCapNhat(true)
            }
          }}
        >
          <FaEdit className='icons' />
          Cập nhật
        </button>
        <button
          className='btnthemtheloai'
          onClick={() =>
            selectedIds.length > 0
              ? setisOpenXoaTL(true)
              : alert('Chọn mã giảm giá để xóa')
          }
        >
          <FaTrashCan className='icons' />
          Xóa mã giảm giá
        </button>

      </div>

      <table className='tablenhap'>
        <thead>
          <tr>
            <th>
              <input
                type='checkbox'
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>STT</th>
            <th>ID</th>
            <th>Mã giảm giá</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Số lượng</th>
            <th>Phần trăm</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id}>
              <td>
                <input
                  type='checkbox'
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelectItem(item._id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{item._id}</td>
              <td>{item.magiamgia}</td>
              <td>{item.ngaybatdau}</td>
              <td>{item.ngayketthuc}</td>
              <td>{item.soluong}</td>
              <td>{item.sophantram}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddMaGiamGia
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fetchdata={fetchdata}
      />


      <XoaMaGiamGia
        isOpen={isOpenXoaTL}
        onClose={() => setisOpenXoaTL(false)}
        idmagiamgia={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      <UpdateMaGiamGia
        isOpen={isOpenCapNhat}
        onClose={() => setisOpenCapNhat(false)}
        idmagiamgia={selectedIds}
        fetchdata={fetchdata}
      />
    </div>
  )
}

export default MaGiamGiaLayout