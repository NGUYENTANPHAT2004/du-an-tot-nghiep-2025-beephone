import { useState, useEffect } from 'react'
import { FaEdit, FaPlus } from 'react-icons/fa'

import { FaTrashCan } from 'react-icons/fa6'
import { AddDanhGia } from './AddDanhGia'
import { DuyetDanhGia } from './DuyetDanhGia'
import { XoaDanhGia } from './XoaDanhGia'

function DanhGiaAdminLayout () {
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenDuyetDanhGia, setisOpenDuyetDanhGia] = useState(false)
  const [isOpenXoaDG, setisOpenXoaDG] = useState(false)

  const fetchdata = async () => {
    try {
      const response = await fetch('http://localhost:3005/getdanhgiaadmin')
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
          Thêm đánh giá
        </button>
        <button
          className='btnthemtheloai'
          onClick={() =>
            selectedIds.length > 0
              ? setisOpenDuyetDanhGia(true)
              : alert('Chọn đánh giá để duyệt')
          }
        >
          <FaEdit className='icons' />
          Duyệt đánh giá
        </button>
        <button
          className='btnthemtheloai'
          onClick={() =>
            selectedIds.length > 0
              ? setisOpenXoaDG(true)
              : alert('Chọn đánh giá để xóa')
          }
        >
          <FaTrashCan className='icons' />
          Xóa đánh giá
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
            <th>Tên khách hàng</th>
            <th>Nội dung</th>
            <th>Sao</th>
            <th>Trạng thái</th>
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
              <td>{item.tenkhach}</td>
              <td>{item.content}</td>
              <td>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{ color: i < item.rating ? 'gold' : '#ccc' }}
                  >
                    ★
                  </span>
                ))}
              </td>
              <td>{item.isRead ? 'Đã duyệt' : 'Chưa duyệt'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddDanhGia
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fetchdata={fetchdata}
      />
      <DuyetDanhGia
        isOpen={isOpenDuyetDanhGia}
        onClose={() => setisOpenDuyetDanhGia(false)}
        iddanhgia={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      <XoaDanhGia
        isOpen={isOpenXoaDG}
        onClose={() => setisOpenXoaDG(false)}
        iddanhgia={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
    </div>
  )
}

export default DanhGiaAdminLayout