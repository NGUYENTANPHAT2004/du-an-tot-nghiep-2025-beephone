import { useState, useEffect } from 'react'
import './TheLoaiLayout.scss'
import { FaEdit, FaPlus, FaSignal } from 'react-icons/fa'
import { AddTheLoai } from './AddTheLoai'
import { SanPhamLayout } from '../SanPhamLayout'
import { XoaTheLoai } from './XoaTheLoai'
import { CapNhatTheLoai } from './UpdateTheLoai/CapNhatTheLoai'
import { FaMobile, FaTrashCan } from 'react-icons/fa6'
import { DungLuongLayout } from '../DungLuongLayout'

function TheLoaiLayout () {
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenSp, setisOpenSp] = useState(false)
  const [isOpenXoaTL, setisOpenXoaTL] = useState(false)
  const [isOpenCapNhat, setisOpenCapNhat] = useState(false)
  const [isOpenDungLuong, setisOpenDungLuong] = useState(false)

  const fetchdata = async () => {
    try {
      const response = await fetch('http://localhost:3005/theloaiadmin')
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
          Thêm thể loại
        </button>
        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một thể loại để cập nhật')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một thể loại để cập nhật')
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
              : alert('Chọn thể loại để xóa')
          }
        >
          <FaTrashCan className='icons' />
          Xóa thể loại
        </button>
        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một thể loại để xem sản phẩm')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một thể loại để xem sản phẩm')
            } else {
              setisOpenSp(true)
            }
          }}
        >
          <FaMobile className='icons' />
          Sản Phẩm
        </button>

        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một thể loại để xem dung lượng')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một thể loại để xem dung lượng')
            } else {
              setisOpenDungLuong(true)
            }
          }}
        >
          <FaSignal className='icons' />
          Dung lượng
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
            <th>Tên thể loại</th>
            <th>Ram</th>
            <th>Dung lượng</th>
            <th>Hãng</th>
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
              <td>{item.name}</td>
              <td>{item.ram}</td>
              <td>{item.dungluong}</td>
              <td>{item.hang}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddTheLoai
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fetchdata={fetchdata}
      />
      <SanPhamLayout
        isOpen={isOpenSp}
        onClose={() => setisOpenSp(false)}
        idtheloai={selectedIds}
      />
      <DungLuongLayout
        isOpen={isOpenDungLuong}
        onClose={() => setisOpenDungLuong(false)}
        idtheloai={selectedIds}
      />
      <XoaTheLoai
        isOpen={isOpenXoaTL}
        onClose={() => setisOpenXoaTL(false)}
        idtheloai={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      <CapNhatTheLoai
        isOpen={isOpenCapNhat}
        onClose={() => setisOpenCapNhat(false)}
        idtheloai={selectedIds}
        fetchdata={fetchdata}
      />
    </div>
  )
}

export default TheLoaiLayout