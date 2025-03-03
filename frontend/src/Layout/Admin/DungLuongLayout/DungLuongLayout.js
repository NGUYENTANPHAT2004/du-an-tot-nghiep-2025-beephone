/* eslint-disable react-hooks/exhaustive-deps */
import { ModalBig } from '../../../components/ModalBig'
import { useState, useEffect } from 'react'
import { FaEdit, FaPlus } from 'react-icons/fa'

import { FaDroplet, FaTrashCan } from 'react-icons/fa6'
import { MauSacLayout } from '../MauSacLayout'
import { AddDungLuong } from './AddDungLuong'
function DungLuongLayout ({ isOpen, onClose, idtheloai }) {
  const [data, setdata] = useState([])
  const [isOpenThem, setIsOpenThem] = useState(false)
  // const [isOpenEdit, setIsOpenEdit] = useState(false)
  // const [isOpenXoa, setIsOpenXoa] = useState(false)
  const [isOpenMauSac, setIsOpenMauSac] = useState(false)

  const [loading, setloading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const fetchdata = async () => {
    if (idtheloai) {
      setloading(true)
      try {
        const response = await fetch(
          `http://localhost:3005/dungluong/${idtheloai}`
        )
        if (response.ok) {
          const data = await response.json()
          setdata(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setloading(false)
      }
    } else {
      setloading(false)
    }
  }

  useEffect(() => {
    if (idtheloai && isOpen) {
      fetchdata()
    }
  }, [idtheloai, isOpen])

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
    <ModalBig
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setSelectedIds([])
        setSelectAll(false)
      }}
    >
      <div>
        <div className='nav_chucnang'>
          <button
            className='btnthemtheloai'
            onClick={() => setIsOpenThem(true)}
          >
            <FaPlus className='icons' />
            Thêm dung lượng
          </button>
          <button
            className='btnthemtheloai'
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Chọn một dung lượng để cập nhật')
              } else if (selectedIds.length > 1) {
                alert('Chỉ được chọn một dung lượng để cập nhật')
              } else {
                setIsOpenEdit(true)
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
                ? setIsOpenXoa(true)
                : alert('Chọn dung lượng để xóa')
            }
          >
            <FaTrashCan className='icons' />
            Xóa dung lượng
          </button>

          <button
            className='btnthemtheloai'
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Chọn một dung lượng để xem màu sắc')
              } else if (selectedIds.length > 1) {
                alert('Chỉ được chọn một dung lượng để xem màu sắc')
              } else {
                setIsOpenMauSac(true)
              }
            }}
          >
            <FaDroplet className='icons' />
            Màu sắc
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
              <th>Tên dung lượng</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan='6'>Đang tải dữ liệu...</td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type='checkbox'
                      checked={selectedIds.includes(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>{item._id}</td>
                  <td>{item.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6'>không có sản phẩm</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <MauSacLayout
        isOpen={isOpenMauSac}
        onClose={() => setIsOpenMauSac(false)}
        iddungluong={selectedIds}
      />
      <AddDungLuong
        isOpen={isOpenThem}
        onClose={() => setIsOpenThem(false)}
        idtheloai={idtheloai}
        fetchdata={fetchdata}
      />
    </ModalBig>
  )
}

export default DungLuongLayout
