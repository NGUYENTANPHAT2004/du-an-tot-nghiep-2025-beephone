/* eslint-disable react-hooks/exhaustive-deps */
import { ModalBig } from '../../../components/ModalBig'
import { useState, useEffect } from 'react'
import { FaEdit, FaPlus } from 'react-icons/fa'
import { AddSanPham } from './AddSanPham'
import { XoaSanPham } from './XoaSanPham'
import { UpdateSanPham } from './UpdateSanPham'
import { FaTrashCan } from 'react-icons/fa6'

function SanPhamLayout ({ isOpen, onClose, idtheloai }) {
  const [data, setdata] = useState([])
  const [isOpenThem, setIsOpenThem] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)
  const [isOpenXoa, setIsOpenXoa] = useState(false)
  const [loading, setloading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const fetchdata = async () => {
    if (idtheloai) {
      setloading(true)
      try {
        const response = await fetch(
          `http://localhost:3005/getsanpham/${idtheloai}`
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
            Thêm sản phẩm
          </button>
          <button
            className='btnthemtheloai'
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Chọn một sản phẩm để cập nhật')
              } else if (selectedIds.length > 1) {
                alert('Chỉ được chọn một sản phẩm để cập nhật')
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
                : alert('Chọn sản phẩm để xóa')
            }
          >
            <FaTrashCan className='icons' />
            Xóa sản phẩm
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
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
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
                  <td>
                    <img src={`${item.image}`} alt='' />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.price.toLocaleString()}đ</td>
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
      <AddSanPham
        isOpen={isOpenThem}
        onClose={() => setIsOpenThem(false)}
        idtheloai={idtheloai}
        fetchData={fetchdata}
      />
      <UpdateSanPham
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        idsanpham={selectedIds}
        fetchData={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      <XoaSanPham
        isOpen={isOpenXoa}
        onClose={() => setIsOpenXoa(false)}
        idsanpham={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
    </ModalBig>
  )
}

export default SanPhamLayout